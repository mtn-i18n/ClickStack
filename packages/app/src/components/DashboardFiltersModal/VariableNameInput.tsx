import { useTranslation } from 'next-i18next/pages';
import { useFormState, useWatch } from 'react-hook-form';
import {
  deriveVariableName,
  validateVariableName,
} from '@hyperdx/common-utils/dist/filters';
import { DashboardFilter } from '@hyperdx/common-utils/dist/types';
import { TextInput } from '@mantine/core';

import { CustomInputWrapper } from './CustomInputWrapper';
import { FilterFormControl } from './filterFormState';

interface VariableNameInputProps {
  control: FilterFormControl;
  otherFilters: DashboardFilter[];
}

export const VariableNameInput = ({
  control,
  otherFilters,
}: VariableNameInputProps) => {
  const { t } = useTranslation('dashboards');
  const { errors } = useFormState({ control });
  const filterName = useWatch({ control, name: 'name' });
  const derivedVariableName = deriveVariableName(filterName ?? '');

  return (
    <CustomInputWrapper
      label={t('filtersModal.variableName.label')}
      tooltipText={t('filtersModal.variableName.tooltip')}
      error={errors.variableName}
    >
      <TextInput
        placeholder={derivedVariableName || 'variable_name'}
        data-testid="filter-variable-name-input"
        {...control.register('variableName', {
          validate: value =>
            validateVariableName({ value, otherFilters }) ?? true,
        })}
      />
    </CustomInputWrapper>
  );
};
