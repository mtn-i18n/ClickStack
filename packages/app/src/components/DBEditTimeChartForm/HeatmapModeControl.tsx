import { useTranslation } from 'next-i18next/pages';
import { PromqlHeatmapMode } from '@hyperdx/common-utils/dist/types';
import { Group, SegmentedControl, Stack, Text, Tooltip } from '@mantine/core';
import { IconHelpCircle } from '@tabler/icons-react';

type ModeOption = {
  labelKey: string;
  value: PromqlHeatmapMode;
  helpKey: string;
};

const BUILDER_MODE_OPTIONS: ModeOption[] = [
  {
    labelKey: 'chartEditor.heatmapMode.distribution',
    value: 'distribution',
    helpKey: 'chartEditor.heatmapMode.builderDistributionHelp',
  },
  {
    labelKey: 'chartEditor.heatmapMode.series',
    value: 'series',
    helpKey: 'chartEditor.heatmapMode.builderSeriesHelp',
  },
];

const PROMQL_MODE_OPTIONS: ModeOption[] = [
  {
    labelKey: 'chartEditor.heatmapMode.distribution',
    value: 'distribution',
    helpKey: 'chartEditor.heatmapMode.promqlDistributionHelp',
  },
  {
    labelKey: 'chartEditor.heatmapMode.series',
    value: 'series',
    helpKey: 'chartEditor.heatmapMode.promqlSeriesHelp',
  },
  {
    labelKey: 'chartEditor.heatmapMode.histogram',
    value: 'histogram',
    helpKey: 'chartEditor.heatmapMode.promqlHistogramHelp',
  },
];

/** Histogram mode is offered only where `allowHistogram` is set (PromQL). */
export function HeatmapModeControl<M extends PromqlHeatmapMode>({
  mode,
  onModeChange,
  allowHistogram = false,
}: {
  mode: M;
  onModeChange: (mode: M) => void;
  allowHistogram?: boolean;
}) {
  const { t } = useTranslation('dashboards');
  const rawOptions = allowHistogram
    ? PROMQL_MODE_OPTIONS
    : BUILDER_MODE_OPTIONS;
  const options = rawOptions.map(({ labelKey, value, helpKey }) => ({
    label: t(labelKey),
    value,
    help: t(helpKey),
  }));
  const isOfferedMode = (value: string): value is M =>
    options.some(o => o.value === value);
  return (
    <Group gap="xs">
      <SegmentedControl
        size="xs"
        w="fit-content"
        value={mode}
        onChange={value => {
          if (isOfferedMode(value)) onModeChange(value);
        }}
        data={options.map(({ label, value }) => ({ label, value }))}
        data-testid="heatmap-mode-control"
      />
      <Tooltip
        multiline
        w={320}
        label={
          <Stack gap={4}>
            {options.map(({ label, help }) => (
              <Text key={label} size="xs">
                <b>{label}:</b> {help}
              </Text>
            ))}
          </Stack>
        }
      >
        <IconHelpCircle
          size={16}
          opacity={0.5}
          aria-label={t('chartEditor.heatmapMode.aria')}
          data-testid="heatmap-mode-help"
        />
      </Tooltip>
    </Group>
  );
}
