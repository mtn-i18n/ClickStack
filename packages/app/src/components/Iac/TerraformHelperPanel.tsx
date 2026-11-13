import { useState } from 'react';
import { Trans, useTranslation } from 'next-i18next/pages';
import { Badge } from '@clickhouse/click-ui';
import {
  Anchor,
  Collapse,
  Group,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';

import { CopySnippet } from '@/components/ClickStackOnboarding/CopySnippet';

export type TerraformSnippet = {
  label: string;
  snippet: string;
  /** Render behind a toggle — for boilerplate most users only need once. */
  collapsible?: boolean;
  /** Shown above the snippet when collapsible, explaining when it's needed. */
  hint?: string;
};

// Snippets can run long. Capping the area keeps the popover from resizing
// (and re-anchoring) as content grows.
const SNIPPETS_MAX_HEIGHT = 360;

/**
 * A snippet tucked behind a toggle, following the `DeeplinkInstall` idiom.
 * Used for the provider block: Terraform allows only one `required_providers`
 * and one default provider config per module, so most users need it once and
 * pasting it again is an error rather than a convenience.
 */
function CollapsibleSnippet({ snippet }: { snippet: TerraformSnippet }) {
  const { t } = useTranslation('settings');
  const [opened, setOpened] = useState(false);
  return (
    <Stack gap="xs">
      <Anchor component="button" size="sm" onClick={() => setOpened(v => !v)}>
        {t(opened ? 'iac.hideLabel' : 'iac.showLabel', {
          label: snippet.label.toLowerCase(),
        })}
      </Anchor>
      <Collapse expanded={opened} transitionDuration={150}>
        <Stack gap="xs">
          {snippet.hint && (
            <Text size="xs" style={{ color: 'var(--color-text-muted)' }}>
              {snippet.hint}
            </Text>
          )}
          <CopySnippet label={snippet.label} snippet={snippet.snippet} />
        </Stack>
      </Collapse>
    </Stack>
  );
}

/**
 * Presentational panel for Terraform snippets. Takes fully-built strings, so
 * it needs no data fetching and its stories need no mocking — callers own
 * generation via `@hyperdx/common-utils/dist/iac`.
 */
export function TerraformHelperPanel({
  snippets,
}: {
  snippets: TerraformSnippet[];
}) {
  const { t } = useTranslation('settings');
  return (
    <Stack gap="sm" data-testid="terraform-helper-panel">
      <Group gap="xs">
        <Text size="sm" fw={500}>
          Terraform
        </Text>
        <Badge size="sm" text={t('iac.experimental')} state="info" />
      </Group>
      <Text size="xs" style={{ color: 'var(--color-text-muted)' }}>
        <Trans
          i18nKey="iac.alphaNotice"
          components={{
            code: (
              <Text span ff="monospace" size="xs">
                terraform plan -generate-config-out
              </Text>
            ),
          }}
        />
      </Text>
      <ScrollArea.Autosize
        mah={SNIPPETS_MAX_HEIGHT}
        type="auto"
        offsetScrollbars
      >
        <Stack gap="sm">
          {snippets.map(s =>
            s.collapsible ? (
              <CollapsibleSnippet key={s.label} snippet={s} />
            ) : (
              <Stack key={s.label} gap="xs">
                <CopySnippet label={s.label} snippet={s.snippet} />
                {s.hint && (
                  <Text size="xs" style={{ color: 'var(--color-text-muted)' }}>
                    {s.hint}
                  </Text>
                )}
              </Stack>
            ),
          )}
        </Stack>
      </ScrollArea.Autosize>
    </Stack>
  );
}
