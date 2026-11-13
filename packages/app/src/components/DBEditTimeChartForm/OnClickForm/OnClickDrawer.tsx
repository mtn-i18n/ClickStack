import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'next-i18next/pages';
import {
  Controller,
  useForm,
  UseFormGetValues,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import { Separator } from '@clickhouse/click-ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { validateOnClickTemplate } from '@hyperdx/common-utils/dist/core/linkUrlBuilder';
import { getFilterExpression } from '@hyperdx/common-utils/dist/filters';
import {
  isSearchableSource,
  OnClick,
  OnClickTarget,
} from '@hyperdx/common-utils/dist/types';
import {
  Box,
  Button,
  Drawer,
  Group,
  SegmentedControl,
  Stack,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { TextInputControlled } from '@/components/InputControlled';
import { InputLabelWithTooltip } from '@/components/InputLabelWithTooltip';
import SearchWhereInput from '@/components/SearchInput/SearchWhereInput';
import { useDashboards } from '@/dashboard';
import { useSources } from '@/source';

import { FilterTemplateList } from './FilterTemplateList';
import { OnClickTargetInputControlled } from './OnClickTargetInputControlled';
import {
  DrawerControl,
  DrawerFormValues,
  DrawerSchema,
  emptyDashboardOnClick,
  emptyExternalOnClick,
  emptySearchOnClick,
} from './utils';

function SearchOnClickFields({ control }: { control: DrawerControl }) {
  const { t } = useTranslation('dashboards');
  const { data: sources } = useSources();

  const sourceOptions = useMemo(() => {
    return sources?.filter(isSearchableSource).map(source => ({
      label: source.name,
      value: source.id,
    }));
  }, [sources]);

  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">
        {t('chartEditor.onClick.templateHelp', {
          pattern: '{{columnName}}',
        })}
      </Text>

      <OnClickTargetInputControlled
        control={control}
        options={sourceOptions}
        objectType="source"
      />

      <FilterTemplateList control={control} />

      <Box>
        <InputLabelWithTooltip
          label="WHERE"
          tooltip={t('chartEditor.onClick.whereSearchTooltip')}
        />
        <SearchWhereInput
          control={control}
          name="onClick.whereTemplate"
          languageName="onClick.whereLanguage"
          allowMultiline
          sqlPlaceholder="ServiceName = '{{ServiceName}}'"
          lucenePlaceholder="ServiceName:{{ServiceName}}"
        />
      </Box>
    </Stack>
  );
}

function DashboardOnClickFields({
  control,
  setValue,
  getValues,
}: {
  control: DrawerControl;
  setValue: UseFormSetValue<DrawerFormValues>;
  getValues: UseFormGetValues<DrawerFormValues>;
}) {
  const { t } = useTranslation('dashboards');
  const { data: dashboards } = useDashboards();
  const dashboardOptions = useMemo(() => {
    return dashboards?.map(dashboard => ({
      label: dashboard.name,
      value: dashboard.id,
    }));
  }, [dashboards]);

  // When the target dashboard changes, create empty filter templates
  // for each of the target dashboard's existing filters
  // (if the current templates are all empty).
  const handleTargetChange = useCallback(
    (target: OnClickTarget) => {
      if (target.mode !== 'id') return;
      const selected = dashboards?.find(d => d.id === target.id);
      const dashboardFilters = selected?.filters ?? [];

      const currentFilters = getValues('onClick.filters') ?? [];
      const allTemplatesEmpty = currentFilters.every(f => f.template === '');
      if (!allTemplatesEmpty) return;

      setValue(
        'onClick.filters',
        dashboardFilters.flatMap(f => {
          const expression = getFilterExpression(f);
          return expression != null
            ? [
                {
                  kind: 'expressionTemplate' as const,
                  expression,
                  template: '',
                },
              ]
            : [];
        }),
      );
    },
    [dashboards, setValue, getValues],
  );

  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">
        {t('chartEditor.onClick.templateHelp', {
          pattern: '{{columnName}}',
        })}
      </Text>

      <OnClickTargetInputControlled
        control={control}
        options={dashboardOptions}
        objectType="dashboard"
        onTargetChange={handleTargetChange}
      />

      <FilterTemplateList control={control} />

      <Box>
        <InputLabelWithTooltip
          label="WHERE"
          tooltip={t('chartEditor.onClick.whereDashboardTooltip')}
        />
        <SearchWhereInput
          control={control}
          name="onClick.whereTemplate"
          languageName="onClick.whereLanguage"
          allowMultiline
          sqlPlaceholder="ServiceName = '{{ServiceName}}'"
          lucenePlaceholder="ServiceName:{{ServiceName}}"
        />
      </Box>
    </Stack>
  );
}

function ExternalOnClickFields({ control }: { control: DrawerControl }) {
  const { t } = useTranslation('dashboards');

  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">
        {t('chartEditor.onClick.templateHelp', {
          pattern: '{{columnName}}',
        })}{' '}
        {t('chartEditor.onClick.externalHelp')}
        <br />
        <br />
        <b>{t('chartEditor.onClick.caution')}</b>{' '}
        {t('chartEditor.onClick.externalWarning')}
      </Text>

      <Box>
        <InputLabelWithTooltip
          label={t('chartEditor.onClick.url')}
          tooltip={t('chartEditor.onClick.urlTooltip')}
        />
        <TextInputControlled
          control={control}
          name="onClick.urlTemplate"
          placeholder="https://example.com/abc?service={{ServiceName}}"
          data-testid="onclick-external-url-input"
        />
      </Box>
    </Stack>
  );
}

