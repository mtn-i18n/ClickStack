import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next/pages';
import {
  Control,
  Controller,
  FieldPath,
  FieldValues,
  PathValue,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import {
  Box,
  Collapse,
  Group,
  NumberInput,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import {
  IconChevronDown,
  IconChevronRight,
  IconInfoCircle,
} from '@tabler/icons-react';

import { parseScheduleStartAtValue } from '@/utils/alerts';

const DATE_TIME_INPUT_FORMAT = 'YYYY-MM-DD HH:mm:ss';

type AlertScheduleFieldsProps<T extends FieldValues> = {
  control: Control<T>;
  setValue: UseFormSetValue<T>;
  scheduleOffsetName: FieldPath<T>;
  scheduleStartAtName: FieldPath<T>;
  scheduleOffsetMinutes: number | null | undefined;
  maxScheduleOffsetMinutes: number;
  offsetWindowLabel: string;
  numConsecutiveWindowsName?: FieldPath<T>;
  numConsecutiveWindows?: number;
};

export function AlertScheduleFields<T extends FieldValues>({
  control,
  setValue,
  scheduleOffsetName,
  scheduleStartAtName,
  scheduleOffsetMinutes,
  maxScheduleOffsetMinutes,
  offsetWindowLabel,
  numConsecutiveWindowsName,
  numConsecutiveWindows,
}: AlertScheduleFieldsProps<T>) {
  const { t } = useTranslation('alerts');
  const showScheduleOffsetInput = maxScheduleOffsetMinutes > 0;
  const scheduleStartAtValue = useWatch({
    control,
    name: scheduleStartAtName,
  }) as string | null | undefined;
  const hasScheduleStartAtAnchor = scheduleStartAtValue != null;
  const hasAdvancedScheduleValues =
    (scheduleOffsetMinutes ?? 0) > 0 ||
    hasScheduleStartAtAnchor ||
    (numConsecutiveWindows ?? 1) > 1;
  const [opened, setOpened] = useState(hasAdvancedScheduleValues);

  useEffect(() => {
    const normalizedOffset = scheduleOffsetMinutes ?? 0;
    if (!showScheduleOffsetInput && normalizedOffset !== 0) {
      setValue(scheduleOffsetName, 0 as PathValue<T, FieldPath<T>>, {
        shouldValidate: true,
      });
      return;
    }
    if (hasScheduleStartAtAnchor && normalizedOffset > 0) {
      setValue(scheduleOffsetName, 0 as PathValue<T, FieldPath<T>>, {
        shouldValidate: true,
      });
    }
  }, [
    hasScheduleStartAtAnchor,
    scheduleOffsetMinutes,
    scheduleOffsetName,
    setValue,
    showScheduleOffsetInput,
  ]);

  return (
    <>
      <UnstyledButton
        onClick={() => setOpened(current => !current)}
        mt="xs"
        data-testid="alert-advanced-settings-toggle"
      >
        <Group gap={4}>
          {opened ? (
            <IconChevronDown size={14} opacity={0.5} />
          ) : (
            <IconChevronRight size={14} opacity={0.5} />
          )}
          <Text size="xs" c="dimmed">
            {t('advancedSettings')}
          </Text>
        </Group>
      </UnstyledButton>
      <Collapse expanded={opened}>
        <Box data-testid="alert-advanced-settings-panel">
          <Text size="xs" c="dimmed" mt="xs">
            {t('scheduleControlsHint')}
          </Text>
          {numConsecutiveWindowsName && (
            <Group gap="xs" mt="xs">
              <Group gap={4}>
                <Text size="sm" opacity={0.7}>
                  {t('consecutiveWindows')}
                </Text>
                <Tooltip
                  label={t('consecutiveWindowsTooltip')}
                  multiline
                  w={260}
                  withArrow
                  zIndex={10050}
                >
                  <Box style={{ lineHeight: 1, cursor: 'help' }}>
                    <IconInfoCircle size={14} opacity={0.4} />
                  </Box>
                </Tooltip>
              </Group>
              <Controller
                control={control}
                name={numConsecutiveWindowsName}
                render={({ field }) => (
                  <NumberInput
                    {...field}
                    value={field.value ?? 1}
                    onChange={v => {
                      const num = typeof v === 'number' ? v : 1;
                      field.onChange(num > 1 ? num : undefined);
                    }}
                    min={1}
                    size="xs"
                    w={70}
                  />
                )}
              />
              <Text size="sm" opacity={0.7}>
                {(numConsecutiveWindows ?? 1) === 1
                  ? t('window')
                  : t('consecutiveWindows')}
              </Text>
            </Group>
          )}
          {showScheduleOffsetInput && (
            <>
              <Group gap="xs" mt="xs">
                <Group gap={4}>
                  <Text size="sm" opacity={0.7}>
                    {t('startOffset')}
                  </Text>
                  <Tooltip
                    label={t('startOffsetTooltip')}
                    multiline
                    w={260}
                    withArrow
                    zIndex={10050}
                  >
                    <Box style={{ lineHeight: 1, cursor: 'help' }}>
                      <IconInfoCircle size={14} opacity={0.4} />
                    </Box>
                  </Tooltip>
                </Group>
                <Controller
                  control={control}
                  name={scheduleOffsetName}
                  render={({ field }) => (
                    <NumberInput
                      min={0}
                      max={maxScheduleOffsetMinutes}
                      step={1}
                      size="xs"
                      w={100}
                      disabled={hasScheduleStartAtAnchor}
                      {...field}
                    />
                  )}
                />
                <Text size="sm" opacity={0.7}>
                  {offsetWindowLabel}
                </Text>
              </Group>
              {hasScheduleStartAtAnchor && (
                <Text size="xs" opacity={0.6} mt={4}>
                  {t('startOffsetIgnored')}
                </Text>
              )}
            </>
          )}
          <Group gap="xs" mt="xs" align="start">
            <Group gap={4} mt={6}>
              <Text size="sm" opacity={0.7}>
                {t('anchorStartTime')}
              </Text>
              <Tooltip
                label={t('anchorStartTimeTooltip')}
                multiline
                w={260}
                withArrow
                zIndex={10050}
              >
                <Box style={{ lineHeight: 1, cursor: 'help' }}>
                  <IconInfoCircle size={14} opacity={0.4} />
                </Box>
              </Tooltip>
            </Group>
            <Controller
              control={control}
              name={scheduleStartAtName}
              render={({ field, fieldState: { error } }) => (
                <DateTimePicker
                  size="xs"
                  valueFormat={DATE_TIME_INPUT_FORMAT}
                  w={260}
                  placeholder={DATE_TIME_INPUT_FORMAT}
                  clearable
                  dropdownType="popover"
                  popoverProps={{ withinPortal: true, zIndex: 10050 }}
                  value={parseScheduleStartAtValue(
                    field.value as string | null | undefined,
                  )}
                  onChange={value =>
                    field.onChange(value ? new Date(value).toISOString() : null)
                  }
                  error={error?.message}
                />
              )}
            />
            <Text size="xs" opacity={0.6} mt={6}>
              {t('localTimeHint')}
            </Text>
          </Group>
        </Box>
      </Collapse>
    </>
  );
}
