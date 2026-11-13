import { useState } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { useWatch } from 'react-hook-form';
import { Separator } from '@clickhouse/click-ui';
import { SourceKind } from '@hyperdx/common-utils/dist/types';
import { Anchor, Box, Button, Group, Stack } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';

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

export function LogTableModelForm(props: TableModelProps) {
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

  const [showOptionalFields, setShowOptionalFields] = useState(false);

  return (
    <>
      <Stack gap="sm">
        <FormRow
          label={t('sourceForm.fields.timestampColumn')}
          helpText={t('sourceForm.helpTexts.timestampColumn')}
        >
          <SQLInlineEditorControlled
            tableConnection={{
              databaseName,
              tableName,
              connectionId,
            }}
            control={control}
            name="timestampValueExpression"
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
            placeholder="Timestamp, Body"
          />
        </FormRow>
        <Box>
          {!showOptionalFields && (
            <Anchor
              underline="always"
              onClick={() => setShowOptionalFields(true)}
              size="xs"
            >
              <Group gap="xs">
                <IconSettings size={14} />
                {t('sourceForm.configureOptionalFields')}
              </Group>
            </Anchor>
          )}
          {showOptionalFields && (
            <Button
              onClick={() => setShowOptionalFields(false)}
              size="xs"
              variant="subtle"
            >
              {t('sourceForm.hideOptionalFields')}
            </Button>
          )}
        </Box>
      </Stack>
      <Stack
        gap="sm"
        style={{
          display: showOptionalFields ? 'flex' : 'none',
        }}
      >
        <Separator size="xs" />
        <ExpressionFormRow
          control={control}
          setValue={setValue}
          name="serviceNameExpression"
          label={t('sourceForm.fields.serviceNameExpression')}
          placeholder="ServiceName"
          columns={columns}
          sourceKind={SourceKind.Log}
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
          sourceKind={SourceKind.Log}
          tableConnection={tableConnection}
        />
        <ExpressionFormRow
          control={control}
          setValue={setValue}
          name="severityTextExpression"
          label={t('sourceForm.fields.logLevelExpression')}
          placeholder="SeverityText"
          columns={columns}
          sourceKind={SourceKind.Log}
          tableConnection={tableConnection}
        />
        <ExpressionFormRow
          control={control}
          setValue={setValue}
          name="severityNumberExpression"
          label={t('sourceForm.fields.severityNumberExpression')}
          placeholder="SeverityNumber"
          helpText={t('sourceForm.helpTexts.severityNumber')}
          columns={columns}
          sourceKind={SourceKind.Log}
          tableConnection={tableConnection}
        />
        <ExpressionFormRow
          control={control}
          setValue={setValue}
          name="bodyExpression"
          label={t('sourceForm.fields.bodyExpression')}
          placeholder="Body"
          columns={columns}
          sourceKind={SourceKind.Log}
          tableConnection={tableConnection}
        />
        <ExpressionFormRow
          control={control}
          setValue={setValue}
          name="eventNameExpression"
          label={t('sourceForm.fields.eventNameExpression')}
          placeholder="EventName"
          helpText={t('sourceForm.helpTexts.eventName')}
          columns={columns}
          sourceKind={SourceKind.Log}
          tableConnection={tableConnection}
        />
        <ExpressionFormRow
          control={control}
          setValue={setValue}
          name="eventAttributesExpression"
          label={t('sourceForm.fields.logAttributesExpression')}
          placeholder="LogAttributes"
          columns={columns}
          sourceKind={SourceKind.Log}
          tableConnection={tableConnection}
        />
        <ExpressionFormRow
          control={control}
          setValue={setValue}
          name="resourceAttributesExpression"
          label={t('sourceForm.fields.resourceAttributesExpression')}
          placeholder="ResourceAttributes"
          columns={columns}
          sourceKind={SourceKind.Log}
          tableConnection={tableConnection}
        />
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
        <FormRow
          label={t('sourceForm.fields.correlatedMetricSource')}
          helpText={t('sourceForm.helpTexts.correlatedMetricSourceLogs', {
            brandName,
          })}
        >
          <SourceSelectControlled control={control} name="metricSourceId" />
        </FormRow>
        <FormRow
          label={t('sourceForm.fields.correlatedTraceSource')}
          helpText={t('sourceForm.helpTexts.correlatedTraceSourceLogs', {
            brandName,
          })}
        >
          <SourceSelectControlled control={control} name="traceSourceId" />
        </FormRow>

        <ExpressionFormRow
          control={control}
          setValue={setValue}
          name="traceIdExpression"
          label={t('sourceForm.fields.traceIdExpression')}
          placeholder="TraceId"
          columns={columns}
          sourceKind={SourceKind.Log}
          tableConnection={tableConnection}
        />
        <ExpressionFormRow
          control={control}
          setValue={setValue}
          name="spanIdExpression"
          label={t('sourceForm.fields.spanIdExpression')}
          placeholder="SpanId"
          columns={columns}
          sourceKind={SourceKind.Log}
          tableConnection={tableConnection}
        />

        <Separator size="xs" />
        {/* <FormRow label={'Table Filter Expression'}>
          <SQLInlineEditorControlled
            tableConnection={{
              databaseName,
              tableName,
              connectionId,
            }}
            control={control}
            name="tableFilterExpression"
            placeholder="ServiceName = 'only_this_service'"
          />
        </FormRow> */}
        <ExpressionFormRow
          control={control}
          setValue={setValue}
          name="implicitColumnExpression"
          label={t('sourceForm.fields.implicitColumnExpression')}
          helpText={t('sourceForm.helpTexts.implicitColumn')}
          placeholder="Body"
          columns={columns}
          sourceKind={SourceKind.Log}
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
        <Separator size="xs" />
        <HighlightedAttributeExpressionsFormRow
          {...props}
          name="highlightedRowAttributeExpressions"
          label={t('sourceForm.fields.highlightedAttributes')}
          helpText={t('sourceForm.helpTexts.highlightedRowAttributes')}
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
    </>
  );
}
