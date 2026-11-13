import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Controller, useFieldArray, useWatch } from 'react-hook-form';
import { Separator } from '@clickhouse/click-ui';
import { SourceKind } from '@hyperdx/common-utils/dist/types';
import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Grid,
  Group,
  Select,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconCirclePlus, IconHelpCircle, IconTrash } from '@tabler/icons-react';

import { useBrandDisplayName } from '@/brand';
import { DatabaseSelectControlled } from '@/components/DatabaseSelect';
import { DBTableSelectControlled } from '@/components/DBTableSelect';
import { EDITOR_INPUT_HEIGHTS } from '@/components/editorInputHeights';
import SelectControlled from '@/components/SelectControlled';
import { SQLInlineEditorControlled } from '@/components/SQLEditor/SQLInlineEditor';
import { useMetadataWithSettings } from '@/hooks/useMetadata';
import {
  inferMaterializedViewConfig,
  MV_GRANULARITY_OPTIONS,
} from '@/utils/materializedViews';

import { DEFAULT_DATABASE, MV_AGGREGATE_FUNCTION_OPTIONS } from './constants';
import { FormRow } from './FormRow';
import { TableModelProps } from './types';

/** Component for configuring one or more materialized views */
export function MaterializedViewsFormSection({
  control,
  setValue,
}: TableModelProps) {
  const { t } = useTranslation('settings');
  const databaseName = useWatch({
    control,
    name: `from.databaseName`,
    defaultValue: DEFAULT_DATABASE,
  });

  const {
    fields: materializedViews,
    append: appendMaterializedView,
    remove: removeMaterializedView,
  } = useFieldArray({
    control,
    name: 'materializedViews',
  });

  return (
    <Stack gap="md">
      <FormRow
        label={t('sourceForm.materializedViews.title')}
        helpText={t('sourceForm.materializedViews.help')}
      >
        <Stack gap="md">
          {materializedViews.map((field, index) => (
            <MaterializedViewFormSection
              key={field.id}
              control={control}
              mvIndex={index}
              setValue={setValue}
              onRemove={() => removeMaterializedView(index)}
            />
          ))}

          <Button
            variant="secondary"
            data-testid="add-materialized-view-button"
            onClick={() => {
              appendMaterializedView({
                databaseName: databaseName,
                tableName: '',
                dimensionColumns: '',
                minGranularity: '',
                timestampColumn: '',
                aggregatedColumns: [],
              });
            }}
          >
            <Group>
              <IconCirclePlus size={16} />
              {t('sourceForm.materializedViews.add')}
            </Group>
          </Button>
        </Stack>
      </FormRow>
    </Stack>
  );
}

/** Component for configuring metadata materialized views (key + KV rollups) */
export function MetadataMaterializedViewsFormSection({
  control,
  setValue,
}: TableModelProps) {
  const { t } = useTranslation('settings');
  const databaseName = useWatch({
    control,
    name: `from.databaseName`,
    defaultValue: DEFAULT_DATABASE,
  });
  const connection = useWatch({ control, name: `connection` });

  const metadataMVs = useWatch({
    control,
    name: 'metadataMaterializedViews',
  });

  const hasMetadataMVs = !!metadataMVs;

  return (
    <Stack gap="md">
      <FormRow
        label={t('sourceForm.materializedViews.metadataTitle')}
        helpText={t('sourceForm.materializedViews.metadataHelp')}
      >
        {hasMetadataMVs ? (
          <Stack gap="sm">
            <Group justify="flex-end">
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => setValue('metadataMaterializedViews', undefined)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
            <Grid>
              <Grid.Col span={6}>
                <Text size="xs" mb={4}>
                  {t('sourceForm.materializedViews.keyRollupTable')}
                </Text>
                <DBTableSelectControlled
                  name={'metadataMaterializedViews.keyRollupTable'}
                  control={control}
                  database={databaseName}
                  connectionId={connection}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" mb={4}>
                  {t('sourceForm.materializedViews.kvRollupTable')}
                </Text>
                <DBTableSelectControlled
                  name={'metadataMaterializedViews.kvRollupTable'}
                  control={control}
                  database={databaseName}
                  connectionId={connection}
                />
              </Grid.Col>
            </Grid>
            <SelectControlled
              name={'metadataMaterializedViews.granularity'}
              control={control}
              label={t('sourceForm.materializedViews.granularity')}
              data={MV_GRANULARITY_OPTIONS}
              placeholder={t(
                'sourceForm.materializedViews.granularityPlaceholder',
              )}
            />
          </Stack>
        ) : (
          <Button
            variant="secondary"
            onClick={() =>
              setValue('metadataMaterializedViews', {
                keyRollupTable: '',
                kvRollupTable: '',
                granularity: '',
              })
            }
          >
            <Group>
              <IconCirclePlus size={16} />
              {t('sourceForm.materializedViews.addMetadata')}
            </Group>
          </Button>
        )}
      </FormRow>
    </Stack>
  );
}

