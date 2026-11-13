import { useTranslation } from 'next-i18next/pages';
import { Control } from 'react-hook-form';
import { TSource } from '@hyperdx/common-utils/dist/types';

import SelectControlled from '@/components/SelectControlled';

import { MIN_AUTO_GRANULARITY_OPTIONS } from './constants';
import { FormRow } from './FormRow';

export function MinAutoGranularityFormRow({
  control,
  helpText,
}: {
  control: Control<TSource>;
  helpText?: string;
}) {
  const { t } = useTranslation('settings');
  const options = [
    { value: '', label: t('sourceForm.minAutoGranularity.none') },
    ...MIN_AUTO_GRANULARITY_OPTIONS.filter(option => option.value !== ''),
  ];

  return (
    <FormRow
      label={t('sourceForm.minAutoGranularity.label')}
      helpText={helpText ?? t('sourceForm.minAutoGranularity.help')}
    >
      <SelectControlled
        control={control}
        name="minAutoGranularity"
        data={options}
        allowDeselect={false}
        // An existing source's minAutoGranularity is undefined when
        // unset, which matches no entry in `data` (the "No minimum"
        // entry's value is '', not undefined) - SelectControlled then
        // renders blank rather than that option's label. The
        // placeholder covers exactly that unset state.
        placeholder={t('sourceForm.minAutoGranularity.none')}
      />
    </FormRow>
  );
}
