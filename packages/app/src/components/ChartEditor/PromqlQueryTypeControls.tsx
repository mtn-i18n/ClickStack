import { useTranslation } from 'next-i18next/pages';
import { Control, useController } from 'react-hook-form';
import {
  DEFAULT_PROMQL_QUERY_TYPE,
  DEFAULT_PROMQL_REDUCER,
} from '@hyperdx/common-utils/dist/core/promql';
import { PromqlReducer } from '@hyperdx/common-utils/dist/types';
import {
  Anchor,
  Collapse,
  Group,
  SegmentedControl,
  Select,
  Text,
} from '@mantine/core';

import { ChartEditorFormState } from './types';

const REDUCER_OPTIONS: {
  value: PromqlReducer;
  labelKey:
    | 'chartEditor.promql.last'
    | 'chartEditor.promql.min'
    | 'chartEditor.promql.max'
    | 'chartEditor.promql.mean'
    | 'chartEditor.promql.sum'
    | 'chartEditor.promql.count';
}[] = [
  { value: PromqlReducer.LastNotNull, labelKey: 'chartEditor.promql.last' },
  { value: PromqlReducer.Min, labelKey: 'chartEditor.promql.min' },
  { value: PromqlReducer.Max, labelKey: 'chartEditor.promql.max' },
  { value: PromqlReducer.Mean, labelKey: 'chartEditor.promql.mean' },
  { value: PromqlReducer.Sum, labelKey: 'chartEditor.promql.sum' },
  { value: PromqlReducer.Count, labelKey: 'chartEditor.promql.count' },
];

export default function PromqlQueryTypeControls({
  control,
  index,
  isReducerSupported,
  isOpen,
  onToggle,
  onSubmit,
}: {
  control: Control<ChartEditorFormState>;
  index: number;
  isReducerSupported: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onSubmit: (suppressErrorNotification?: boolean) => void;
}) {
  const { t } = useTranslation('dashboards');
  const { field: queryType } = useController({
    control,
    name: `promqlExpressions.${index}.queryType`,
  });
  const { field: reducer } = useController({
    control,
    name: `promqlExpressions.${index}.reducer`,
  });
  const queryTypeValue = queryType.value ?? DEFAULT_PROMQL_QUERY_TYPE;
  const reducerValue = reducer.value ?? DEFAULT_PROMQL_REDUCER;
  const reducerOptions = REDUCER_OPTIONS.map(option => ({
    value: option.value,
    label: t(option.labelKey),
  }));
  const reducerLabel = reducerOptions.find(
    o => o.value === reducerValue,
  )?.label;
  const queryTypeLabel =
    queryTypeValue === 'range'
      ? t('chartEditor.promql.range')
      : t('chartEditor.promql.instant');
  const summary = isReducerSupported
    ? t('chartEditor.promql.settingsWithReducer', {
        queryType: queryTypeLabel,
        reducer: reducerLabel,
      })
    : t('chartEditor.promql.settingsWithoutReducer', {
        queryType: queryTypeLabel,
      });

  return (
    <>
      <Collapse expanded={isOpen}>
        <Group gap="xs" wrap="nowrap" align="center" mt={4}>
          <SegmentedControl
            size="xs"
            data={[
              {
                value: 'instant',
                label: t('chartEditor.promql.instant'),
              },
              { value: 'range', label: t('chartEditor.promql.range') },
            ]}
            value={queryTypeValue}
            onChange={next => {
              queryType.onChange(next);
              onSubmit();
            }}
            data-testid={`promql-query-type-input-${index}`}
          />
          {isReducerSupported && (
            <>
              <Text size="xxs" c="dimmed">
                {t('chartEditor.promql.reducedTo')}
              </Text>
              <Select
                size="xs"
                w={110}
                data={reducerOptions}
                value={reducerValue}
                allowDeselect={false}
                comboboxProps={{ withinPortal: false }}
                aria-label={t('chartEditor.promql.reducerAria')}
                onChange={next => {
                  if (next == null) return;
                  reducer.onChange(next);
                  onSubmit();
                }}
              />
            </>
          )}
        </Group>
      </Collapse>
      <Anchor
        component="button"
        type="button"
        size="xxs"
        onClick={onToggle}
        mt={4}
        display="block"
        data-testid={`promql-query-type-control-${index}`}
      >
        {isOpen ? t('chartEditor.promql.hide') : summary}
      </Anchor>
    </>
  );
}
