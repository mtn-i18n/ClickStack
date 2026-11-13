import { useMemo, useState } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Group, SegmentedControl, Stack, Text } from '@mantine/core';
import {
  IconBraces,
  IconBrandVisualStudio,
  IconCode,
  IconRobot,
} from '@tabler/icons-react';

import { CopySnippet } from './CopySnippet';
import { DeeplinkInstall } from './DeeplinkInstall';
import {
  buildAllSnippets,
  buildCliInstallCommand,
  type BuiltSnippets,
  type DeploymentShape,
} from './installSnippets';

// ChatGPT is intentionally absent: no native MCP yet, and bridges are a
// user-side decision better tracked in docs than in this UI. Claude Code
// and Codex are configured through shell commands, which would put the key
// in shell history, so the CLI installer above covers them instead.
type AgentHost = 'cursor' | 'vscode-copilot' | 'opencode' | 'other';

interface HostChoice {
  id: AgentHost;
  label: string;
}

const CHOICES: HostChoice[] = [
  { id: 'cursor', label: 'Cursor' },
  { id: 'vscode-copilot', label: 'VS Code' },
  { id: 'opencode', label: 'OpenCode' },
  { id: 'other', label: 'Other' },
];

const HOST_IDS = new Set<string>(CHOICES.map(c => c.id));

function isAgentHost(value: string): value is AgentHost {
  return HOST_IDS.has(value);
}

interface McpInstallPanelProps {
  /** Non-nullable: the caller mounts this only once the deployment is ready. */
  deployment: DeploymentShape;
}

/**
 * Host picker plus the install primitive (CLI command, deep link, or JSON
 * block) for the chosen host. The access key is masked in every snippet.
 */
export default function McpInstallPanel({ deployment }: McpInstallPanelProps) {
  const { t } = useTranslation('settings');
  const [host, setHost] = useState<AgentHost>('cursor');

  const snippets = useMemo(() => buildAllSnippets(deployment), [deployment]);

  return (
    <Stack gap="md">
      <CopySnippet
        label={t('mcpInstall.cliLabel')}
        snippet={buildCliInstallCommand(deployment)}
      />
      <Text size="sm" fw={500}>
        {t('mcpInstall.manualHeading')}
      </Text>
      <SegmentedControl
        fullWidth
        value={host}
        onChange={value => {
          // Narrow the string callback so an out-of-band value can't set an
          // invalid host.
          if (isAgentHost(value)) {
            setHost(value);
          }
        }}
        data={CHOICES.map(c => ({
          value: c.id,
          label: (
            <Group gap="xs" justify="center" wrap="nowrap">
              <HostIcon id={c.id} />
              <Text size="sm">
                {c.id === 'other' ? t('mcpInstall.other') : c.label}
              </Text>
            </Group>
          ),
        }))}
        aria-label={t('mcpInstall.hostAriaLabel')}
      />

      <HostInstall
        host={host}
        snippets={snippets}
        accessKey={deployment.accessKey}
      />
    </Stack>
  );
}

function HostIcon({ id }: { id: AgentHost }) {
  switch (id) {
    case 'cursor':
      return <IconCode size={16} />;
    case 'vscode-copilot':
      return <IconBrandVisualStudio size={16} />;
    case 'opencode':
      return <IconBraces size={16} />;
    case 'other':
      return <IconRobot size={16} />;
  }
  // Exhaustiveness: a new AgentHost variant fails compile here. `return null`
  // keeps a runtime-only unknown variant from crashing the panel.
  id satisfies never;
  return null;
}

interface HostInstallProps {
  host: AgentHost;
  snippets: BuiltSnippets;
  /** Access key masked in every snippet; empty when there's no key. */
  accessKey: string;
}

function HostInstall({ host, snippets, accessKey }: HostInstallProps) {
  const { t } = useTranslation('settings');
  switch (host) {
    case 'cursor':
      return (
        <DeeplinkInstall
          buttonLabel={t('mcpInstall.addToCursor')}
          deeplink={snippets.cursor}
          fallbackLabel={t('mcpInstall.cursorFallback')}
          fallbackSnippet={snippets.jsonBlock}
          fallbackAccessKey={accessKey}
        />
      );

    case 'vscode-copilot':
      return (
        <DeeplinkInstall
          buttonLabel={t('mcpInstall.addToVsCode')}
          deeplink={snippets.vscode}
          fallbackLabel={t('mcpInstall.vscodeFallback')}
          fallbackSnippet={snippets.jsonBlock}
          fallbackAccessKey={accessKey}
          note={
            <Text size="xs" c="dimmed">
              {t('mcpInstall.vscodeNote')}
            </Text>
          }
        />
      );

    case 'opencode':
      return (
        <CopySnippet
          label={t('mcpInstall.opencodeLabel')}
          snippet={snippets.openCode}
          accessKey={accessKey}
        />
      );

    case 'other':
      return (
        <CopySnippet
          label={t('mcpInstall.otherLabel')}
          snippet={snippets.jsonBlock}
          accessKey={accessKey}
        />
      );
  }
  // Exhaustiveness: a new AgentHost variant fails compile here. `return null`
  // keeps a runtime-only unknown variant from crashing the panel.
  host satisfies never;
  return null;
}
