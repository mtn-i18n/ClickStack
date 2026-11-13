import { useMemo } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Controller } from 'react-hook-form';
import { OnClickTarget } from '@hyperdx/common-utils/dist/types';
import { Select } from '@mantine/core';

import { TextInputControlled } from '@/components/InputControlled';
import { InputLabelWithTooltip } from '@/components/InputLabelWithTooltip';

import { DrawerControl } from './utils';

const TEMPLATE_SELECT_VALUE = 'template';

export function OnClickTargetInputControlled({
  control,
  options,
  objectType,
  onTargetChange,
}: {
  control: DrawerControl;
  options: { label: string; value: string }[] | undefined;
  objectType: 'source' | 'dashboard';
  onTargetChange?: (target: OnClickTarget) => void;
}) {
  const { t } = useTranslation('dashboards');
  const objectLabel =
    objectType === 'dashboard'
      ? t('chartEditor.onClick.objectDashboard')
      : t('chartEditor.onClick.objectSource');
  const optionsWithTemplate = useMemo(() => {
    return [
      {
        group: t('chartEditor.onClick.templateGroup'),
        items: [
          {
            label: t('chartEditor.onClick.templateGroup'),
            value: TEMPLATE_SELECT_VALUE,
          },
        ],
      },
      {
        group: objectLabel,
        items: options ?? [],
      },
    ];
  }, [options, objectLabel, t]);

  const label = objectLabel;
  const labelTooltip =
    objectType === 'dashboard'
      ? t('chartEditor.onClick.targetTooltipDashboard')
      : t('chartEditor.onClick.targetTooltipSource');
  const placeholder =
    objectType === 'dashboard'
      ? 'e.g. Error Dashboard or Errors-{{ServiceName}}'
      : 'e.g. Logs or Logs-{{Environment}}';

  return (
    <Controller
      control={control}
      name="onClick.target"
      render={({ field, fieldState }) => {
        const selectedId =
          field.value?.mode === 'id' ? field.value.id : undefined;
        const targetMissing =
          options != null &&
          selectedId != null &&
          selectedId !== '' &&
          !options.some(option => option.value === selectedId);

        return (
          <>
            <InputLabelWithTooltip label={label} tooltip={labelTooltip} />
            <Select
              data={optionsWithTemplate}
              data-testid="onclick-target-select"
              value={
                field.value?.mode === 'template'
                  ? TEMPLATE_SELECT_VALUE
                  : field.value?.id
              }
              error={
                targetMissing
                  ? t('chartEditor.onClick.targetMissing', {
                      objectType: objectLabel,
                    })
                  : undefined
              }
              onChange={value => {
                const newTarget: OnClickTarget =
                  value === TEMPLATE_SELECT_VALUE
                    ? { mode: 'template', template: '' }
                    : { mode: 'id', id: value ?? '' };
                field.onChange(newTarget);
                onTargetChange?.(newTarget);
              }}
            />
            {field.value?.mode === 'template' && (
              <TextInputControlled
                control={control}
                name="onClick.target.template"
                placeholder={placeholder}
                data-testid="onclick-template-input"
                error={fieldState.error?.message}
              />
            )}
          </>
        );
      }}
    />
  );
}