function ModeFields({
  control,
  setValue,
  getValues,
}: {
  control: DrawerControl;
  setValue: UseFormSetValue<DrawerFormValues>;
  getValues: UseFormGetValues<DrawerFormValues>;
}) {
  const { t } = useTranslation('dashboards');
  const onClick = useWatch({ control, name: 'onClick' });

  if (onClick?.type === 'search') {
    return <SearchOnClickFields control={control} />;
  } else if (onClick?.type === 'dashboard') {
    return (
      <DashboardOnClickFields
        control={control}
        setValue={setValue}
        getValues={getValues}
      />
    );
  } else if (onClick?.type === 'external') {
    return <ExternalOnClickFields control={control} />;
  }

  return (
    <Text size="sm" c="dimmed">
      {t('chartEditor.onClick.defaultDescription')}
    </Text>
  );
}

type OnClickDrawerProps = {
  opened: boolean;
  value: OnClick | undefined;
  onChange: (value: OnClick | undefined) => void;
  onClose: () => void;
};

export default function OnClickDrawer({
  opened,
  value,
  onChange,
  onClose,
}: OnClickDrawerProps) {
  const { t } = useTranslation('dashboards');
  const appliedDefaults: DrawerFormValues = useMemo(
    () => ({ onClick: value }),
    [value],
  );

  const { control, handleSubmit, reset, setValue, getValues } =
    useForm<DrawerFormValues>({
      defaultValues: appliedDefaults,
      resolver: zodResolver(DrawerSchema),
    });

  // Whenever the drawer is (re)opened with a fresh value from the parent,
  // sync the local form to that value. Reopening after a cancel should not
  // resurrect abandoned edits.
  useEffect(() => {
    if (opened) reset(appliedDefaults);
  }, [opened, appliedDefaults, reset]);

  const { data: dashboards } = useDashboards();
  const { data: sources } = useSources();
  const watchedOnClick = useWatch({ control, name: 'onClick' });

  const isTargetMissing = useMemo(() => {
    if (
      !watchedOnClick ||
      watchedOnClick.type === 'external' ||
      watchedOnClick.target.mode !== 'id'
    ) {
      return false;
    }

    const validTargetIds =
      watchedOnClick.type === 'dashboard'
        ? dashboards?.map(d => d.id)
        : sources?.filter(isSearchableSource).map(s => s.id);

    if (!validTargetIds) return false;
    return !validTargetIds.includes(watchedOnClick.target.id);
  }, [watchedOnClick, dashboards, sources]);

  const applyChanges = useCallback(() => {
    handleSubmit(values => {
      try {
        if (values.onClick) {
          validateOnClickTemplate(values.onClick);
        }
      } catch (err) {
        notifications.show({
          title: t('chartEditor.onClick.invalidTemplate'),
          message:
            err instanceof Error
              ? err.message
              : t('chartEditor.onClick.unknownError'),
          color: 'red',
        });
        return;
      }

      onChange(values.onClick ?? undefined);
      onClose();
    })();
  }, [handleSubmit, onChange, onClose, t]);

  const handleClose = useCallback(() => {
    reset(appliedDefaults);
    onClose();
  }, [reset, appliedDefaults, onClose]);

  return (
    <Drawer
      title={t('chartEditor.onClick.drawerTitle')}
      opened={opened}
      onClose={handleClose}
      position="right"
      size="lg"
    >
      <Stack data-testid="onclick-drawer">
        <Text size="xs" c="dimmed">
          {t('chartEditor.onClick.drawerDescription')}
        </Text>

        <Controller
          control={control}
          name="onClick"
          render={({ field: { value: onClickValue } }) => (
            <SegmentedControl
              data-testid="onclick-mode-segmented"
              data={[
                {
                  label: t('chartEditor.onClick.modeDefault'),
                  value: 'default',
                },
                {
                  label: t('chartEditor.onClick.modeSearch'),
                  value: 'search',
                },
                {
                  label: t('chartEditor.onClick.modeDashboard'),
                  value: 'dashboard',
                },
                {
                  label: t('chartEditor.onClick.modeExternal'),
                  value: 'external',
                },
              ]}
              value={onClickValue?.type ?? 'default'}
              onChange={value => {
                const formValue =
                  value === 'search'
                    ? emptySearchOnClick()
                    : value === 'dashboard'
                      ? emptyDashboardOnClick()
                      : value === 'external'
                        ? emptyExternalOnClick()
                        : null;
                setValue('onClick', formValue);
              }}
              fullWidth
            />
          )}
        />

        <ModeFields
          control={control}
          setValue={setValue}
          getValues={getValues}
        />

        <Separator size="xs" />
        <Group justify="space-between">
          <Button variant="subtle" onClick={handleClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={applyChanges}
            disabled={isTargetMissing}
            data-testid="onclick-apply-button"
          >
            {t('common:actions.apply')}
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
}
