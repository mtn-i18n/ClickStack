import { useCallback, useState } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Separator } from '@clickhouse/click-ui';
import { DEFAULT_METADATA_MAX_ROWS_TO_READ } from '@hyperdx/common-utils/dist/core/metadata';
import { type TeamClickHouseSettings } from '@hyperdx/common-utils/dist/types';
import {
  Box,
  Button,
  Card,
  Group,
  InputLabel,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconHelpCircle, IconPencil } from '@tabler/icons-react';

import api from '@/api';
import { useBrandDisplayName } from '@/brand';
import SelectControlled from '@/components/SelectControlled';
import {
  DEFAULT_FILTER_KEYS_FETCH_LIMIT,
  DEFAULT_QUERY_TIMEOUT,
  DEFAULT_SEARCH_ROW_LIMIT,
} from '@/defaults';

type ClickhouseSettingType = 'number' | 'boolean';

interface ClickhouseSettingFormProps {
  settingKey: keyof TeamClickHouseSettings;
  label: string;
  tooltip?: string;
  type: ClickhouseSettingType;
  defaultValue?: number | string;
  placeholder?: string;
  min?: number;
  max?: number;
  displayValue?: (value: any, defaultValue?: any) => string;
  description?: string;
}

function getFieldErrorMessage(error: unknown): string | undefined {
  return typeof error === 'object' &&
    error != null &&
    'message' in error &&
    typeof error.message === 'string'
    ? error.message
    : undefined;
}

function ClickhouseSettingForm({
  settingKey,
  label,
  tooltip,
  type,
  defaultValue,
  placeholder,
  min,
  max,
  displayValue,
  description,
}: ClickhouseSettingFormProps) {
  const { t } = useTranslation('settings');
  const { data: me, refetch: refetchMe } = api.useMe();
  const updateClickhouseSettings = api.useUpdateClickhouseSettings();
  const hasAdminAccess = true;
  const [isEditing, setIsEditing] = useState(false);
  const currentValue = me?.team[settingKey];

  const form = useForm<{ value: any }>({
    defaultValues: {
      value:
        type === 'boolean' && displayValue != null && currentValue != null
          ? displayValue(currentValue)
          : (currentValue ?? defaultValue ?? ''),
    },
  });

  const onSubmit: SubmitHandler<{ value: any }> = useCallback(
    async values => {
      try {
        const settingValue =
          type === 'boolean'
            ? values.value === displayValue?.(true)
            : Number(values.value);

        updateClickhouseSettings.mutate(
          { [settingKey]: settingValue },
          {
            onError: _e => {
              notifications.show({
                color: 'red',
                message: t('querySettingsForm.updateFailed', { label }),
              });
            },
            onSuccess: () => {
              notifications.show({
                color: 'green',
                message: t('querySettingsForm.updated', { label }),
              });
              refetchMe();
              setIsEditing(false);
            },
          },
        );
      } catch (e) {
        notifications.show({
          color: 'red',
          message:
            e instanceof Error
              ? e.message
              : t('querySettingsForm.updateFailed', { label }),
        });
      }
    },
    [
      refetchMe,
      updateClickhouseSettings,
      settingKey,
      label,
      type,
      displayValue,
      t,
    ],
  );

  const handleReset = useCallback(() => {
    if (defaultValue == null) return;
    updateClickhouseSettings.mutate(
      { [settingKey]: null },
      {
        onError: () => {
          notifications.show({
            color: 'red',
            message: t('querySettingsForm.resetFailed', { label }),
          });
        },
        onSuccess: () => {
          notifications.show({
            color: 'green',
            message: t('querySettingsForm.reset', { label }),
          });
          form.reset({ value: defaultValue });
          refetchMe();
          setIsEditing(false);
        },
      },
    );
  }, [
    refetchMe,
    updateClickhouseSettings,
    settingKey,
    label,
    defaultValue,
    form,
    t,
  ]);

  const isCustomValue = currentValue !== undefined;

  return (
    <Stack gap="xs" mb="md">
      <Group gap="xs">
        <InputLabel size="md">{label}</InputLabel>
        {tooltip && (
          <Tooltip label={tooltip}>
            <Text size="sm" style={{ cursor: 'help' }}>
              <IconHelpCircle size={14} />
            </Text>
          </Tooltip>
        )}
      </Group>
      {description && (
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      )}
      {isEditing && hasAdminAccess ? (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Group>
            {type === 'boolean' && displayValue ? (
              <SelectControlled
                control={form.control}
                name="value"
                data={[displayValue(true), displayValue(false)]}
                size="xs"
                placeholder={t('querySettingsForm.pleaseSelect')}
                withAsterisk
                miw={300}
                readOnly={!isEditing}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    setIsEditing(false);
                  }
                }}
              />
            ) : (
              <TextInput
                size="xs"
                type="number"
                placeholder={
                  placeholder ||
                  currentValue?.toString() ||
                  t('querySettingsForm.enterValue')
                }
                required
                readOnly={!isEditing}
                error={getFieldErrorMessage(form.formState.errors.value)}
                {...form.register('value', {
                  required: true,
                })}
                miw={300}
                min={min}
                max={max}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    setIsEditing(false);
                  }
                }}
              />
            )}
            <Button
              type="submit"
              size="xs"
              variant="primary"
              loading={updateClickhouseSettings.isPending}
            >
              {t('querySettingsForm.save')}
            </Button>
            <Button
              type="button"
              size="xs"
              variant="secondary"
              disabled={updateClickhouseSettings.isPending}
              onClick={() => {
                setIsEditing(false);
              }}
            >
              {t('querySettingsForm.cancel')}
            </Button>
          </Group>
        </form>
      ) : (
        <Group>
          <Text className="text-white">
            {displayValue
              ? displayValue(currentValue, defaultValue)
              : currentValue?.toString() || t('querySettingsForm.notSet')}
          </Text>
          {hasAdminAccess && (
            <Button
              size="xs"
              variant="secondary"
              leftSection={<IconPencil size={16} />}
              onClick={() => setIsEditing(true)}
            >
              {t('querySettingsForm.change')}
            </Button>
          )}
          {hasAdminAccess && isCustomValue && defaultValue != null && (
            <Button
              size="xs"
              variant="subtle"
              loading={updateClickhouseSettings.isPending}
              onClick={handleReset}
            >
              {t('querySettingsForm.resetToDefault')}
            </Button>
          )}
        </Group>
      )}
    </Stack>
  );
}

