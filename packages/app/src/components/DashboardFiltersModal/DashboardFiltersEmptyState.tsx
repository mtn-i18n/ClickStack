import { useTranslation } from 'next-i18next/pages';
import { Button, Modal, Stack, Text, Title } from '@mantine/core';
import { IconFilter } from '@tabler/icons-react';

import { MODAL_SIZE } from './constants';

interface DashboardFiltersEmptyStateProps {
  onCreateFilter: () => void;
  onClose: () => void;
}

export const DashboardFiltersEmptyState = ({
  onCreateFilter,
  onClose,
}: DashboardFiltersEmptyStateProps) => {
  const { t } = useTranslation('dashboards');
  return (
    <Modal opened onClose={onClose} size={MODAL_SIZE}>
      <Stack
        align="center"
        justify="center"
        pt="lg"
        pb="xl"
        data-testid="dashboard-filters-empty-state"
      >
        <IconFilter />
        <Title order={4}>{t('filtersModal.emptyTitle')}</Title>
        <Text size="sm" ta="center" px="xl">
          {t('filtersModal.emptyDescription')}
        </Text>
        <Button
          variant="primary"
          onClick={onCreateFilter}
          data-testid="add-filter-button"
        >
          {t('filtersModal.addNewFilter')}
        </Button>
      </Stack>
    </Modal>
  );
};
