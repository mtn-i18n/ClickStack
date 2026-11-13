import { useTranslation } from 'next-i18next/pages';
import { Controller, useWatch } from 'react-hook-form';
import { Separator } from '@clickhouse/click-ui';
import { SourceKind } from '@hyperdx/common-utils/dist/types';
import { Box, Slider, Stack } from '@mantine/core';

import { useBrandDisplayName } from '@/brand';
import { SourceSelectControlled } from '@/components/SourceSelect';
import { SQLInlineEditorControlled } from '@/components/SQLEditor/SQLInlineEditor';
import { useColumns } from '@/hooks/useMetadata';

import { DEFAULT_DATABASE } from './constants';
import { ExpressionFormRow } from './ExpressionFormRow';
import { FormRow } from './FormRow';
import { HighlightedAttributeExpressionsFormRow } from './HighlightedAttributes';
import {
  MaterializedViewsFormSection,
  MetadataMaterializedViewsFormSection,
} from './MaterializedViews';
import { OrderByFormRow } from './OrderByFormRow';
import { TableModelProps } from './types';
import { UseTextIndexFormRow } from './UseTextIndexFormRow';

export function TraceTableModelForm(props: TableModelProps) {
  const { t } = useTranslation('settings');
  const { control, setValue } = props;
  const brandName = useBrandDisplayName();
  const databaseName = useWatch({
    control,
    name: 'from.databaseName',
    defaultValue: DEFAULT_DATABASE,
  });
  const tableName = useWatch({ control, name: 'from.tableName' });
  const connectionId = useWatch({ control, name: 'connection' });

  const tableConnection = { databaseName, tableName, connectionId };
  const { data: columns } = useColumns({
    databaseName,
    tableName,
    connectionId,
  });

  return (
    <Stack gap="sm">
      <FormRow
        label={t('sourceForm.fields.timestampColumn')}
        helpText={t('sourceForm.helpTexts.timestampColumnSpan')}
      >
        <SQLInlineEditorControlled
          tableConnection={{
            databaseName,
            tableName,
            connectionId,
          }}
          control={control}
          name="timestampValueExpression"
          placeholder="Timestamp"
          disableKeywordAutocomplete
        />
      </FormRow>
      <FormRow
        label={t('sourceForm.fields.defaultSelect')}
        helpText={t('sourceForm.helpTexts.defaultSelect')}
      >
        <SQLInlineEditorControlled
          tableConnection={{
            databaseName,
            tableName,
            connectionId,
          }}
          control={control}
          name="defaultTableSelectExpression"
          placeholder="Timestamp, ServiceName, StatusCode, Duration, SpanName"
        />
      </FormRow>
      <Separator size="xs" />
      <FormRow label={t('sourceForm.fields.durationExpression')}>
        <SQLInlineEditorControlled
          tableConnection={{
            databaseName,
            tableName,
            connectionId,
          }}
          control={control}
          name="durationExpression"
          placeholder={t('sourceForm.durationColumnPlaceholder')}
        />
      </FormRow>
      <FormRow label={t('sourceForm.fields.durationPrecision')}>
        <Box mx="xl">
          <Controller
            control={control}
            name="durationPrecision"
            render={({ field: { onChange, value } }) => (
              <div style={{ width: '90%', marginBottom: 8 }}>
                <Slider
                  color="green"
                  defaultValue={0}
                  min={0}
                  max={9}
                  marks={[
                    { value: 0, label: t('sourceForm.units.seconds') },
                    { value: 3, label: t('sourceForm.units.millisecond') },
                    { value: 6, label: t('sourceForm.units.microsecond') },
                    { value: 9, label: t('sourceForm.units.nanosecond') },
                  ]}
                  value={value}
                  onChange={onChange}
                  // Mantine 9's Slider styles use the pattern
                  // `:where([data-orientation="vertical"]) .<part>`,
                  // which matches when ANY ancestor has
                  // `data-orientation="vertical"`. Mantine Card sets
                  // `data-orientation="vertical"` by default, and the
                  // SourceForm renders inside a Card, so the slider's
                  // trackContainer/track/bar/thumb/markWrapper/
                  // markLabel all pick up the vertical-orientation
                  // styling: the track collapses to 8px wide and the
                  // four marks stack on top of each other. Override
                  // every affected part back to its horizontal
                  // default so the slider renders correctly inside
                  // the Card.
                  styles={{
                    trackContainer: {
                      width: '100%',
                      flexDirection: 'row',
                      height: 'calc(var(--slider-size) * 2)',
                    },
                    track: {
                      width: '100%',
                      height: 'var(--slider-size)',
                    },
                    bar: {
                      top: 0,
                      bottom: 0,
                      height: '100%',
                      insetInlineStart: 'var(--slider-bar-offset)',
                      width: 'var(--slider-bar-width)',
                    },
                    thumb: {
                      left: 'var(--slider-thumb-offset)',
                      top: '50%',
                      right: 'auto',
                      bottom: 'auto',
                      transform: 'translate(-50%, -50%)',
                    },
                    markWrapper: {
                      insetInlineStart:
                        'calc(var(--mark-offset) - var(--slider-size) / 2)',
                      top: 0,
                      bottom: 'auto',
                      width: 'auto',
                    },
                    markLabel: {
                      transform:
                        'translate(calc(-50% + var(--slider-size) / 2), calc(var(--mantine-spacing-xs) / 2))',
                    },
                    label: {
                      top: '-36px',
                      insetInlineStart: 'auto',
                    },
                  }}
                />
              </div>
            )}
          />
        </Box>
      </FormRow>
      <ExpressionFormRow
        control={control}
        setValue={setValue}
        name="traceIdExpression"
        label={t('sourceForm.fields.traceIdExpression')}
        placeholder="TraceId"
        columns={columns}
        sourceKind={SourceKind.Trace}
        tableConnection={tableConnection}
      />
      <ExpressionFormRow
        control={control}
        setValue={setValue}
        name="spanIdExpression"
        label={t('sourceForm.fields.spanIdExpression')}
        placeholder="SpanId"
        columns={columns}
        sourceKind={SourceKind.Trace}
        tableConnection={tableConnection}
      />
      <FormRow label={t('sourceForm.fields.parentSpanIdExpression')}>
        <SQLInlineEditorControlled
          tableConnection={{
            databaseName,
            tableName,
            connectionId,
          }}
          control={control}
          name="parentSpanIdExpression"
          placeholder="ParentSpanId"
        />
      </FormRow>
      <FormRow label={t('sourceForm.fields.spanNameExpression')}>
        <SQLInlineEditorControlled
          tableConnection={{
            databaseName,
            tableName,
            connectionId,
          }}
          control={control}
          name="spanNameExpression"
          placeholder="SpanName"
        />
      </FormRow>
      <FormRow label={t('sourceForm.fields.spanKindExpression')}>
        <SQLInlineEditorControlled
          tableConnection={{
            databaseName,
            tableName,
            connectionId,
          }}
          control={control}
          name="spanKindExpression"
          placeholder="SpanKind"
        />
      </FormRow>
      <Separator size="xs" />
      <FormRow
        label={t('sourceForm.fields.correlatedLogSource')}
        helpText={t('sourceForm.helpTexts.correlatedLogSourceTraces', {
          brandName,
        })}
      >
        <SourceSelectControlled control={control} name="logSourceId" />
      </FormRow>
      <FormRow
        label={t('sourceForm.fields.correlatedSessionSource')}
        helpText={t('sourceForm.helpTexts.correlatedSessionSourceTraces', {
          brandName,
        })}
      >
        <SourceSelectControlled control={control} name="sessionSourceId" />
      </FormRow>
      <FormRow
        label={t('sourceForm.fields.correlatedMetricSource')}
        helpText={t('sourceForm.helpTexts.correlatedMetricSourceTraces', {
          brandName,
        })}
      >
        <SourceSelectControlled control={control} name="metricSourceId" />
      </FormRow>
      <FormRow label={t('sourceForm.fields.statusCodeExpression')}>
        <SQLInlineEditorControlled
          tableConnection={{
            databaseName,
            tableName,
            connectionId,
          }}
          control={control}
          name="statusCodeExpression"
          placeholder="StatusCode"
        />
      </FormRow>
      <FormRow label={t('sourceForm.fields.statusMessageExpression')}>
        <SQLInlineEditorControlled
          tableConnection={{
            databaseName,
            tableName,
            connectionId,
          }}
          control={control}
          name="statusMessageExpression"
          placeholder="StatusMessage"
        />
      </FormRow>
      <ExpressionFormRow
        control={control}
        setValue={setValue}
        name="serviceNameExpression"
        label={t('sourceForm.fields.serviceNameExpression')}
        placeholder="ServiceName"
        columns={columns}
        sourceKind={SourceKind.Trace}
        tableConnection={tableConnection}
      />
      <ExpressionFormRow
        control={control}
        setValue={setValue}
        name="serviceVersionExpression"
        label={t('sourceForm.fields.serviceVersionExpression')}
        placeholder="ResourceAttributes['service.version']"
        helpText={t('sourceForm.helpTexts.serviceVersion')}
        columns={columns}
        sourceKind={SourceKind.Trace}
        tableConnection={tableConnection}
      />
      <ExpressionFormRow
        control={control}
        setValue={setValue}
        name="resourceAttributesExpression"
        label={t('sourceForm.fields.resourceAttributesExpression')}
        placeholder="ResourceAttributes"
        columns={columns}
        sourceKind={SourceKind.Trace}
        tableConnection={tableConnection}
      />
      <ExpressionFormRow
        control={control}
        setValue={setValue}
        name="eventAttributesExpression"
        label={t('sourceForm.fields.eventAttributesExpression')}
        placeholder="SpanAttributes"
        columns={columns}
        sourceKind={SourceKind.Trace}
        tableConnection={tableConnection}
      />
      <FormRow
        label={t('sourceForm.fields.sampleRateExpression')}
        helpText={t('sourceForm.helpTexts.sampleRate')}
      >
        <SQLInlineEditorControlled
          tableConnection={{
            databaseName,
            tableName,
            connectionId,
          }}
          control={control}
          name="sampleRateExpression"
          placeholder="SampleRate"
        />
      </FormRow>
      <FormRow
        label={t('sourceForm.fields.spanEventsExpression')}
        helpText={t('sourceForm.helpTexts.spanEvents')}
      >
        <SQLInlineEditorControlled
          tableConnection={{
            databaseName,
            tableName,
            connectionId,
          }}
          control={control}
          name="spanEventsValueExpression"
          placeholder="Events"
        />
      </FormRow>
      <FormRow
        label={t('sourceForm.fields.spanLinksExpression')}
        helpText={t('sourceForm.helpTexts.spanLinks')}
      >
        <SQLInlineEditorControlled
          tableConnection={{
            databaseName,
            tableName,
            connectionId,
          }}
          control={control}
          name="spanLinksValueExpression"
          placeholder="Links"
        />
      </FormRow>
      <ExpressionFormRow
        control={control}
        setValue={setValue}
        name="implicitColumnExpression"
        label={t('sourceForm.fields.implicitColumnExpression')}
        helpText={t('sourceForm.helpTexts.implicitColumn')}
        placeholder="SpanName"
        columns={columns}
        sourceKind={SourceKind.Trace}
        tableConnection={tableConnection}
      />
      <FormRow
        label={t('sourceForm.fields.knownColumnsList')}
        helpText={t('sourceForm.helpTexts.knownColumns')}
      >
        <SQLInlineEditorControlled
          tableConnection={{
            databaseName,
            tableName,
            connectionId,
          }}
          control={control}
          name="knownColumnsListExpression"
          placeholder="Timestamp, Body, ServiceName"
          disableKeywordAutocomplete
        />
      </FormRow>
      <UseTextIndexFormRow control={control} />
      <FormRow
        label={t('sourceForm.fields.displayedTimestampColumn')}
        helpText={t('sourceForm.helpTexts.displayedTimestamp')}
      >
        <SQLInlineEditorControlled
          tableConnection={{
            databaseName,
            tableName,
            connectionId,
          }}
          control={control}
          name="displayedTimestampValueExpression"
          disableKeywordAutocomplete
        />
      </FormRow>
      <Separator size="xs" />
      <HighlightedAttributeExpressionsFormRow
        {...props}
        name="highlightedRowAttributeExpressions"
        label={t('sourceForm.fields.highlightedAttributes')}
        helpText={t('sourceForm.helpTexts.highlightedRowAttributesTrace')}
      />
      <HighlightedAttributeExpressionsFormRow
        {...props}
        name="highlightedTraceAttributeExpressions"
        label={t('sourceForm.fields.highlightedTraceAttributes')}
        helpText={t('sourceForm.helpTexts.highlightedTraceAttributes')}
      />
      <Separator size="xs" />
      <MaterializedViewsFormSection {...props} />
      <Separator size="xs" />
      <MetadataMaterializedViewsFormSection {...props} />
      <Separator size="xs" />
      <OrderByFormRow
        control={control}
        databaseName={databaseName}
        tableName={tableName}
        connectionId={connectionId}
      />
    </Stack>
  );
}