export default function TeamQueryConfigSection() {
  const { t } = useTranslation('settings');
  const brandName = useBrandDisplayName();
  const displayValueWithUnit =
    (unit: string) => (value: any, defaultValue?: any) =>
      value === undefined || value === defaultValue
        ? `${defaultValue.toLocaleString()} ${unit}`
        : value === 0
          ? t('querySettingsForm.unlimited')
          : `${value.toLocaleString()} ${unit}`;

  return (
    <Box id="team_query_config">
      <Text size="md">{t('querySettingsForm.labels.clientSettings')}</Text>
      <Separator size="lg" />
      <Card>
        <Stack>
          <ClickhouseSettingForm
            settingKey="searchRowLimit"
            label={t('querySettingsForm.labels.searchRowLimit')}
            tooltip={t('querySettingsForm.tooltips.searchRowLimit')}
            type="number"
            defaultValue={DEFAULT_SEARCH_ROW_LIMIT}
            placeholder={t('querySettingsForm.defaultHint', {
              value: DEFAULT_SEARCH_ROW_LIMIT,
            })}
            min={1}
            max={100000}
            displayValue={displayValueWithUnit(
              t('querySettingsForm.units.rows'),
            )}
          />
          <ClickhouseSettingForm
            settingKey="queryTimeout"
            label={t('querySettingsForm.labels.queryTimeout')}
            tooltip={t('querySettingsForm.tooltips.queryTimeout')}
            type="number"
            defaultValue={DEFAULT_QUERY_TIMEOUT}
            placeholder={t('querySettingsForm.defaultHint', {
              value: DEFAULT_QUERY_TIMEOUT,
            })}
            min={0}
            displayValue={displayValueWithUnit(
              t('querySettingsForm.units.seconds'),
            )}
          />
          <ClickhouseSettingForm
            settingKey="metadataMaxRowsToRead"
            label={t('querySettingsForm.labels.metadataMaxRows')}
            tooltip={t('querySettingsForm.tooltips.metadataMaxRows')}
            type="number"
            defaultValue={DEFAULT_METADATA_MAX_ROWS_TO_READ}
            placeholder={t('querySettingsForm.defaultHint', {
              value: DEFAULT_METADATA_MAX_ROWS_TO_READ.toLocaleString(),
            })}
            min={0}
            displayValue={displayValueWithUnit(
              t('querySettingsForm.units.rows'),
            )}
          />
          <ClickhouseSettingForm
            settingKey="filterKeysFetchLimit"
            label={t('querySettingsForm.labels.filterKeysFetchLimit')}
            tooltip={t('querySettingsForm.tooltips.filterKeysFetchLimit')}
            type="number"
            defaultValue={DEFAULT_FILTER_KEYS_FETCH_LIMIT}
            placeholder={t('querySettingsForm.defaultHintPlain', {
              value: DEFAULT_FILTER_KEYS_FETCH_LIMIT,
            })}
            min={1}
            max={1000}
            displayValue={displayValueWithUnit(
              t('querySettingsForm.units.keys'),
            )}
            description={t('querySettingsForm.defaultIs', {
              value: DEFAULT_FILTER_KEYS_FETCH_LIMIT,
            })}
          />
          <ClickhouseSettingForm
            settingKey="fieldMetadataDisabled"
            label={t('querySettingsForm.labels.fieldMetadataQueries')}
            tooltip={t('querySettingsForm.tooltips.fieldMetadataQueries')}
            type="boolean"
            displayValue={value =>
              value
                ? t('querySettingsForm.disabled')
                : t('querySettingsForm.enabled')
            }
          />
          <ClickhouseSettingForm
            settingKey="parallelizeWhenPossible"
            label={t('querySettingsForm.labels.parallelize')}
            tooltip={t('querySettingsForm.tooltips.parallelize', {
              brandName,
            })}
            type="boolean"
            displayValue={value =>
              value
                ? t('querySettingsForm.enabled')
                : t('querySettingsForm.disabled')
            }
          />
        </Stack>
      </Card>
    </Box>
  );
}