/** Component for configuring a single materialized view */
function MaterializedViewFormSection({
  control,
  mvIndex,
  onRemove,
  setValue,
}: { mvIndex: number; onRemove: () => void } & TableModelProps) {
  const { t } = useTranslation('settings');
  const brandName = useBrandDisplayName();
  const connection = useWatch({ control, name: `connection` });
  const sourceDatabaseName = useWatch({
    control,
    name: `from.databaseName`,
    defaultValue: DEFAULT_DATABASE,
  });
  const mvDatabaseName = useWatch({
    control,
    name: `materializedViews.${mvIndex}.databaseName`,
    defaultValue: sourceDatabaseName,
  });
  const mvTableName = useWatch({
    control,
    name: `materializedViews.${mvIndex}.tableName`,
    defaultValue: '',
  });

  return (
    <Stack gap="sm" data-testid="mv-form-section" data-mv-index={mvIndex}>
      <Grid columns={2} flex={1}>
        <Grid.Col span={1}>
          <DatabaseSelectControlled
            control={control}
            name={`materializedViews.${mvIndex}.databaseName`}
            connectionId={connection}
          />
        </Grid.Col>
        <Grid.Col span={1}>
          <Group>
            <Box flex={1} data-testid="mv-table-select">
              <DBTableSelectControlled
                database={mvDatabaseName}
                control={control}
                name={`materializedViews.${mvIndex}.tableName`}
                connectionId={connection}
              />
            </Box>
            <ActionIcon size="sm" onClick={onRemove}>
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Grid.Col>

        <Grid.Col span={2} data-testid="mv-timestamp-column">
          <Text size="xs" fw={500} mb={4}>
            {t('sourceForm.materializedViews.timestampColumn')}
          </Text>
          <SQLInlineEditorControlled
            tableConnection={{
              databaseName: mvDatabaseName,
              tableName: mvTableName,
              connectionId: connection,
            }}
            control={control}
            placeholder="Timestamp"
            name={`materializedViews.${mvIndex}.timestampColumn`}
            disableKeywordAutocomplete
          />
        </Grid.Col>

        <Grid.Col span={1} data-testid="mv-granularity-select">
          <Text size="xs" fw={500} mb={4}>
            {t('sourceForm.materializedViews.granularity')}
            <Tooltip
              label={t('sourceForm.materializedViews.granularityTooltip')}
              color="dark"
              c="white"
              multiline
              maw={600}
            >
              <IconHelpCircle size={14} className="cursor-pointer ms-1" />
            </Tooltip>
          </Text>
          <Controller
            control={control}
            name={`materializedViews.${mvIndex}.minGranularity`}
            render={({ field }) => (
              <Select
                {...field}
                data={MV_GRANULARITY_OPTIONS}
                placeholder={t('sourceForm.materializedViews.granularity')}
                size="sm"
              />
            )}
          />
        </Grid.Col>

        <Grid.Col span={1}>
          <Text size="xs" fw={500} mb={4}>
            {t('sourceForm.materializedViews.minimumDate')}
            <Tooltip
              label={t('sourceForm.materializedViews.minimumDateTooltip', {
                brandName,
              })}
              color="dark"
              c="white"
              multiline
              maw={600}
            >
              <IconHelpCircle size={14} className="cursor-pointer ms-1" />
            </Tooltip>
          </Text>
          <Controller
            control={control}
            name={`materializedViews.${mvIndex}.minDate`}
            render={({ field }) => (
              <DateInput
                {...field}
                value={field.value ? new Date(field.value) : undefined}
                onChange={dateStr =>
                  field.onChange(
                    dateStr ? new Date(dateStr).toISOString() : null,
                  )
                }
                clearable
                highlightToday
                placeholder="YYYY-MM-DD HH:mm:ss"
                valueFormat="YYYY-MM-DD HH:mm:ss"
              />
            )}
          />
        </Grid.Col>
      </Grid>

      <Box data-testid="mv-dimension-columns">
        <Text size="xs" fw={500} mb={4}>
          {t('sourceForm.materializedViews.dimensionColumns')}
          <Tooltip
            label={t('sourceForm.materializedViews.dimensionColumnsTooltip')}
            color="dark"
            c="white"
            multiline
            maw={600}
          >
            <IconHelpCircle size={14} className="cursor-pointer ms-1" />
          </Tooltip>
        </Text>
        <SQLInlineEditorControlled
          tableConnection={{
            databaseName: mvDatabaseName,
            tableName: mvTableName,
            connectionId: connection,
          }}
          control={control}
          name={`materializedViews.${mvIndex}.dimensionColumns`}
          placeholder="ServiceName, StatusCode"
          disableKeywordAutocomplete
        />
      </Box>

      <AggregatedColumnsFormSection
        control={control}
        mvIndex={mvIndex}
        setValue={setValue}
      />
      <Separator size="xs" />
    </Stack>
  );
}

