import { useTranslation } from 'next-i18next/pages';
import { BackgroundChart } from '@hyperdx/common-utils/dist/types';
import { Box, Select, Text } from '@mantine/core';

import { ColorSwatchInput } from './ColorSwatchInput';

const TYPE_OPTIONS: { value: string; labelKey: string }[] = [
  { value: 'none', labelKey: 'none' },
  { value: 'line', labelKey: 'lineChart' },
  { value: 'area', labelKey: 'areaChart' },
];

/**
 * Editor for a number tile's optional background sparkline. The type select
 * drives the `backgroundChart` config object: "None" clears it, "Line" /
 * "Area" set the shape. The color swatch is an optional palette-token
 * override; when unset the sparkline inherits the tile's static color.
 *
 * `disabled` is set where the tile's query has no buckets to plot -- raw SQL,
 * or a PromQL instant query. The control stays visible but inert with
 * `disabledHint` explaining which, so the option stays discoverable.
 */
export function BackgroundChartInput({
  value,
  onChange,
  disabled = false,
  disabledHint,
}: {
  value?: BackgroundChart;
  onChange: (value: BackgroundChart | undefined) => void;
  disabled?: boolean;
  disabledHint?: string;
}) {
  const { t } = useTranslation('charts');
  const hint = disabledHint ?? t('availableOnBuilderNumberTiles');

  return (
    <Box>
      <Text size="xs" c="dimmed" mb={4}>
        {t('backgroundChart')}
      </Text>
      <Select
        size="xs"
        data={TYPE_OPTIONS.map(option => ({
          value: option.value,
          label: t(option.labelKey),
        }))}
        value={value?.type ?? 'none'}
        disabled={disabled}
        allowDeselect={false}
        comboboxProps={{ withinPortal: false }}
        aria-label={t('backgroundChartTypeAria')}
        onChange={next => {
          if (next === 'line' || next === 'area') {
            onChange({ ...value, type: next });
          } else {
            onChange(undefined);
          }
        }}
      />
      {disabled ? (
        <Text size="xs" c="dimmed" mt={4}>
          {hint}
        </Text>
      ) : (
        value && (
          <Box mt="xs">
            <Text size="xs" c="dimmed" mb={4}>
              {t('backgroundColor')}
            </Text>
            <ColorSwatchInput
              value={value.color}
              onChange={color => onChange({ ...value, color })}
              ariaLabel={t('backgroundChartColorAria')}
            />
          </Box>
        )
      )}
    </Box>
  );
}
