import { useTranslation } from 'next-i18next/pages';
import { Control } from 'react-hook-form';
import { TSource, UseTextIndex } from '@hyperdx/common-utils/dist/types';

import SelectControlled from '@/components/SelectControlled';

import { FormRow } from './FormRow';

export function UseTextIndexFormRow({
  control,
}: {
  control: Control<TSource>;
}) {
  const { t } = useTranslation('settings');
  const options = [
    {
      value: UseTextIndex.Auto,
      label: t('sourceForm.useTextIndex.auto'),
    },
    {
      value: UseTextIndex.Enabled,
      label: t('sourceForm.useTextIndex.forceEnable'),
    },
    {
      value: UseTextIndex.Disabled,
      label: t('sourceForm.useTextIndex.forceDisable'),
    },
  ];

  return (
    <FormRow
      label={t('sourceForm.useTextIndex.label')}
      helpText={t('sourceForm.useTextIndex.help')}
    >
      <SelectControlled
        control={control}
        name="useTextIndexForImplicitColumn"
        data={options}
        placeholder={options[0].label}
        allowDeselect={false}
      />
    </FormRow>
  );
}
