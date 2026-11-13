import * as React from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Badge } from '@clickhouse/click-ui';
import { Divider, Group, Modal, Select, Stack, Text } from '@mantine/core';

import { TimeZoneSelect, TimeZoneShortcuts } from './components/TimeZoneSelect';
import { isContentFontSize, OPTIONS_CONTENT_FONT_SIZE } from './config/fonts';
import { LOCALES, useLocale } from './i18n/useLocale';
import {
  DEFAULT_ROW_CLICK_ACTION,
  RowClickAction,
  useContentFontSize,
  UserPreferences,
  useUserPreferences,
} from './useUserPreferences';

const OPTIONS_COLOR_MODE = ['system', 'light', 'dark'] as const;
const OPTIONS_ROW_CLICK_ACTION: RowClickAction[] = ['sidePanel', 'expand'];

const SettingContainer = ({
  label,
  description,
  children,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <Group align="center" justify="space-between">
      <div style={{ flex: 1 }}>
        {label}
        {!!description && (
          <Text size="xs" mt={2} c="var(--color-text-muted)">
            {description}
          </Text>
        )}
      </div>
      <div style={{ flex: 0.8 }}>{children}</div>
    </Group>
  );
};

export const UserPreferencesModal = ({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation('preferences');
  const { locale, setLocale } = useLocale();
  const { userPreferences, setUserPreference } = useUserPreferences();
  const { contentFontSize } = useContentFontSize();

  return (
    <Modal
      title={
        <>
          <span>{t('title')}</span>
          <Text size="xs" mt={6}>
            {t('subtitle')}
          </Text>
        </>
      }
      size="lg"
      padding="lg"
      keepMounted={false}
      opened={opened}
      onClose={onClose}
    >
      <Stack gap="lg">
        <Divider label={t('language')} labelPosition="left" />
        <SettingContainer
          label={t('language')}
          description={t('languageDescription')}
        >
          <Select
            data-testid="language-select"
            value={locale}
            onChange={value => value && setLocale(value as typeof locale)}
            data={LOCALES.map(option => ({
              value: option.value,
              label: option.label,
            }))}
            allowDeselect={false}
          />
        </SettingContainer>

        <Divider label={t('dateAndTime')} labelPosition="left" />
        <SettingContainer label={t('timeFormat')}>
          <Select
            value={userPreferences.timeFormat}
            onChange={value =>
              value &&
              setUserPreference({
                timeFormat: value as UserPreferences['timeFormat'],
              })
            }
            data={['12h', '24h']}
            allowDeselect={false}
          />
        </SettingContainer>
        <SettingContainer
          label={t('timeZone')}
          description={t('timeZoneDescription')}
        >
          <Stack gap={4}>
            <TimeZoneSelect
              data-testid="time-zone-select"
              value={userPreferences.timeZone}
              onChange={timeZone => timeZone && setUserPreference({ timeZone })}
            />
            <TimeZoneShortcuts
              testIdPrefix="time-zone"
              onSelect={timeZone => setUserPreference({ timeZone })}
            />
          </Stack>
        </SettingContainer>

        <Divider label={t('searchResults')} labelPosition="left" mt="sm" />
        <SettingContainer
          label={t('rowClick')}
          description={t('rowClickDescription')}
        >
          <Select
            data-testid="row-click-action-select"
            value={userPreferences.rowClickAction ?? DEFAULT_ROW_CLICK_ACTION}
            onChange={value => {
              const option = OPTIONS_ROW_CLICK_ACTION.find(o => o === value);
              if (option) {
                setUserPreference({ rowClickAction: option });
              }
            }}
            data={OPTIONS_ROW_CLICK_ACTION.map(value => ({
              value,
              label: t(value),
            }))}
            allowDeselect={false}
          />
        </SettingContainer>

        <Divider
          label={
            <Group align="center" gap="xs">
              {t('appearance')}
              <Badge size="sm" text={t('experimental')} state="info" />
            </Group>
          }
          labelPosition="left"
          mt="sm"
        />
        <SettingContainer
          label={t('colorMode')}
          description={t('colorModeDescription')}
        >
          <Select
            value={userPreferences.colorMode}
            onChange={value =>
              value &&
              setUserPreference({
                colorMode: value as UserPreferences['colorMode'],
              })
            }
            data={OPTIONS_COLOR_MODE.map(value => ({
              value,
              label: t(value),
            }))}
            allowDeselect={false}
          />
        </SettingContainer>

        <SettingContainer
          label={t('contentFontSize')}
          description={t('contentFontSizeDescription')}
        >
          <Select
            data-testid="content-font-size-select"
            value={contentFontSize}
            onChange={value =>
              value &&
              isContentFontSize(value) &&
              setUserPreference({ contentFontSize: value })
            }
            data={OPTIONS_CONTENT_FONT_SIZE.map(option => ({
              ...option,
              label: t(`fontSizes.${option.value}`),
            }))}
            allowDeselect={false}
          />
        </SettingContainer>
      </Stack>
    </Modal>
  );
};
