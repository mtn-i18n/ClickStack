import { useCallback, useEffect } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Separator } from '@clickhouse/click-ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { TableConnection } from '@hyperdx/common-utils/dist/core/metadata';
import { Button, Drawer, Group, Stack } from '@mantine/core';
import { IconPlayerPlay } from '@tabler/icons-react';

import { HeatmapScaleControl } from '@/components/DBHeatmapChart/HeatmapScaleControl';
import { SQLInlineEditorControlled } from '@/components/SQLEditor/SQLInlineEditor';

const HeatmapSettingsSchema = z.object({
  value: z.string().trim().min(1),
  count: z.string().trim().optional(),
  scaleType: z.enum(['log', 'linear']).default('log'),
});

export type HeatmapSettingsValues = z.infer<typeof HeatmapSettingsSchema>;

export default function HeatmapSettingsDrawer({
  opened,
  onClose,
  connection,
  sourceId,
  dateRange,
  parentRef,
  defaultValues,
  onSubmit,
}: {
  opened: boolean;
  onClose: () => void;
  connection: TableConnection;
  sourceId?: string;
  dateRange?: [Date, Date];
  parentRef?: HTMLElement | null;
  defaultValues: HeatmapSettingsValues;
  onSubmit: (v: HeatmapSettingsValues) => void;
}) {
  const { t } = useTranslation('charts');
  const form = useForm({
    resolver: zodResolver(HeatmapSettingsSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form object is stable from useForm
  }, [defaultValues]);

  const handleClose = useCallback(() => {
    form.reset(defaultValues);
    onClose();
  }, [onClose, form, defaultValues]);

  const scaleType = useWatch({ control: form.control, name: 'scaleType' });

  return (
    <Drawer
      title={t('displaySettings')}
      opened={opened}
      onClose={handleClose}
      position="right"
      size="sm"
      lockScroll={false}
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Stack gap="md">
          <HeatmapScaleControl
            value={scaleType}
            onChange={v => form.setValue('scaleType', v)}
          />

          <Separator size="xs" />

          <SQLInlineEditorControlled
            parentRef={parentRef}
            tableConnection={connection}
            sourceId={sourceId}
            dateRange={dateRange}
            control={form.control}
            name="value"
            size="xs"
            tooltipText={t('valueTooltip')}
            placeholder={t('sqlExpression')}
            onSubmit={form.handleSubmit(onSubmit)}
            label={t('axisValue')}
            error={form.formState.errors.value?.message}
            rules={{ required: true }}
            enableVariables
          />

          <SQLInlineEditorControlled
            parentRef={parentRef}
            tableConnection={connection}
            sourceId={sourceId}
            dateRange={dateRange}
            control={form.control}
            name="count"
            placeholder={t('sqlExpression')}
            size="xs"
            tooltipText={t('countTooltip')}
            onSubmit={form.handleSubmit(onSubmit)}
            label={t('count')}
            error={form.formState.errors.count?.message}
          />

          <Separator size="xs" />
          <Group gap="xs" justify="flex-end">
            <Button variant="secondary" onClick={handleClose}>
              {t('common:actions.cancel')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              leftSection={<IconPlayerPlay size={16} />}
            >
              {t('common:actions.apply')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
}
