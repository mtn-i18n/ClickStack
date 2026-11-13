import { useMemo } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Badge } from '@clickhouse/click-ui';
import { splitAndTrimWithBracket } from '@hyperdx/common-utils/dist/core/utils';
import { MaterializedViewConfiguration } from '@hyperdx/common-utils/dist/types';
import { Grid, Group, Stack, Table, Text, Tooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

import { FormatTime } from '@/useFormatTime';

export default function MVConfigSummary({
  config,
}: {
  config: MaterializedViewConfiguration;
}) {
  const { t } = useTranslation('settings');
  const dimensionColumnsSplit = useMemo(
    () => splitAndTrimWithBracket(config.dimensionColumns),
    [config.dimensionColumns],
  );

  const columnsAndAggFns = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const { sourceColumn = '', aggFn } of config.aggregatedColumns) {
      if (map.has(sourceColumn)) {
        map.get(sourceColumn)?.push(aggFn);
      } else {
        map.set(sourceColumn, [aggFn]);
      }
    }
    return Array.from(map.entries()).sort(([sourceColA], [sourceColB]) =>
      sourceColA.localeCompare(sourceColB),
    );
  }, [config.aggregatedColumns]);

  return (
    <Stack gap="md">
      <Grid columns={2}>
        <Grid.Col span={1}>
          <Group align="center" mb="xs" gap="xs">
            <Text size="sm" fw={500}>
              {t('sourceForm.materializedViews.granularity')}
            </Text>
            <Tooltip
              multiline
              maw={400}
              label={t('materializedViews.summaryGranularityTooltip')}
            >
              <IconInfoCircle size={16} />
            </Tooltip>
          </Group>

          <Badge size="sm" text={config.minGranularity} state="neutral" />
        </Grid.Col>
        {config.minDate && (
          <Grid.Col span={1}>
            <Text size="sm" fw={500} mb="xs">
              {t('sourceForm.materializedViews.minimumDate')}
            </Text>
            <Badge
              size="sm"
              text={<FormatTime value={config.minDate} format="withYear" />}
              state="neutral"
            />
          </Grid.Col>
        )}
      </Grid>

      <div>
        <Text size="sm" fw={500} mb="xs">
          {t('materializedViews.availableGroupAndFilterColumns')}
        </Text>
        <Group gap="xs">
          {dimensionColumnsSplit.map(col => (
            <Badge key={col} size="sm" text={col} state="neutral" />
          ))}
        </Group>
      </div>

      <div>
        <Text size="sm" fw={500} mb="sm">
          {t('materializedViews.availableAggregatedColumns')}
        </Text>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('materializedViews.column')}</Table.Th>
              <Table.Th>{t('materializedViews.aggregation')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {columnsAndAggFns.map(([sourceColumn, aggFns]) => (
              <Table.Tr key={sourceColumn}>
                <Table.Td>{sourceColumn}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {aggFns.map(aggFn => (
                      <Badge
                        key={aggFn}
                        size="sm"
                        text={aggFn}
                        state="neutral"
                      />
                    ))}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>
    </Stack>
  );
}
