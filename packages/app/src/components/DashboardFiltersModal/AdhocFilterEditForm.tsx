import { useMemo } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Controller, UseFormSetValue, useWatch } from 'react-hook-form';
import { Separator } from '@clickhouse/click-ui';
import { tcFromSource } from '@hyperdx/common-utils/dist/core/metadata';
import { getAdhocFilterSourceKinds } from '@hyperdx/common-utils/dist/filters';
import {
  AdhocFilterSourceType,
  DashboardFilter,
  SourceKind,
} from '@hyperdx/common-utils/dist/types';
import { Box, SegmentedControl } from '@mantine/core';

import { CheckBoxControlled } from '@/components/InputControlled';
import SearchWhereInput from '@/components/SearchInput/SearchWhereInput';
import { SourceMultiSelectControlled } from '@/components/SourceMultiSelect';
import { IS_PROMQL_ENABLED } from '@/config';
import { useSources } from '@/source';

import { TOOLTIP_PORTAL_TARGET } from './constants';
import { CustomInputWrapper } from './CustomInputWrapper';
import { FilterFormControl, FilterFormValues } from './filterFormState';
import { VariableNameInput } from './VariableNameInput';

const SOURCE_TYPE_OPTIONS: { value: AdhocFilterSourceType; label: string }[] = [
  { value: 'sql', label: 'ClickHouse' },
  { value: 'promql', label: 'Prometheus' },
];

interface AdhocFilterEditFormProps {
  control: FilterFormControl;
  setValue: UseFormSetValue<FilterFormValues>;
  /** Filters other than the one being edited, used to keep variable names unique. */
  otherFilters: DashboardFilter[];
}

/** Form describing an ad hoc dashboard filter */
export const AdhocFilterEditForm = ({
  control,
  setValue,
  otherFilters,
}: AdhocFilterEditFormProps) => {
  const { t } = useTranslation('dashboards');
  const { data: allSources } = useSources();
  const [sourceType, isBroadcastEnabled, sourceIds] = useWatch({
    control,
    name: ['sourceType', 'isBroadcastEnabled', 'sources'],
  });
  const allowedSourceKinds = getAdhocFilterSourceKinds(sourceType);
  const tableConnections = useMemo(
    () =>
      (allSources ?? [])
        .filter(source => sourceIds?.includes(source.id))
        .map(tcFromSource),
    [allSources, sourceIds],
  );
  // Kept visible for a saved PromQL filter so its source type can be changed
  const showSourceType =
    sourceType === 'promql' ||
    (IS_PROMQL_ENABLED &&
      !!allSources?.some(s => s.kind === SourceKind.Promql));

  // The multi-selects hide sources of other kinds, which the form can still
  // hold after switching from another filter type.
  const validateSourceKinds = (ids: string[] | undefined) => {
    const hasOtherKind = ids?.some(id => {
      const source = allSources?.find(s => s.id === id);
      return source && !allowedSourceKinds.includes(source.kind);
    });
    return (
      !hasOtherKind ||
      (sourceType === 'promql'
        ? t('filtersModal.adhoc.selectOnlyPromql')
        : t('filtersModal.adhoc.selectOnlyLogTraceSession'))
    );
  };

  return (
    <>
      {showSourceType && (
        <CustomInputWrapper
          label={t('filtersModal.adhoc.sourceType')}
          tooltipText={t('filtersModal.adhoc.sourceTypeTooltip')}
        >
          <Controller
            control={control}
            name="sourceType"
            render={({ field: { value, onChange } }) => (
              <SegmentedControl
                size="xs"
                value={value}
                onChange={next => {
                  onChange(next);
                  // Sources of the previous type can't be kept
                  setValue('sources', [], { shouldDirty: true });
                  setValue('appliesToSourceIds', [], { shouldDirty: true });
                }}
                data={SOURCE_TYPE_OPTIONS}
                data-testid="adhoc-filter-source-type"
              />
            )}
          />
        </CustomInputWrapper>
      )}
      <CustomInputWrapper
        label={t('filtersModal.adhoc.dataSources')}
        tooltipText={t('filtersModal.adhoc.dataSourcesTooltip')}
      >
        <SourceMultiSelectControlled
          control={control}
          name="sources"
          data-testid="adhoc-filter-sources"
          comboboxProps={{ withinPortal: true }}
          placeholder={t('filtersModal.adhoc.selectSources')}
          allowedSourceKinds={allowedSourceKinds}
          rules={{
            validate: (value: string[] | undefined) =>
              !value?.length
                ? t('filtersModal.adhoc.selectAtLeastOneSource')
                : validateSourceKinds(value),
          }}
        />
      </CustomInputWrapper>
      {sourceType === 'sql' && (
        <CustomInputWrapper
          label={t('filtersModal.adhoc.keysValuesFilter')}
          tooltipText={t('filtersModal.adhoc.keysValuesTooltip')}
        >
          <SearchWhereInput
            tableConnections={tableConnections}
            control={control}
            name="where"
            languageName="whereLanguage"
            allowMultiline={true}
            sqlPlaceholder={t('filtersModal.adhoc.keysValuesPlaceholder')}
            lucenePlaceholder={t('filtersModal.adhoc.keysValuesPlaceholder')}
            enableVariables
            parentRef={TOOLTIP_PORTAL_TARGET}
          />
        </CustomInputWrapper>
      )}

      <Separator size="xs" />
      <CheckBoxControlled
        control={control}
        name="isBroadcastEnabled"
        size="xs"
        label={t('filtersModal.adhoc.broadcast')}
        description={
          sourceType === 'promql'
            ? t('filtersModal.adhoc.broadcastPromqlDescription')
            : t('filtersModal.adhoc.broadcastDescription')
        }
        data-testid="filter-broadcast-checkbox"
      />
      {isBroadcastEnabled && (
        <Box ml="xl">
          <CustomInputWrapper
            label={t('filtersModal.adhoc.appliesToSources')}
            tooltipText={t('filtersModal.adhoc.appliesToTooltip')}
          >
            <SourceMultiSelectControlled
              control={control}
              name="appliesToSourceIds"
              data-testid="applies-to-source-selector"
              comboboxProps={{ withinPortal: true }}
              placeholder={t('filtersModal.adhoc.sameAsDataSources')}
              allowedSourceKinds={allowedSourceKinds}
              rules={{ validate: validateSourceKinds }}
            />
          </CustomInputWrapper>
        </Box>
      )}
      <Separator size="xs" />
      <VariableNameInput control={control} otherFilters={otherFilters} />
    </>
  );
};
