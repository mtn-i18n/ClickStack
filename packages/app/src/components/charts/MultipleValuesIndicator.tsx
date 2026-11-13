import { useTranslation } from 'next-i18next/pages';
import { Tooltip } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface MultipleValuesIndicatorProps {
  seriesCount: number;
  /** How to collapse several series into one. */
  multipleSeriesHint?: string;
}

/** Warns that a single-value chart got several series back, each with its own value. */
export default function MultipleValuesIndicator({
  seriesCount,
  multipleSeriesHint,
}: MultipleValuesIndicatorProps) {
  const { t } = useTranslation('charts');

  if (seriesCount <= 1) {
    return null;
  }

  const label = multipleSeriesHint
    ? t('multipleValuesWithHint', {
        total: seriesCount.toLocaleString(),
        hint: multipleSeriesHint,
      })
    : t('multipleValues', { total: seriesCount.toLocaleString() });

  return (
    <Tooltip multiline maw={500} label={label}>
      <IconAlertTriangle
        size={16}
        color="var(--color-text-warning)"
        aria-label={t('queryReturnedSeries', {
          total: seriesCount.toLocaleString(),
        })}
        data-testid="multiple-values-indicator"
      />
    </Tooltip>
  );
}
