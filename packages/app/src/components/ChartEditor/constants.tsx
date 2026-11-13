import { ReactNode } from 'react';
import { Trans } from 'next-i18next/pages';
import type { TFunction } from 'i18next';
import { DisplayType } from '@hyperdx/common-utils/dist/types';
import { Code, List, Text } from '@mantine/core';

const TIMESERIES_PLACEHOLDER_SQL = `SELECT
  toStartOfInterval(TimestampTime, INTERVAL {intervalSeconds:Int64} SECOND) AS ts,
  SeverityText,
  count() AS count
FROM
  $__sourceTable
WHERE TimestampTime >= fromUnixTimestamp64Milli({startDateMilliseconds:Int64})
  AND TimestampTime < fromUnixTimestamp64Milli({endDateMilliseconds:Int64})
  AND $__filters
GROUP BY ts, SeverityText
ORDER BY ts ASC;`;

const SINGLE_SERIES_GROUPED_PLACEHOLDER_SQL = `SELECT
  ServiceName,
  count()
FROM
  $__sourceTable
WHERE TimestampTime >= fromUnixTimestamp64Milli({startDateMilliseconds:Int64})
  AND TimestampTime < fromUnixTimestamp64Milli({endDateMilliseconds:Int64})
  AND $__filters
GROUP BY ServiceName;`;

export const SQL_PLACEHOLDERS: Record<DisplayType, string> = {
  [DisplayType.Line]: TIMESERIES_PLACEHOLDER_SQL,
  [DisplayType.StackedBar]: TIMESERIES_PLACEHOLDER_SQL,
  [DisplayType.StackedLine]: TIMESERIES_PLACEHOLDER_SQL,
  [DisplayType.Table]: `SELECT
  count()
FROM
  $__sourceTable
WHERE TimestampTime >= fromUnixTimestamp64Milli({startDateMilliseconds:Int64})
  AND TimestampTime <= fromUnixTimestamp64Milli({endDateMilliseconds:Int64})
  AND $__filters
LIMIT
  200
  `,
  [DisplayType.Pie]: SINGLE_SERIES_GROUPED_PLACEHOLDER_SQL,
  [DisplayType.Bar]: SINGLE_SERIES_GROUPED_PLACEHOLDER_SQL,
  [DisplayType.Number]: `SELECT
  count()
FROM
  $__sourceTable
WHERE TimestampTime >= fromUnixTimestamp64Milli({startDateMilliseconds:Int64})
  AND TimestampTime < fromUnixTimestamp64Milli({endDateMilliseconds:Int64})
  AND $__filters;`,
  [DisplayType.Search]: '',
  [DisplayType.Heatmap]: '',
  [DisplayType.Markdown]: '',
  [DisplayType.EventPatterns]: '',
};

const timeseriesInstructions = (t: TFunction) => (
  <>
    <Text size="xs" fw="bold">
      {t('chartEditor.resultsPlotted')}
    </Text>
    <List size="xs" withPadding spacing={3} mb="xs">
      <List.Item>
        <Text span size="xs" fw={600}>
          {t('chartEditor.timestamp')}
        </Text>
        <Text span size="xs">
          {' '}
          <Trans
            ns="dashboards"
            i18nKey="chartEditor.timestampDescription"
            components={{
              date: <Code fz="xs" />,
              dateTime: <Code fz="xs" />,
            }}
          />
        </Text>
      </List.Item>
      <List.Item>
        <Text span size="xs" fw={600}>
          {t('chartEditor.seriesValue')}
        </Text>
        <Text span size="xs">
          {' '}
          {t('chartEditor.seriesValueDescription')}
        </Text>
      </List.Item>
      <List.Item>
        <Text span size="xs" fw={600}>
          {t('chartEditor.groupNames')}
        </Text>
        <Text span size="xs">
          {' '}
          {t('chartEditor.groupNamesDescription')}
        </Text>
      </List.Item>
    </List>
  </>
);

export const getDisplayTypeInstructions = (
  t: TFunction,
): Partial<Record<DisplayType, ReactNode>> => ({
  [DisplayType.Line]: timeseriesInstructions(t),
  [DisplayType.StackedBar]: timeseriesInstructions(t),
  [DisplayType.StackedLine]: timeseriesInstructions(t),
  [DisplayType.Pie]: (
    <>
      <Text size="xs" fw="bold">
        {t('chartEditor.resultsPlotted')}
      </Text>
      <List size="xs" withPadding spacing={3} mb="xs">
        <List.Item>
          <Text span size="xs" fw={600}>
            {t('chartEditor.sliceValue')}
          </Text>
          <Text span size="xs">
            {' '}
            {t('chartEditor.sliceValueDescription')}
          </Text>
        </List.Item>
        <List.Item>
          <Text span size="xs" fw={600}>
            {t('chartEditor.sliceLabel')}
          </Text>
          <Text span size="xs">
            {' '}
            {t('chartEditor.sliceLabelDescription')}
          </Text>
        </List.Item>
      </List>
    </>
  ),
  [DisplayType.Bar]: (
    <>
      <Text size="xs" fw="bold">
        {t('chartEditor.resultsPlotted')}
      </Text>
      <List size="xs" withPadding spacing={3} mb="xs">
        <List.Item>
          <Text span size="xs" fw={600}>
            {t('chartEditor.barValue')}
          </Text>
          <Text span size="xs">
            {' '}
            {t('chartEditor.barValueDescription')}
          </Text>
        </List.Item>
        <List.Item>
          <Text span size="xs" fw={600}>
            {t('chartEditor.barLabel')}
          </Text>
          <Text span size="xs">
            {' '}
            {t('chartEditor.barLabelDescription')}
          </Text>
        </List.Item>
      </List>
    </>
  ),
  [DisplayType.Number]: (
    <>
      <Text size="xs" fw="bold">
        {t('chartEditor.resultsDisplayed')}
      </Text>
      <List size="xs" withPadding spacing={3} mb="xs">
        <List.Item>
          <Text span size="xs" fw={600}>
            {t('chartEditor.number')}
          </Text>
          <Text span size="xs">
            {' '}
            {t('chartEditor.numberDescription')}
          </Text>
        </List.Item>
      </List>
    </>
  ),
});
