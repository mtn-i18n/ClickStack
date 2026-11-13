import { useTranslation } from 'next-i18next/pages';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface HiddenSeriesIndicatorProps {
  hiddenSeriesCount: number;
  renderedSeriesCount: number;
  /** Render every series, bypassing the cap. Omit to keep the notice passive. */
  onLoadAll?: () => void;
  /** How to reduce cardinality when "load all" isn't offered. Defaults to SQL advice. */
  reduceCardinalityHint?: string;
}

/**
 * Warns that the chart returned more series than the client renders. The
 * transform caps series to protect memory; this surfaces the dropped ones and,
 * when `onLoadAll` is provided, lets the user render all of them anyway.
 */
export default function HiddenSeriesIndicator({
  hiddenSeriesCount,
  renderedSeriesCount,
  onLoadAll,
  reduceCardinalityHint,
}: HiddenSeriesIndicatorProps) {
  const { t } = useTranslation('charts');

  if (hiddenSeriesCount <= 0) {
    return null;
  }

  const total = renderedSeriesCount + hiddenSeriesCount;
  const label = onLoadAll
    ? t('hiddenSeriesWarningLoadAll', {
        total: total.toLocaleString(),
        hidden: hiddenSeriesCount.toLocaleString(),
        rendered: renderedSeriesCount.toLocaleString(),
      })
    : t('hiddenSeriesWarningHint', {
        total: total.toLocaleString(),
        hidden: hiddenSeriesCount.toLocaleString(),
        rendered: renderedSeriesCount.toLocaleString(),
        hint: reduceCardinalityHint ?? t('reduceCardinalityHint'),
      });

  const icon = (
    <IconAlertTriangle size={16} color="var(--color-text-warning)" />
  );

  return (
    <Tooltip multiline maw={500} label={label}>
      {onLoadAll ? (
        <ActionIcon
          variant="subtle"
          size="sm"
          onClick={onLoadAll}
          // Toolbar sits in react-grid-layout's drag subtree; stop propagation
          // (as ChartContainer does) so a click doesn't start a tile drag.
          onMouseDown={e => e.stopPropagation()}
          aria-label={t('loadAllSeries', { total: total.toLocaleString() })}
        >
          {icon}
        </ActionIcon>
      ) : (
        icon
      )}
    </Tooltip>
  );
}
