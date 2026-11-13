import { useTranslation } from 'next-i18next/pages';
import { Control, UseFormSetValue, useWatch } from 'react-hook-form';
import { Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { ChartEditorFormState } from '@/components/ChartEditor/types';

import OnClickDrawer from './OnClickDrawer';

interface OnClickFormButtonProps {
  control: Control<ChartEditorFormState>;
  setValue: UseFormSetValue<ChartEditorFormState>;
  onSubmit?: (suppressErrorNotification?: boolean) => void;
}

export function OnClickFormButton({
  control,
  setValue,
  onSubmit,
}: OnClickFormButtonProps) {
  const { t } = useTranslation('dashboards');
  const [
    onClickDrawerOpened,
    { open: openOnClickDrawer, close: closeOnClickDrawer },
  ] = useDisclosure(false);

  const onClickValue = useWatch({ control, name: 'onClick' });
  const onClickTypeLabel =
    onClickValue?.type === 'search'
      ? t('chartEditor.onClick.modeSearch')
      : onClickValue?.type === 'dashboard'
        ? t('chartEditor.onClick.modeDashboard')
        : onClickValue?.type === 'external'
          ? t('chartEditor.onClick.modeExternal')
          : t('chartEditor.onClick.modeDefault');

  return (
    <>
      <Button
        onClick={openOnClickDrawer}
        size="compact-sm"
        variant="secondary"
        data-testid="onclick-drawer-trigger"
      >
        {t('chartEditor.onClick.buttonLabel', {
          type: onClickTypeLabel,
        })}
      </Button>
      <OnClickDrawer
        opened={onClickDrawerOpened}
        value={onClickValue}
        onChange={value => {
          setValue('onClick', value, { shouldDirty: true });
          onSubmit?.();
        }}
        onClose={closeOnClickDrawer}
      />
    </>
  );
}
