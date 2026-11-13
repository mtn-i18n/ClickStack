import { useTranslation } from 'next-i18next/pages';
import { Box, SegmentedControl, Text } from '@mantine/core';

import type { HeatmapScaleType } from './heatmapGrid';

const SCALE_OPTIONS: { labelKey: string; value: HeatmapScaleType }[] = [
  { labelKey: 'scaleLog', value: 'log' },
  { labelKey: 'scaleLinear', value: 'linear' },
];

export function HeatmapScaleControl({
  value,
  onChange,
}: {
  value: HeatmapScaleType;
  onChange: (value: HeatmapScaleType) => void;
}) {
  const { t } = useTranslation('charts');

  return (
    <Box>
      <Text size="xs" mb={4}>
        {t('yAxisScale')}
      </Text>
      <SegmentedControl
        size="xs"
        value={value}
        onChange={v => {
          if (v === 'log' || v === 'linear') onChange(v);
        }}
        data={SCALE_OPTIONS.map(({ labelKey, value: optionValue }) => ({
          label: t(labelKey),
          value: optionValue,
        }))}
        data-testid="heatmap-scale-control"
      />
    </Box>
  );
}