/** Component for configuring the Aggregated Columns list for a single materialized view */
function AggregatedColumnsFormSection({
  control,
  setValue,
  mvIndex,
}: TableModelProps & { mvIndex: number }) {
  const { t } = useTranslation('settings');
  const {
    fields: aggregates,
    append: appendAggregate,
    remove: removeAggregate,
    replace: replaceAggregates,
  } = useFieldArray({
    control,
    name: `materializedViews.${mvIndex}.aggregatedColumns`,
  });

  const addAggregate = useCallback(() => {
    appendAggregate({ sourceColumn: '', aggFn: 'avg', mvColumn: '' });
  }, [appendAggregate]);

  const kind = useWatch({ control, name: 'kind' });
  const connection = useWatch({ control, name: 'connection' });
  const mvTableName = useWatch({
    control,
    name: `materializedViews.${mvIndex}.tableName`,
  });
  const mvDatabaseName = useWatch({
    control,
    name: `materializedViews.${mvIndex}.databaseName`,
  });
  const fromDatabaseName = useWatch({ control, name: 'from.databaseName' });
  const fromTableName = useWatch({ control, name: 'from.tableName' });
  const prevMvTableNameRef = useRef(mvTableName);

  const metadata = useMetadataWithSettings();

  useEffect(() => {
    (async () => {
      try {
        if (mvTableName !== prevMvTableNameRef.current) {
          prevMvTableNameRef.current = mvTableName;

          if (
            (kind === SourceKind.Log || kind === SourceKind.Trace) &&
            connection &&
            mvDatabaseName &&
            mvTableName &&
            fromDatabaseName &&
            fromTableName
          ) {
            const config = await inferMaterializedViewConfig(
              {
                databaseName: mvDatabaseName,
                tableName: mvTableName,
                connectionId: connection,
              },
              {
                databaseName: fromDatabaseName,
                tableName: fromTableName,
                connectionId: connection,
              },
              metadata,
            );

            if (config) {
              setValue(`materializedViews.${mvIndex}`, config);
              replaceAggregates(config.aggregatedColumns ?? []);
              notifications.show({
                color: 'green',
                id: 'mv-infer-success',
                message: t('sourceForm.materializedViews.inferred'),
              });
            } else {
              notifications.show({
                color: 'yellow',
                id: 'mv-infer-failure',
                message: t('sourceForm.materializedViews.inferFailed'),
              });
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [
    mvTableName,
    kind,
    connection,
    mvDatabaseName,
    fromDatabaseName,
    fromTableName,
    mvIndex,
    replaceAggregates,
    setValue,
    metadata,
    t,
  ]);

  return (
    <Box>
      <Text size="xs" mb={4}>
        {t('sourceForm.materializedViews.preAggregatedColumns')}
        <Tooltip
          label={t('sourceForm.materializedViews.preAggregatedColumnsTooltip')}
          color="dark"
          c="white"
          multiline
          maw={600}
        >
          <IconHelpCircle size={14} className="cursor-pointer ms-1" />
        </Tooltip>
      </Text>
      <Grid columns={10} data-testid="mv-aggregated-columns">
        {aggregates.map((field, colIndex) => (
          <AggregatedColumnRow
            key={field.id}
            setValue={setValue}
            control={control}
            mvIndex={mvIndex}
            colIndex={colIndex}
            onRemove={() => removeAggregate(colIndex)}
          />
        ))}
      </Grid>
      <Button
        size="sm"
        variant="secondary"
        onClick={addAggregate}
        mt="lg"
        data-testid="add-aggregated-column-button"
      >
        <Group>
          <IconCirclePlus size={16} />
          {t('sourceForm.materializedViews.addColumn')}
        </Group>
      </Button>
    </Box>
  );
}

/** Component to render one row in the MV Aggregated Columns section */
function AggregatedColumnRow({
  control,
  mvIndex,
  colIndex,
  onRemove,
}: TableModelProps & {
  mvIndex: number;
  colIndex: number;
  onRemove: () => void;
}) {
  const { t } = useTranslation('settings');
  const connectionId = useWatch({ control, name: `connection` });
  const sourceDatabaseName = useWatch({
    control,
    name: `from.databaseName`,
    defaultValue: DEFAULT_DATABASE,
  });
  const sourceTableName = useWatch({ control, name: `from.tableName` });
  const mvDatabaseName = useWatch({
    control,
    name: `materializedViews.${mvIndex}.databaseName`,
    defaultValue: sourceDatabaseName,
  });
  const mvTableName = useWatch({
    control,
    name: `materializedViews.${mvIndex}.tableName`,
  });
  const isCount =
    useWatch({
      control,
      name: `materializedViews.${mvIndex}.aggregatedColumns.${colIndex}.aggFn`,
    }) === 'count';

  return (
    <>
      <Grid.Col
        span={2}
        data-testid="mv-aggregated-column-fn"
        data-col-index={colIndex}
      >
        <SelectControlled
          control={control}
          name={`materializedViews.${mvIndex}.aggregatedColumns.${colIndex}.aggFn`}
          data={MV_AGGREGATE_FUNCTION_OPTIONS}
          size="sm"
        />
      </Grid.Col>
      {!isCount && (
        <Grid.Col span={4}>
          <SQLInlineEditorControlled
            tableConnection={{
              databaseName: sourceDatabaseName,
              tableName: sourceTableName,
              connectionId,
            }}
            control={control}
            name={`materializedViews.${mvIndex}.aggregatedColumns.${colIndex}.sourceColumn`}
            placeholder={t(
              'sourceForm.materializedViews.sourceColumnPlaceholder',
            )}
            disableKeywordAutocomplete
          />
        </Grid.Col>
      )}
      <Grid.Col span={!isCount ? 4 : 8}>
        <Group wrap="nowrap" align="flex-start">
          <Box flex={1}>
            <SQLInlineEditorControlled
              tableConnection={{
                databaseName: mvDatabaseName,
                tableName: mvTableName,
                connectionId,
              }}
              control={control}
              name={`materializedViews.${mvIndex}.aggregatedColumns.${colIndex}.mvColumn`}
              placeholder={t(
                'sourceForm.materializedViews.viewColumnPlaceholder',
              )}
              disableKeywordAutocomplete
            />
          </Box>
          <Flex h={`${EDITOR_INPUT_HEIGHTS.sm}px`} align="center">
            <ActionIcon size="sm" onClick={onRemove}>
              <IconTrash size={16} />
            </ActionIcon>
          </Flex>
        </Group>
      </Grid.Col>
    </>
  );
}
