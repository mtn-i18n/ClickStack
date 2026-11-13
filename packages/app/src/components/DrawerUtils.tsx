import * as React from 'react';
import { useTranslation } from 'next-i18next/pages';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  ActionIcon,
  Box,
  CloseButton,
  Group,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
} from '@tabler/icons-react';

export const INITIAL_DRAWER_WIDTH_PERCENT = 80;

export const DrawerFullWidthToggle = React.memo<{
  isFullWidth?: boolean;
  onToggle: () => void;
}>(({ isFullWidth, onToggle }) => {
  const { t } = useTranslation('common');
  const label = isFullWidth
    ? t('drawer.collapseWidth')
    : t('drawer.expandWidth');
  return (
    <Tooltip label={label} position="bottom">
      <ActionIcon
        variant="subtle"
        size="sm"
        onClick={onToggle}
        aria-label={label}
      >
        {isFullWidth ? (
          <IconLayoutSidebarRightCollapse size={16} />
        ) : (
          <IconLayoutSidebarRightExpand size={16} />
        )}
      </ActionIcon>
    </Tooltip>
  );
});

export const DrawerHeader = React.memo<{
  header?: React.ReactNode;
  onClose?: () => void;
  closeEsc?: boolean;
}>(({ header, onClose, closeEsc = true }) => {
  const { t } = useTranslation('common');
  useHotkeys(['esc'], () => onClose?.(), { enabled: closeEsc });

  return (
    <Box px="md" py="xs" className="border-bottom border-dark">
      <Group justify="space-between" align="center">
        <Text size="md">{header}</Text>
        <CloseButton
          onClick={onClose}
          aria-label={t('actions.close')}
          variant="subtle"
          size="md"
        />
      </Group>
    </Box>
  );
});

export const DrawerBody = React.memo<{
  children: React.ReactNode;
}>(({ children }) => {
  return (
    <Box className="w-100 overflow-auto" px="sm" py="md">
      {children}
    </Box>
  );
});
