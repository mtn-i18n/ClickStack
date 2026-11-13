import { useTranslation } from 'next-i18next/pages';
import { Controller, useFormState } from 'react-hook-form';
import { DashboardFilter } from '@hyperdx/common-utils/dist/types';
import { TagsInput } from '@mantine/core';

import { CustomInputWrapper } from './CustomInputWrapper';
import { FilterFormControl } from './filterFormState';
import { VariableNameInput } from './VariableNameInput';

interface StaticListFilterEditFormProps {
  control: FilterFormControl;
  /** Filters other than the one being edited, used to keep variable names unique. */
  otherFilters: DashboardFilter[];
}

/** Form for editing a filter whose dropdown offers a hand-authored list. */
export const StaticListFilterEditForm = ({
  control,
  otherFilters,
}: StaticListFilterEditFormProps) => {
  const { t } = useTranslation('dashboards');
  const { errors } = useFormState({ control });
  const validateAtLeastOneOption = (value: string[]) =>
    (value?.length ?? 0) > 0 || t('filtersModal.staticList.addAtLeastOne');

  return (
    <>
      <CustomInputWrapper
        label={t('filtersModal.staticList.options')}
        tooltipText={t('filtersModal.staticList.optionsTooltip')}
        error={errors.options}
      >
        <Controller
          control={control}
          name="options"
          rules={{
            validate: validateAtLeastOneOption,
          }}
          render={({ field: { onChange, value } }) => (
            <TagsInput
              value={value ?? []}
              onChange={onChange}
              placeholder={t('filtersModal.staticList.optionsPlaceholder')}
              data-testid="filter-options-input"
              clearable
              splitChars={[',', '\n']}
            />
          )}
        />
      </CustomInputWrapper>

      <VariableNameInput control={control} otherFilters={otherFilters} />
    </>
  );
};
