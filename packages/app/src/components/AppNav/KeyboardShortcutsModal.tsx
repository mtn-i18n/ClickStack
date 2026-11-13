import React from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Separator } from '@clickhouse/click-ui';
import { Group, Kbd, Modal, Stack, Text } from '@mantine/core';

type ShortcutRow = {
  keys: readonly string[];
  labelKey: string;
  /** Use either key. Default is `chord` (+) for combinations pressed together. */
  keyJoin?: 'or' | 'chord';
};

const SHORTCUTS: ShortcutRow[] = [
  { keys: ['⌘/Ctrl', 'k'], labelKey: 'commandPalette' },
  {
    keys: ['/', 's'],
    labelKey: 'focusSearch',
    keyJoin: 'or',
  },
  { keys: ['d'], labelKey: 'timeRangePicker' },
  {
    keys: ['Enter'],
    labelKey: 'applyTimeRange',
  },
  { keys: ['⌘/Ctrl', 'f'], labelKey: 'findInLogTable' },
  { keys: ['Enter'], labelKey: 'nextFindMatch' },
  { keys: ['Shift', 'Enter'], labelKey: 'previousFindMatch' },
  {
    keys: ['Esc'],
    labelKey: 'closeOverlay',
  },
  {
    keys: ['←', '→'],
    labelKey: 'moveThroughEvents',
    keyJoin: 'or',
  },
  {
    keys: ['↑', '↓'],
    labelKey: 'moveThroughEvents',
    keyJoin: 'or',
  },
  {
    keys: ['k', 'j'],
    labelKey: 'moveThroughEventsVim',
    keyJoin: 'or',
  },
  { keys: ['⌘/Ctrl', 'scroll'], labelKey: 'zoomTraceTimeline' },
  {
    keys: ['⌥/Alt', 'click'],
    labelKey: 'collapseSpanChildren',
  },
  { keys: ['Space'], labelKey: 'playPauseReplay' },
  {
    keys: ['f'],
    labelKey: 'toggleChartFullscreen',
  },
  { keys: ['a'], labelKey: 'toggleChartAssistant' },
  {
    keys: ['Shift', 'click'],
    labelKey: 'selectDashboardTile',
  },
  { keys: ['⌘/Ctrl', 'g'], labelKey: 'groupDashboardTiles' },
];

export const KeyboardShortcutsModal = ({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation('nav');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('keyboardShortcuts')}
      size="lg"
      centered
    >
      <Stack gap={0} data-testid="keyboard-shortcuts-modal">
        {SHORTCUTS.map(({ keys, labelKey, keyJoin = 'chord' }, rowIndex) => (
          <React.Fragment key={rowIndex}>
            <Group justify="space-between" wrap="nowrap" gap="md" py="sm">
              <Group gap={4} wrap="nowrap">
                {keys.map((key, i) => (
                  <React.Fragment key={`${rowIndex}-${i}-${key}`}>
                    {i > 0 && (
                      <Text span size="xs" c="dimmed" tt="lowercase" px={2}>
                        {keyJoin === 'or' ? t('shortcuts.or') : '+'}
                      </Text>
                    )}
                    <Kbd size="xs">{key}</Kbd>
                  </React.Fragment>
                ))}
              </Group>
              <Text size="sm" maw="58%" ta="right">
                {t(`shortcuts.${labelKey}`)}
              </Text>
            </Group>
            {rowIndex < SHORTCUTS.length - 1 ? <Separator size="xs" /> : null}
          </React.Fragment>
        ))}
      </Stack>
    </Modal>
  );
};
