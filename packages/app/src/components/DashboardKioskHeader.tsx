import { useTranslation } from 'next-i18next/pages';
import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core';
import { IconArrowsMinimize } from '@tabler/icons-react';

import { PageHeader } from '@/components/PageHeader';

export function DashboardKioskHeader({
  dashboardName,
  onExit,
}: {
  dashboardName: string;
  onExit: () => void;
}) {
  const { t } = useTranslation('dashboards');
  return (
    <PageHeader
      data-testid="kiosk-header"
      title={dashboardName || t('kiosk.untitledDashboard')}
      actions={
        <Group gap="md" wrap="nowrap">
          <Group
            gap={6}
            wrap="nowrap"
            data-testid="kiosk-live-status"
            aria-label={t('kiosk.liveAria')}
          >
            <Box
              component="span"
              w={8}
              h={8}
              bg="var(--color-bg-success)"
              style={{ borderRadius: '50%', flexShrink: 0 }}
            />
            <Text size="xs" c="var(--color-text-muted)" visibleFrom="xs">
              {t('kiosk.liveReadOnly')}
            </Text>
          </Group>
          <Tooltip label={t('kiosk.exitKioskMode')} withArrow>
            <ActionIcon
              variant="subtle"
              size="input-sm"
              aria-label={t('kiosk.exitKioskMode')}
              data-testid="exit-kiosk-mode-button"
              onClick={onExit}
            >
              <IconArrowsMinimize size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      }
    />
  );
}
