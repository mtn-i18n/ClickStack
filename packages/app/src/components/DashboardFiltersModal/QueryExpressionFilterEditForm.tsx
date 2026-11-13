import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next/pages';
import {
  Controller,
  useFormState,
  UseFormTrigger,
  useWatch,
} from 'react-hook-form';
import { Separator } from '@clickhouse/click-ui';
import { TableConnection } from '@hyperdx/common-utils/dist/core/metadata';
import {
  hasFilterEffect,
  QUERY_EXPRESSION_FILTER_SOURCE_KINDS,
} from '@hyperdx/common-utils/dist/filters';
import {
  DashboardFilter,
  MetricsDataType,
  SourceKind,
  TSource,
} from '@hyperdx/common-utils/dist/types';
import { Alert, Box, Group, Radio } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

import { CheckBoxControlled } from '@/components/InputControlled';
import SearchWhereInput from '@/components/SearchInput/SearchWhereInput';
import { SourceMultiSelectControlled } from '@/components/SourceMultiSelect';
import SourceSchemaPreview, {
  isSourceSchemaPreviewEnabled,
} from '@/components/SourceSchemaPreview';
import { SourceSelectControlled } from '@/components/SourceSelect';
import { SQLInlineEditorControlled } from '@/components/SQLEditor/SQLInlineEditor';
import { useSource } from '@/source';
import { getMetricTableName } from '@/utils';

import { TOOLTIP_PORTAL_TARGET } from './constants';
import { CustomInputWrapper } from './CustomInputWrapper';
import { FilterFormControl, FilterFormValues } from './filterFormState';
import { VariableNameInput } from './VariableNameInput';

interface QueryExpressionFilterEditFormProps {
  control: FilterFormControl;
  trigger: UseFormTrigger<FilterFormValues>;
  /** Set when the dashboard pins the filter to one source. */
  pinnedSource: TSource | undefined;
  /** Filters other than the one being edited, used to keep variable names unique. */
  otherFilters: DashboardFilter[];
  /** Whether the broadcast / variable controls are available. */
  showVariableOptions: boolean;
}

/**
 * The fields describing where a filter's dropdown values are queried from.
 * `StaticListFilterEditForm` covers the other type; everything the two share
 * lives in the modal above them.
 */
