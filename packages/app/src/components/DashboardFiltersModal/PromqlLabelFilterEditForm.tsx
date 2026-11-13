import { useTranslation } from 'next-i18next/pages';
import { Controller, useWatch } from 'react-hook-form';
import {
  DashboardFilter,
  isPromqlSource,
  SourceKind,
} from '@hyperdx/common-utils/dist/types';

import { AutocompleteControlled } from '@/components/InputControlled';
import PromQLEditor from '@/components/PromQLEditor/PromQLEditor';
import { SourceSelectControlled } from '@/components/SourceSelect';
import {
  usePromqlLabelNames,
  usePromqlMetricNames,
} from '@/hooks/usePromqlMetadata';
import { useSources } from '@/source';

import { TOOLTIP_PORTAL_TARGET } from './constants';
import { CustomInputWrapper } from './CustomInputWrapper';
import { FilterFormControl } from './filterFormState';
import { VariableNameInput } from './VariableNameInput';

interface PromqlLabelFilterEditFormProps {
  control: FilterFormControl;
  /** Filters other than the one being edited, used to keep variable names unique. */
  otherFilters: DashboardFilter[];
}

/** Form describing a Prometheus label dashboard filter */
export const PromqlLabelFilterEditForm = ({
  control,
  otherFilters,
}: PromqlLabelFilterEditFormProps) => {
  const { t } = useTranslation('dashboards');
  const { data: sources } = useSources();

  const validatePromqlSource = (value: string) => {
    const source = sources?.find(s => s.id === value);
    if (source && !isPromqlSource(source)) {
      return t('filtersModal.promql.selectPromqlSource');
    }
    return true;
  };

  // Only a PromQL source can answer the label lookup; the form may briefly hold
  // another kind while the user switches types.
  const sourceId = useWatch({ control, name: 'source' });
  const source = sources?.find(s => s.id === sourceId);
  const promqlSource = source && isPromqlSource(source) ? source : undefined;
  const { data: labelNames } = usePromqlLabelNames(promqlSource?.id);
  const { data: metricNames } = usePromqlMetricNames(promqlSource?.id);

  return (
    <>
      <CustomInputWrapper
        label={t('filtersModal.promql.dataSource')}
        tooltipText={t('filtersModal.promql.dataSourceTooltip')}
      >
        <SourceSelectControlled
          control={control}
          name="source"
          data-testid="source-selector"
          rules={{
            required: t('filtersModal.promql.selectPromqlSource'),
            validate: validatePromqlSource,
          }}
          comboboxProps={{ withinPortal: true }}
          allowedSourceKinds={[SourceKind.Promql]}
        />
      </CustomInputWrapper>

      <CustomInputWrapper
        label={t('filtersModal.promql.label')}
        tooltipText={t('filtersModal.promql.labelTooltip')}
      >
        <AutocompleteControlled
          control={control}
          name="label"
          data={labelNames ?? []}
          placeholder="e.g. instance, job, or __name__"
          data-testid="filter-label-input"
          comboboxProps={{ withinPortal: true }}
          rules={{
            required: t('filtersModal.promql.fieldRequired'),
            validate: value =>
              (typeof value === 'string' && value.trim().length > 0) ||
              t('filtersModal.promql.fieldRequired'),
          }}
        />
      </CustomInputWrapper>

      <CustomInputWrapper
        label={t('filtersModal.promql.seriesMatchers')}
        tooltipText={t('filtersModal.promql.seriesMatchersTooltip')}
      >
        <div data-testid="filter-match-input">
          <Controller
            control={control}
            name="match"
            render={({ field: { value, onChange } }) => (
              <PromQLEditor
                value={value ?? ''}
                onChange={onChange}
                placeholder={'e.g. up{job="api"}'}
                metricNames={metricNames}
                parentRef={TOOLTIP_PORTAL_TARGET}
              />
            )}
          />
        </div>
      </CustomInputWrapper>

      <VariableNameInput control={control} otherFilters={otherFilters} />
    </>
  );
};
