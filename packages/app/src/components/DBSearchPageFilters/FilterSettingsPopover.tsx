import { useState } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Separator } from '@clickhouse/click-ui';
import {
  ActionIcon,
  Checkbox,
  Flex,
  Popover,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';

function SettingsPopover({
  target,
  children,
}: {
  target: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Popover width={250} trapFocus position="right" withArrow shadow="md">
      <Popover.Target>{target}</Popover.Target>
      <Popover.Dropdown>{children}</Popover.Dropdown>
    </Popover>
  );
}

/**
 * Global filter settings gear icon — shown next to the "Filters" header.
 * Controls visibility of the shared filters section and filter counts.
 */
export function FilterSettingsPanel({
  isSharedFiltersVisible,
  onSharedFiltersVisibilityChange,
  showFilterCounts,
  onShowFilterCountsChange,
  hasPersonalPins,
  onResetPersonalPins,
  hasSharedPins,
  onResetSharedFilters,
  showAllValues,
  onShowAllValuesChange,
}: {
  isSharedFiltersVisible: boolean;
  onSharedFiltersVisibilityChange: (visible: boolean) => void;
  showFilterCounts: boolean;
  onShowFilterCountsChange: (show: boolean) => void;
  hasPersonalPins: boolean;
  onResetPersonalPins: VoidFunction;
  hasSharedPins: boolean;
  onResetSharedFilters: VoidFunction;
  showAllValues: boolean;
  onShowAllValuesChange: (show: boolean) => void;
}) {
  const { t } = useTranslation('search');
  const showResetSection = hasPersonalPins || hasSharedPins;

  return (
    <SettingsPopover
      target={
        <Tooltip
          label={t('filterSettings.title')}
          position="top"
          withArrow
          fz="xxs"
          color="gray"
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            size="xs"
            aria-label={t('filterSettings.title')}
          >
            <IconSettings size={14} />
          </ActionIcon>
        </Tooltip>
      }
    >
      <Flex direction="column" gap="xs">
        <Text size="sm" fw={500}>
          {t('filterSettings.title')}
        </Text>
        <Separator size="xs" />
        <Checkbox
          label={t('filterSettings.showSharedFilters')}
          labelPosition="left"
          size="xs"
          styles={{ labelWrapper: { width: '100%' } }}
          checked={isSharedFiltersVisible}
          onChange={e =>
            onSharedFiltersVisibilityChange(e.currentTarget.checked)
          }
        />
        <Checkbox
          label={t('filterSettings.showFilterCounts')}
          labelPosition="left"
          size="xs"
          styles={{ labelWrapper: { width: '100%' } }}
          checked={showFilterCounts}
          onChange={e => onShowFilterCountsChange(e.currentTarget.checked)}
        />
        <Tooltip
          label={t('filterSettings.showAllValuesTooltip')}
          multiline
          w={220}
          position="bottom"
          withArrow
          fz="xxs"
          color="gray"
        >
          <Checkbox
            label={t('filterSettings.showAllValues')}
            labelPosition="left"
            size="xs"
            styles={{ labelWrapper: { width: '100%' } }}
            checked={showAllValues}
            onChange={e => onShowAllValuesChange(e.currentTarget.checked)}
          />
        </Tooltip>
        {showResetSection && (
          <>
            <Separator size="xs" />
            {hasPersonalPins && (
              <ResetAction
                label={t('filterSettings.resetMyPins')}
                confirmationText={t('filterSettings.resetMyPinsConfirm')}
                onReset={onResetPersonalPins}
              />
            )}
            {hasSharedPins && (
              <ResetAction
                label={t('filterSettings.resetSharedFilters')}
                confirmationText={t('filterSettings.resetSharedFiltersConfirm')}
                onReset={onResetSharedFilters}
              />
            )}
          </>
        )}
      </Flex>
    </SettingsPopover>
  );
}

function ResetAction({
  label,
  confirmationText,
  onReset,
}: {
  label: string;
  confirmationText: string;
  onReset: VoidFunction;
}) {
  const { t } = useTranslation('search');
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <Flex direction="column" gap={4}>
        <Text size="xs" c="yellow">
          {confirmationText}
        </Text>
        <Flex gap="xs">
          <UnstyledButton
            onClick={() => {
              onReset();
              setConfirming(false);
            }}
          >
            <Text size="xs" c="red" fw={500}>
              {t('common:actions.confirm')}
            </Text>
          </UnstyledButton>
          <UnstyledButton onClick={() => setConfirming(false)}>
            <Text size="xs" c="dimmed">
              {t('common:actions.cancel')}
            </Text>
          </UnstyledButton>
        </Flex>
      </Flex>
    );
  }

  return (
    <UnstyledButton onClick={() => setConfirming(true)}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </UnstyledButton>
  );
}
