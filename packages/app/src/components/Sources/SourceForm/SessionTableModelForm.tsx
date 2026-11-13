import { useEffect, useRef } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { useWatch } from 'react-hook-form';
import { Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { useBrandDisplayName } from '@/brand';
import { SourceSelectControlled } from '@/components/SourceSelect';
import { SQLInlineEditorControlled } from '@/components/SQLEditor/SQLInlineEditor';
import { useMetadataWithSettings } from '@/hooks/useMetadata';
import { isValidSessionsTable } from '@/source';

import { DEFAULT_DATABASE } from './constants';
import { FormRow } from './FormRow';
import { TableModelProps } from './types';

export function SessionTableModelForm({ control }: TableModelProps) {
  const { t } = useTranslation('settings');
  const brandName = useBrandDisplayName();
  const databaseName = useWatch({
    control,
    name: 'from.databaseName',
    defaultValue: DEFAULT_DATABASE,
  });
  const connectionId = useWatch({ control, name: 'connection' });
  const tableName = useWatch({ control, name: 'from.tableName' });
  const prevTableNameRef = useRef(tableName);
  const metadata = useMetadataWithSettings();

  useEffect(() => {
    (async () => {
      try {
        if (tableName && tableName !== prevTableNameRef.current) {
          prevTableNameRef.current = tableName;
          const isValid = await isValidSessionsTable({
            databaseName,
            tableName,
            connectionId,
            metadata,
          });

          if (!isValid) {
            notifications.show({
              color: 'red',
              message: t('sourceForm.session.invalidSchema', { tableName }),
            });
          }
        }
      } catch (e) {
        console.error(e);
        notifications.show({
          color: 'red',
          message: e.message,
        });
      }
    })();
  }, [tableName, databaseName, connectionId, metadata, t]);

  return (
    <>
      <Stack gap="sm">
        <FormRow
          label={t('sourceForm.fields.correlatedTraceSource')}
          helpText={t('sourceForm.helpTexts.correlatedTraceSourceSessions', {
            brandName,
          })}
        >
          <SourceSelectControlled control={control} name="traceSourceId" />
        </FormRow>
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
        <FormRow label={t('sourceForm.fields.resourceAttributesExpression')}>
          <SQLInlineEditorControlled
            tableConnection={{
              databaseName,
              tableName,
              connectionId,
            }}
            control={control}
            name="resourceAttributesExpression"
            placeholder="ResourceAttributes"
          />
        </FormRow>
      </Stack>
    </>
  );
}
