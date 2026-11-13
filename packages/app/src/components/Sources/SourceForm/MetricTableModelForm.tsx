import { useEffect, useRef } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { useWatch } from 'react-hook-form';
import { MetricsDataType, SourceKind } from '@hyperdx/common-utils/dist/types';
import { Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import api from '@/api';
import { useBrandDisplayName } from '@/brand';
import { useTablesDirect } from '@/clickhouse';
import { DBTableSelectControlled } from '@/components/DBTableSelect';
import { SourceSelectControlled } from '@/components/SourceSelect';
import { useMetadataWithSettings } from '@/hooks/useMetadata';
import { useMetricsSeriesTableAvailability } from '@/hooks/useMetricsSeriesTableAvailability';
import { isValidMetricTable, useSource } from '@/source';
import {
  matchMetricTables,
  matchSeriesTable,
} from '@/utils/metricTableAutofill';

import { DEFAULT_DATABASE, OTEL_CLICKHOUSE_EXPRESSIONS } from './constants';
import { FormRow } from './FormRow';
import { MinAutoGranularityFormRow } from './MinAutoGranularityFormRow';
import { TableModelProps } from './types';

export function MetricTableModelForm({
  control,
  setValue,
  sourceId,
}: TableModelProps) {
  const { t } = useTranslation('settings');
  const brandName = useBrandDisplayName();
  const { data: team } = api.useTeam();
  const isMetricsSeriesTableEnabled = !!team?.isMetricsSeriesTableEnabled;
  const databaseName = useWatch({
    control,
    name: 'from.databaseName',
    defaultValue: DEFAULT_DATABASE,
  });
  const connectionId = useWatch({ control, name: 'connection' });
  const metricTables = useWatch({ control, name: 'metricTables' });
  const seriesTable = useWatch({ control, name: 'seriesTable' });
  const prevMetricTablesRef = useRef(metricTables);
  const prevSeriesTableRef = useRef(seriesTable);

  const metadata = useMetadataWithSettings();

  const metricsSeriesTableAvailability = useMetricsSeriesTableAvailability({
    metricTables,
    seriesTable,
    databaseName,
    connectionId,
  });

  useEffect(() => {
    for (const [_key, _value] of Object.entries(OTEL_CLICKHOUSE_EXPRESSIONS)) {
      setValue(_key as any, _value);
    }
  }, [setValue]);

  useEffect(() => {
    (async () => {
      try {
        if (metricTables && prevMetricTablesRef.current) {
          // Check which metric table changed
          for (const metricType of Object.values(MetricsDataType)) {
            const newValue =
              metricTables[metricType as keyof typeof metricTables];
            const prevValue =
              prevMetricTablesRef.current[
                metricType as keyof typeof prevMetricTablesRef.current
              ];

            // Only validate when a table is actually set — clearing a field
            // (newValue falsy) is always a valid state, not an error.
            if (newValue && newValue !== prevValue) {
              const isValid = await isValidMetricTable({
                databaseName,
                tableName: newValue as string,
                connectionId,
                metricType,
                metadata,
              });
              if (!isValid) {
                notifications.show({
                  color: 'red',
                  message: t('sourceForm.metric.invalidSchema', {
                    tableName: newValue,
                    metricType,
                  }),
                });
              }
            }
          }
        }
        prevMetricTablesRef.current = metricTables;
      } catch (e) {
        console.error(e);
        notifications.show({
          color: 'red',
          message: e.message,
        });
      }
    })();
  }, [metricTables, databaseName, connectionId, metadata, t]);

  useEffect(() => {
    (async () => {
      try {
        if (
          isMetricsSeriesTableEnabled &&
          seriesTable &&
          seriesTable !== prevSeriesTableRef.current
        ) {
          const isValid = await isValidMetricTable({
            databaseName,
            tableName: seriesTable,
            connectionId,
            metricType: 'series',
            metadata,
          });
          if (!isValid) {
            notifications.show({
              color: 'red',
              message: t('sourceForm.metric.invalidSeriesSchema', {
                tableName: seriesTable,
              }),
            });
          }
        }
        prevSeriesTableRef.current = seriesTable;
      } catch (e) {
        console.error(e);
        notifications.show({
          color: 'red',
          message: e.message,
        });
      }
    })();
  }, [
    seriesTable,
    databaseName,
    connectionId,
    metadata,
    isMetricsSeriesTableEnabled,
    t,
  ]);

  // Auto-fill metric table dropdowns by matching table names to metric types.
  // One-shot per database+connection pair: runs once when tables load for a
  // new db/connection, then never re-fires for that pair. No clearing of old
  // values — switching databases naturally empties the dropdowns since the
  // new table list won't contain the old names.
  const { data: tablesData } = useTablesDirect(
    { database: databaseName, connectionId: connectionId ?? '' },
    { enabled: !!databaseName && !!connectionId },
  );

  const { data: savedSource } = useSource({ id: sourceId });
  const savedDatabaseName = savedSource?.from?.databaseName;
  const wasSavedAsMetricSource = savedSource?.kind === SourceKind.Metric;
  const isExistingSource = !!sourceId;

  const lastAutofillKeyRef = useRef('');
  const hasLoadedSavedSourceRef = useRef(false);

  useEffect(() => {
    const key = `${databaseName}:${connectionId}`;

    if (isExistingSource && !hasLoadedSavedSourceRef.current) {
      // Until the saved source lands in the form the watched values are still
      // the new-source defaults, so nothing here reflects a user choice yet.
      if (!savedSource) return;
      if (savedDatabaseName && databaseName !== savedDatabaseName) return;
      hasLoadedSavedSourceRef.current = true;
      if (wasSavedAsMetricSource) {
        // Treat the saved database as already handled — only a later switch to
        // a different database triggers autofill.
        lastAutofillKeyRef.current = key;
        return;
      }
    }

    if (key === lastAutofillKeyRef.current) return; // already ran for this db

    const tableNames = tablesData?.data?.map((t: { name: string }) => t.name);
    if (!tableNames || tableNames.length === 0) return;

    const matched = matchMetricTables(
      tableNames,
      (metricTables as Partial<Record<MetricsDataType, string>>) ?? {},
    );

    const entries = Object.entries(matched) as [MetricsDataType, string][];

    // The unified `series` table isn't a MetricsDataType, so it's matched
    // separately and only when the series table feature is enabled for the team.
    const seriesMatch = isMetricsSeriesTableEnabled
      ? matchSeriesTable(tableNames, seriesTable)
      : undefined;

    if (entries.length === 0 && !seriesMatch) return;

    // Mark as done before async work so a rapid db switch doesn't double-fire.
    lastAutofillKeyRef.current = key;

    let cancelled = false;

    (async () => {
      // Validate each candidate before setting it, so we never show a
      // green notification followed by red validation errors.
      const candidates: [MetricsDataType | 'series', string][] = [...entries];
      if (seriesMatch) {
        candidates.push(['series', seriesMatch]);
      }

      const toApply: [string, string][] = [];
      for (const [metricType, tableName] of candidates) {
        if (cancelled) return;
        try {
          const valid = await isValidMetricTable({
            databaseName,
            tableName,
            connectionId,
            metricType,
            metadata,
          });
          if (valid) {
            const path =
              metricType === 'series'
                ? 'seriesTable'
                : `metricTables.${metricType}`;
            toApply.push([path, tableName]);
          }
        } catch {
          // Skip tables that fail validation (e.g. network error)
        }
      }

      if (cancelled || toApply.length === 0) return;

      for (const [path, tableName] of toApply) {
        // shouldDirty so the autofilled value survives a background form
        // reset (e.g. from a `sources` query refetch) — SourceForm's
        // `keepDirtyValues` only preserves fields RHF considers dirty, and
        // plain setValue() doesn't mark a field dirty on its own. Without
        // this, an autofilled table can silently revert to empty later.
        setValue(path as any, tableName, { shouldDirty: true });
      }

      notifications.show({
        color: 'green',
        message: t('sourceForm.metric.autoDetected'),
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tablesData,
    databaseName,
    connectionId,
    metadata,
    isMetricsSeriesTableEnabled,
    isExistingSource,
    savedSource,
    savedDatabaseName,
    wasSavedAsMetricSource,
    t,
  ]);

  return (
    <>
      <Stack gap="sm">
        {Object.values(MetricsDataType).map(metricType => (
          <FormRow
            key={metricType.toLowerCase()}
            label={t('sourceForm.metric.tableLabel', { metricType })}
            helpText={
              metricType === MetricsDataType.ExponentialHistogram ||
              metricType === MetricsDataType.Summary
                ? t('sourceForm.metric.helpUnsupported', {
                    metricType: metricType.toLowerCase(),
                    brandName,
                  })
                : t('sourceForm.metric.help', {
                    metricType: metricType.toLowerCase(),
                  })
            }
          >
            <DBTableSelectControlled
              connectionId={connectionId}
              database={databaseName}
              control={control}
              name={`metricTables.${metricType.toLowerCase()}`}
            />
          </FormRow>
        ))}
        {isMetricsSeriesTableEnabled && (
          <FormRow
            key="series"
            label={t('sourceForm.metric.seriesTableLabel')}
            helpText={t('sourceForm.metric.seriesTableHelp')}
          >
            <DBTableSelectControlled
              connectionId={connectionId}
              database={databaseName}
              control={control}
              name="seriesTable"
            />
            {metricsSeriesTableAvailability.status === 'invalid_series' && (
              <Text c="yellow" size="xs">
                {t('sourceForm.metric.invalidSeriesTable')}
              </Text>
            )}
            {metricsSeriesTableAvailability.status ===
              'missing_series_hash' && (
              <Text c="yellow" size="xs">
                {t('sourceForm.metric.missingSeriesHash', {
                  tables:
                    metricsSeriesTableAvailability.missingSeriesHashTables.join(
                      ', ',
                    ),
                })}
              </Text>
            )}
          </FormRow>
        )}
        <FormRow
          label={t('sourceForm.fields.correlatedLogSource')}
          helpText={t('sourceForm.helpTexts.correlatedLogSourceMetrics', {
            brandName,
          })}
        >
          <SourceSelectControlled control={control} name="logSourceId" />
        </FormRow>
        <MinAutoGranularityFormRow control={control} />
      </Stack>
    </>
  );
}
