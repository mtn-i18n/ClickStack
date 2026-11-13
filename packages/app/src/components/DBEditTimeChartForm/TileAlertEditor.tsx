import { useTranslation } from 'next-i18next/pages';
import {
  Control,
  Controller,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import { Badge } from '@clickhouse/click-ui';
import { formatTileAlertDisplayName } from '@hyperdx/common-utils/dist/alerts';
import {
  AlertThresholdType,
  isRangeThresholdType,
} from '@hyperdx/common-utils/dist/types';
import {
  ActionIcon,
  Alert,
  Box,
  Group,
  NativeSelect,
  NumberInput,
  Paper,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconHelpCircle,
  IconInfoCircleFilled,
  IconTrash,
  IconX,
} from '@tabler/icons-react';

import api from '@/api';
import { AlertDisplayFields } from '@/components/AlertDisplayFields';
import { AlertNoteField } from '@/components/AlertNoteField';
import {
  AlertPanelActions,
  AlertPanelFill,
  useAlertPanel,
} from '@/components/AlertPanel';
import { AlertChannelForm } from '@/components/Alerts';
import { AckAlert } from '@/components/alerts/AckAlert';
import { AlertHistoryCardList } from '@/components/alerts/AlertHistoryCards';
import { AlertScheduleFields } from '@/components/AlertScheduleFields';
import { ChartEditorFormState } from '@/components/ChartEditor/types';
import { useDashboards } from '@/dashboard';
import { useConfirm } from '@/useConfirm';
import { optionsToSelectData } from '@/utils';
import {
  ALERT_CHANNEL_OPTIONS,
  intervalToMinutes,
  TILE_ALERT_INTERVAL_OPTIONS,
  TILE_ALERT_THRESHOLD_TYPE_OPTIONS,
} from '@/utils/alerts';

export function TileAlertEditor({
  control,
  setValue,
  alert,
  dashboardId,
  onRemove,
  error,
  warning,
  tooltip,
}: {
  control: Control<ChartEditorFormState>;
  setValue: UseFormSetValue<ChartEditorFormState>;
  alert: NonNullable<ChartEditorFormState['alert']>;
  dashboardId?: string;
  /** Omit to hide the remove control, for surfaces that require an alert. */
  onRemove?: () => void;
  error?: string;
  warning?: string;
  tooltip?: string;
}) {
  const { t } = useTranslation('dashboards');
  const alertPanel = useAlertPanel();
  const confirm = useConfirm();

  // Removing closes the panel along with its discard control, so the removal
  // can't be undone from there the way other alert edits can.
  const handleRemove = async () => {
    if (
      await confirm(
        t('chartEditor.tileAlert.removeConfirm'),
        t('chartEditor.tileAlert.remove'),
        {
          variant: 'danger',
        },
      )
    ) {
      onRemove?.();
    }
  };

  const alertThresholdType = useWatch({ control, name: 'alert.thresholdType' });
  const alertThreshold = useWatch({ control, name: 'alert.threshold' });
  const alertThresholdMax = useWatch({ control, name: 'alert.thresholdMax' });
  const alertScheduleOffsetMinutes = useWatch({
    control,
    name: 'alert.scheduleOffsetMinutes',
  });
  const alertnumConsecutiveWindows = useWatch({
    control,
    name: 'alert.numConsecutiveWindows',
  });
  const maxAlertScheduleOffsetMinutes = alert?.interval
    ? Math.max(intervalToMinutes(alert.interval) - 1, 0)
    : 0;
  const alertIntervalLabel = alert?.interval
    ? TILE_ALERT_INTERVAL_OPTIONS[alert.interval]
    : undefined;

  const { data: alertData } = api.useAlert(alert.id);
  const alertItem = alertData?.data;

  const tileName = useWatch({ control, name: 'name' });
  const { data: dashboards } = useDashboards();
  const dashboardName = dashboards?.find(d => d.id === dashboardId)?.name;
  const derivedDisplayName = dashboardName
    ? formatTileAlertDisplayName(dashboardName, tileName)
    : undefined;
  // No dashboard behind the editor means the alert is inline (the chart
  // explorer, or the inline-alert modal). It has no tile to inherit a name or
  // tags from, so the user names it and an unset tag list means none.
  const isInline = dashboardId == null;

  return (
    <AlertPanelFill>
      <Paper data-testid="alert-details">
        <Group justify="space-between" wrap="nowrap" px="sm" pt="sm" pb="sm">
          <Group gap={4} align="center">
            <Text size="sm" fw={500} mt={2}>
              {t('chartEditor.tileAlert.title')}
            </Text>
            {tooltip && (
              <Tooltip label={tooltip} withArrow>
                <IconHelpCircle size={16} opacity={0.5} />
              </Tooltip>
            )}
            {error && (
              <Tooltip label={error} withArrow>
                <Badge
                  size="sm"
                  text={t('chartEditor.tileAlert.invalidQuery')}
                  state="danger"
                  style={{ marginLeft: 'var(--mantine-spacing-xs)' }}
                />
              </Tooltip>
            )}
            {warning && (
              <Tooltip label={warning} withArrow>
                <Badge
                  size="sm"
                  text={t('chartEditor.tileAlert.warning')}
                  state="warning"
                  style={{ marginLeft: 'var(--mantine-spacing-xs)' }}
                />
              </Tooltip>
            )}
          </Group>
          <Group gap="xs" wrap="nowrap">
            {alertItem && <AlertHistoryCardList alert={alertItem} />}
            {alertItem && <AckAlert alert={alertItem} />}
            {onRemove && (
              <Tooltip label={t('chartEditor.tileAlert.removeAlert')}>
                <ActionIcon
                  variant="danger"
                  color="red"
                  size="sm"
                  onClick={handleRemove}
                  data-testid="remove-alert-button"
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            )}
            {alertPanel && (
              <Tooltip
                label={
                  alertPanel.isDraft
                    ? t('chartEditor.tileAlert.discardAlert')
                    : t('chartEditor.tileAlert.discardChanges')
                }
              >
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={alertPanel.close}
                  aria-label={
                    alertPanel.isDraft
                      ? t('chartEditor.tileAlert.discardAlert')
                      : t('chartEditor.tileAlert.discardChanges')
                  }
                  data-testid="close-alert-panel-button"
                >
                  <IconX size={14} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
        <Box px="sm" pb="sm">
          <Group gap="xs">
            <Text size="sm" opacity={0.7}>
              {t('chartEditor.tileAlert.triggerWhenValue')}
            </Text>
            <Controller
              control={control}
              name="alert.thresholdType"
              render={({ field }) => (
                <NativeSelect
                  data={optionsToSelectData(TILE_ALERT_THRESHOLD_TYPE_OPTIONS)}
                  size="xs"
                  {...field}
                  onChange={e => {
                    field.onChange(e);
                    if (
                      isRangeThresholdType(e.currentTarget.value) &&
                      alertThresholdMax == null
                    ) {
                      setValue('alert.thresholdMax', (alertThreshold ?? 0) + 1);
                    }
                  }}
                />
              )}
            />
            <Controller
              control={control}
              name="alert.threshold"
              render={({ field }) => (
                <NumberInput size="xs" w={80} {...field} />
              )}
            />
            {isRangeThresholdType(alertThresholdType as AlertThresholdType) && (
              <>
                <Text size="sm" opacity={0.7}>
                  {t('chartEditor.tileAlert.and')}
                </Text>
                <Controller
                  control={control}
                  name="alert.thresholdMax"
                  render={({ field, fieldState }) => (
                    <NumberInput
                      size="xs"
                      w={80}
                      {...field}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </>
            )}
            {t('chartEditor.tileAlert.over')}
            <Controller
              control={control}
              name="alert.interval"
              render={({ field }) => (
                <NativeSelect
                  data={optionsToSelectData(TILE_ALERT_INTERVAL_OPTIONS)}
                  size="xs"
                  {...field}
                />
              )}
            />
            <Text size="sm" opacity={0.7}>
              {t('chartEditor.tileAlert.via')}
            </Text>
            <Controller
              control={control}
              name="alert.channels.0.type"
              render={({ field }) => (
                <NativeSelect
                  data={optionsToSelectData(ALERT_CHANNEL_OPTIONS)}
                  size="xs"
                  {...field}
                />
              )}
            />
          </Group>
          {alert?.createdBy && (
            <Text size="xs" opacity={0.6} mt="xs">
              {t('chartEditor.tileAlert.createdBy', {
                name: alert.createdBy.name || alert.createdBy.email,
              })}
            </Text>
          )}
          <AlertDisplayFields
            control={control}
            displayNameName="alert.displayName"
            tagsName="alert.tags"
            derivedDisplayName={derivedDisplayName}
            displayNameRequired={isInline}
            tagsInherit={!isInline}
          />
          <AlertScheduleFields
            control={control}
            setValue={setValue}
            scheduleOffsetName="alert.scheduleOffsetMinutes"
            scheduleStartAtName="alert.scheduleStartAt"
            scheduleOffsetMinutes={alertScheduleOffsetMinutes}
            maxScheduleOffsetMinutes={maxAlertScheduleOffsetMinutes}
            offsetWindowLabel={
              alertIntervalLabel
                ? t('chartEditor.tileAlert.windowFromInterval', {
                    interval: alertIntervalLabel,
                  })
                : t('chartEditor.tileAlert.windowFromAlert')
            }
            numConsecutiveWindowsName="alert.numConsecutiveWindows"
            numConsecutiveWindows={alertnumConsecutiveWindows ?? undefined}
          />
          <Text size="xxs" opacity={0.5} mb={4} mt="sm">
            {t('chartEditor.tileAlert.sendTo')}
          </Text>
          <AlertChannelForm control={control} channelsName="alert.channels" />
          <AlertNoteField
            control={control}
            name="alert.note"
            labelMarginTop="sm"
          />
          {(alertThresholdType === AlertThresholdType.EQUAL ||
            alertThresholdType === AlertThresholdType.NOT_EQUAL) && (
            <Alert
              icon={<IconInfoCircleFilled size={16} />}
              color="gray"
              py="xs"
              mt="md"
            >
              {t('chartEditor.tileAlert.equalityNote')}
            </Alert>
          )}
          <AlertPanelActions />
        </Box>
      </Paper>
    </AlertPanelFill>
  );
}
