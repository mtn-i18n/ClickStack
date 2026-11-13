import { useEffect } from 'react';
import { Trans, useTranslation } from 'next-i18next/pages';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { SavedChartConfig } from '@hyperdx/common-utils/dist/types';
import {
  Box,
  Button,
  Card,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';

import {
  Dashboard,
  Tile,
  useCreateDashboard,
  useDashboards,
  useUpdateDashboard,
} from '@/dashboard';
import {
  calculateNextTilePosition,
  getDefaultTileSize,
  makeId,
} from '@/utils/tilePositioning';

interface SaveToDashboardModalProps {
  chartConfig: SavedChartConfig;
  opened: boolean;
  onClose: () => void;
}

const CREATE_NEW_DASHBOARD_VALUE = '_new';

export default function SaveToDashboardModal({
  chartConfig,
  opened,
  onClose,
}: SaveToDashboardModalProps) {
  const { t } = useTranslation('dashboards');
  const queryClient = useQueryClient();
  const { data: dashboards, isLoading: isLoadingDashboards } = useDashboards();
  const createDashboard = useCreateDashboard();
  const updateDashboard = useUpdateDashboard();

  const { control, handleSubmit, reset } = useForm<{
    dashboardId: string;
    newDashboardName: string;
  }>({
    defaultValues: {
      dashboardId: '',
      newDashboardName: '',
    },
  });

  const dashboardId = useWatch({ control, name: 'dashboardId' });
  const isCreatingNew = dashboardId === CREATE_NEW_DASHBOARD_VALUE;

  // Reset form when modal is closed
  useEffect(() => {
    if (!opened) {
      reset();
    }
  }, [opened, reset]);

  const dashboardOptions = [
    ...(dashboards?.map(d => ({ value: d.id, label: d.name })) || []),
    {
      value: CREATE_NEW_DASHBOARD_VALUE,
      label: t('saveToDashboard.createNew'),
    },
  ];

  const createNewTile = (dashboard: Dashboard): Tile => {
    const size = getDefaultTileSize(chartConfig.displayType);
    const position = calculateNextTilePosition(dashboard.tiles, size.w);

    return {
      id: makeId(),
      x: position.x,
      y: position.y,
      w: size.w,
      h: size.h,
      config: chartConfig,
    };
  };

  const onSubmit = handleSubmit(async data => {
    try {
      if (isCreatingNew) {
        // Create new dashboard with the chart as first tile
        if (!data.newDashboardName.trim()) {
          notifications.show({
            color: 'red',
            title: t('saveToDashboard.validationError'),
            message: t('saveToDashboard.dashboardNameRequiredMessage'),
          });
          return;
        }

        const newTile = createNewTile({
          id: '',
          name: '',
          tiles: [],
          tags: [],
        });

        const result = await createDashboard.mutateAsync({
          name: data.newDashboardName.trim(),
          tiles: [newTile],
          tags: [],
        });

        notifications.show({
          color: 'green',
          title: t('saveToDashboard.chartSavedTitle'),
          message: (
            <Trans
              ns="dashboards"
              i18nKey="saveToDashboard.viewOn"
              values={{ name: result.name }}
              components={{
                link: (
                  <a
                    href={`/dashboards/${result.id}`}
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  />
                ),
              }}
            />
          ),
          autoClose: 5000,
        });

        onClose();
      } else {
        // Add chart to existing dashboard
        if (!data.dashboardId) {
          notifications.show({
            color: 'red',
            title: t('saveToDashboard.validationError'),
            message: t('saveToDashboard.selectDashboardMessage'),
          });
          return;
        }

        // Get dashboard data from query cache
        const dashboardsData = queryClient.getQueryData<Dashboard[]>([
          'dashboards',
        ]);
        const targetDashboard = dashboardsData?.find(
          d => d.id === data.dashboardId,
        );

        if (!targetDashboard) {
          notifications.show({
            color: 'red',
            title: t('saveToDashboard.errorTitle'),
            message: t('saveToDashboard.dashboardNotFound'),
          });
          return;
        }

        const newTile = createNewTile(targetDashboard);

        await updateDashboard.mutateAsync({
          id: targetDashboard.id,
          tiles: [...targetDashboard.tiles, newTile],
        });

        notifications.show({
          color: 'green',
          title: t('saveToDashboard.chartSavedTitle'),
          message: (
            <Trans
              ns="dashboards"
              i18nKey="saveToDashboard.viewOn"
              values={{ name: targetDashboard.name }}
              components={{
                link: (
                  <a
                    href={`/dashboards/${targetDashboard.id}`}
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  />
                ),
              }}
            />
          ),
          autoClose: 5000,
        });

        onClose();
      }
    } catch (error) {
      notifications.show({
        color: 'red',
        title: t('saveToDashboard.errorSavingChart'),
        message:
          error instanceof Error
            ? error.message
            : t('saveToDashboard.failedToSave'),
      });
    }
  });

  const isLoading = createDashboard.isPending || updateDashboard.isPending;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('saveToDashboard.title')}
      size="lg"
    >
      <form onSubmit={onSubmit}>
        <Stack gap="md">
          {/* Chart Preview */}
          <Card withBorder padding="sm">
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                {t('saveToDashboard.chartPreview')}
              </Text>
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  {t('saveToDashboard.name')}
                </Text>
                <Text size="sm">
                  {chartConfig.name || t('saveToDashboard.untitledChart')}
                </Text>
              </Group>
              {chartConfig.displayType && (
                <Group gap="xs">
                  <Text size="sm" c="dimmed">
                    {t('saveToDashboard.type')}
                  </Text>
                  <Text size="sm">{chartConfig.displayType}</Text>
                </Group>
              )}
            </Stack>
          </Card>

          {/* Dashboard Selection */}
          <Box>
            <Text size="xs" mb="xs">
              {t('saveToDashboard.dashboardRequired')}
            </Text>
            <Controller
              name="dashboardId"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  {...field}
                  data={dashboardOptions}
                  placeholder={t('saveToDashboard.selectDashboard')}
                  searchable
                  disabled={isLoadingDashboards || isLoading}
                  nothingFoundMessage={t('saveToDashboard.noDashboards')}
                />
              )}
            />
          </Box>

          {/* New Dashboard Name (conditional) */}
          {isCreatingNew && (
            <Box>
              <Text size="xs" mb="xs">
                {t('saveToDashboard.dashboardNameRequired')}
              </Text>
              <Controller
                name="newDashboardName"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    placeholder={t('saveToDashboard.enterDashboardName')}
                    disabled={isLoading}
                  />
                )}
              />
            </Box>
          )}

          {/* Actions */}
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onClose} disabled={isLoading}>
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" loading={isLoading}>
              {t('saveToDashboard.title')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
