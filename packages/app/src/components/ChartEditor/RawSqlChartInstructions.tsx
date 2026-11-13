import { Trans, useTranslation } from 'next-i18next/pages';
import { QUERY_PARAM_EXAMPLES } from '@hyperdx/common-utils/dist/rawSqlParams';
import { ChartVariable, DisplayType } from '@hyperdx/common-utils/dist/types';
import {
  ActionIcon,
  Anchor,
  Code,
  Collapse,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import {
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
} from '@tabler/icons-react';

import { useBrandDisplayName } from '@/brand';
import { useLocalStorage } from '@/utils';

import { getDisplayTypeInstructions } from './constants';
import { RawSqlVariableInstructions } from './RawSqlVariableInstructions';

const HELP_OPENED_KEY = 'hdx-raw-sql-chart-instructions-opened';

export function RawSqlChartInstructions({
  displayType,
  variables,
}: {
  displayType: DisplayType;
  variables?: ChartVariable[];
}) {
  const { t } = useTranslation('dashboards');
  const brandName = useBrandDisplayName();
  const [helpOpened, setHelpOpened] = useLocalStorage<boolean>(
    HELP_OPENED_KEY,
    true,
  );
  const toggleHelp = () => setHelpOpened(v => !v);
  const exampleClipboard = useClipboard({ timeout: 1500 });

  return (
    <Paper
      p="xs"
      radius="sm"
      style={{
        background: 'var(--color-bg-muted)',
      }}
    >
      <Stack gap={0}>
        <Group
          gap="xs"
          align="center"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={toggleHelp}
        >
          {helpOpened ? (
            <IconChevronDown size={12} />
          ) : (
            <IconChevronRight size={12} />
          )}
          <Text size="xs" mt={1}>
            {t('chartEditor.sqlChartInstructions')}
          </Text>
        </Group>
        <Collapse expanded={helpOpened}>
          <Stack gap={6} pl="xs" pt="md">
            {getDisplayTypeInstructions(t)[displayType]}

            <Text size="xs" fw="bold">
              {t('chartEditor.queryParamsMacros')}
            </Text>
            <Text size="xs">
              <Trans
                ns="dashboards"
                i18nKey="chartEditor.queryParamsMacrosDescription"
                values={{ brand: brandName }}
                components={{
                  link: (
                    <Anchor
                      href="https://clickhouse.com/docs/use-cases/observability/clickstack/dashboards/sql-visualizations"
                      target="_blank"
                    />
                  ),
                }}
              />
            </Text>

            <RawSqlVariableInstructions variables={variables} />

            <Text size="xs" fw="bold">
              {t('chartEditor.example')}
            </Text>
            <div style={{ position: 'relative' }}>
              <Tooltip
                label={
                  exampleClipboard.copied
                    ? t('chartEditor.copied')
                    : t('chartEditor.copy')
                }
                withArrow
              >
                <ActionIcon
                  variant="subtle"
                  size="xs"
                  color={exampleClipboard.copied ? 'green' : 'gray'}
                  onClick={() =>
                    exampleClipboard.copy(QUERY_PARAM_EXAMPLES[displayType])
                  }
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    zIndex: 1,
                  }}
                >
                  {exampleClipboard.copied ? (
                    <IconCheck size={10} />
                  ) : (
                    <IconCopy size={10} />
                  )}
                </ActionIcon>
              </Tooltip>
              <Code fz="xs" block>
                {QUERY_PARAM_EXAMPLES[displayType]}
              </Code>
            </div>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}