export const QueryExpressionFilterEditForm = ({
  control,
  trigger,
  pinnedSource: presetSource,
  otherFilters,
  showVariableOptions,
}: QueryExpressionFilterEditFormProps) => {
  const { t } = useTranslation('dashboards');
  const sourceId = useWatch({ control, name: 'source' });
  const { data: source } = useSource({ id: sourceId });

  const metricType = useWatch({ control, name: 'sourceMetricType' });
  const tableName = source && getMetricTableName(source, metricType);
  const tableConnection: TableConnection | undefined = tableName
    ? {
        connectionId: source.connection,
        databaseName: source.from.databaseName,
        tableName,
      }
    : undefined;

  const sourceIsMetric = source?.kind === SourceKind.Metric;
  const metricTypes = Object.values(MetricsDataType).filter(type =>
    source?.kind === SourceKind.Metric ? source.metricTables?.[type] : false,
  );

  const [isSourceSchemaPreviewOpen, setIsSourceSchemaPreviewOpen] =
    useState(false);

  const [isBroadcastEnabled, isVariableEnabled, appliesToSourceIds] = useWatch({
    control,
    name: ['isBroadcastEnabled', 'isVariableEnabled', 'appliesToSourceIds'],
  });

  // Both modes on with an unrestricted broadcast is almost always a mistake:
  // broadcast already reaches every tile, so the variable adds nothing and the
  // tiles that reference it get filtered twice over. Scoping the broadcast is
  // what makes the pair meaningful, so nudge toward "Applies to sources".
  const showUnscopedBroadcastWarning =
    showVariableOptions &&
    isBroadcastEnabled !== false &&
    isVariableEnabled === true &&
    !appliesToSourceIds?.some(id => !!id?.length);

  /**
   * Registered on the variable checkbox — the lower of the pair — so the
   * message lands under both controls rather than between them.
   *
   * Skipped when the controls are hidden: the form cannot express the invalid
   * state there (broadcast defaults on, and neither box is reachable), so all
   * an error could do is block a save the user has no way to fix.
   */
  const validateFilterModes = () => {
    if (!showVariableOptions) return true;
    return (
      hasFilterEffect({ isBroadcastEnabled, isVariableEnabled }) ||
      t('filtersModal.queryExpression.filterModesError')
    );
  };

  // The rule spans two checkboxes but its error lives on one, so react-hook-form
  // won't re-run it when the *other* box changes. Re-trigger on both.
  useEffect(() => {
    if (!showVariableOptions) return;
    void trigger('isVariableEnabled');
  }, [isBroadcastEnabled, isVariableEnabled, showVariableOptions, trigger]);

  const { errors } = useFormState({ control });

  return (
    <>
      <CustomInputWrapper
        label={t('filtersModal.queryExpression.dataSource')}
        tooltipText={t('filtersModal.queryExpression.dataSourceTooltip')}
        error={errors.source}
      >
        <SourceSelectControlled
          control={control}
          name="source"
          data-testid="source-selector"
          rules={{ required: true }}
          comboboxProps={{ withinPortal: true }}
          onSchemaPreview={() => setIsSourceSchemaPreviewOpen(true)}
          isSchemaPreviewEnabled={isSourceSchemaPreviewEnabled(source)}
          disabled={!!presetSource}
          allowedSourceKinds={QUERY_EXPRESSION_FILTER_SOURCE_KINDS}
        />
        <SourceSchemaPreview
          source={source}
          controlled
          open={isSourceSchemaPreviewOpen}
          onClose={() => setIsSourceSchemaPreviewOpen(false)}
        />
      </CustomInputWrapper>
      {sourceIsMetric && (
        <CustomInputWrapper
          label={t('filtersModal.queryExpression.metricType')}
          tooltipText={t('filtersModal.queryExpression.metricTypeTooltip')}
          error={errors.sourceMetricType}
        >
          <Controller
            control={control}
            name="sourceMetricType"
            rules={{ required: true }}
            render={({ field: { onChange, value } }) => (
              <Radio.Group
                value={value}
                onChange={v => onChange(v)}
                withAsterisk
              >
                <Group>
                  {metricTypes.map(type => (
                    <Radio key={type} value={type} label={type} />
                  ))}
                </Group>
              </Radio.Group>
            )}
          />
        </CustomInputWrapper>
      )}

      <CustomInputWrapper
        label={t('filtersModal.queryExpression.filterExpression')}
        tooltipText={t('filtersModal.queryExpression.filterExpressionTooltip')}
        error={errors.expression}
      >
        <SQLInlineEditorControlled
          tableConnection={tableConnection}
          sourceId={sourceId}
          control={control}
          name="expression"
          placeholder={t('filtersModal.queryExpression.expressionPlaceholder')}
          enableHotkey
          rules={{ required: true }}
          parentRef={TOOLTIP_PORTAL_TARGET}
        />
      </CustomInputWrapper>

      <CustomInputWrapper
        label={t('filtersModal.queryExpression.dropdownValuesFilter')}
        tooltipText={t('filtersModal.queryExpression.dropdownValuesTooltip')}
      >
        <SearchWhereInput
          tableConnection={tableConnection}
          sourceId={sourceId}
          control={control}
          name="where"
          languageName="whereLanguage"
          allowMultiline={true}
          sqlPlaceholder={t(
            'filtersModal.queryExpression.dropdownValuesPlaceholder',
          )}
          lucenePlaceholder={t(
            'filtersModal.queryExpression.dropdownValuesPlaceholder',
          )}
          enableVariables={showVariableOptions}
          parentRef={TOOLTIP_PORTAL_TARGET}
        />
      </CustomInputWrapper>

      {showVariableOptions && (
        <>
          <Separator size="xs" />
          <CheckBoxControlled
            control={control}
            name="isBroadcastEnabled"
            size="xs"
            label={t('filtersModal.queryExpression.broadcast')}
            description={t('filtersModal.queryExpression.broadcastDescription')}
            data-testid="filter-broadcast-checkbox"
          />
        </>
      )}
      {/**
       * Not available for filters on preset dashboards, always shown when showVariableOptions is disabled,
       * and shown only when the broadcast condition is enabled if showVariableOptions is enabled.
       **/}
      {!presetSource && (!showVariableOptions || isBroadcastEnabled) && (
        <Box ml={showVariableOptions ? 'xl' : undefined}>
          <CustomInputWrapper
            label={t('filtersModal.queryExpression.appliesToSources')}
            tooltipText={t('filtersModal.queryExpression.appliesToTooltip')}
          >
            <SourceMultiSelectControlled
              control={control}
              name="appliesToSourceIds"
              data-testid="applies-to-source-selector"
              comboboxProps={{ withinPortal: true }}
              placeholder={t('filtersModal.queryExpression.allSources')}
              allowedSourceKinds={QUERY_EXPRESSION_FILTER_SOURCE_KINDS}
            />
          </CustomInputWrapper>
        </Box>
      )}
      {showVariableOptions && (
        <>
          <Separator size="xs" />
          <CheckBoxControlled
            control={control}
            name="isVariableEnabled"
            size="xs"
            label={t('filtersModal.queryExpression.availableAsVariable')}
            description={t(
              'filtersModal.queryExpression.availableAsVariableDescription',
            )}
            data-testid="filter-variable-enabled-checkbox"
            rules={{ validate: validateFilterModes }}
          />
          {!!isVariableEnabled && (
            <Box ml="xl">
              <VariableNameInput
                control={control}
                otherFilters={otherFilters}
              />
            </Box>
          )}
          {showUnscopedBroadcastWarning && (
            <Alert
              variant="warning"
              icon={<IconAlertTriangle size={16} />}
              data-testid="filter-unscoped-broadcast-warning"
            >
              {t('filtersModal.queryExpression.unscopedBroadcastWarning')}
            </Alert>
          )}
        </>
      )}
    </>
  );
};
