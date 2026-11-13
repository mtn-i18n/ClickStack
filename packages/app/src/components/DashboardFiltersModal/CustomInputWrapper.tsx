import { useTranslation } from 'next-i18next/pages';
import { FieldError, Merge } from 'react-hook-form';
import { Input, Tooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

interface CustomInputWrapperProps {
  children: React.ReactNode;
  label: string;
  tooltipText?: string;
  error?: FieldError | Merge<FieldError, (FieldError | undefined)[]>;
}

export const CustomInputWrapper = ({
  children,
  label,
  tooltipText,
  error,
}: CustomInputWrapperProps) => {
  const { t } = useTranslation('dashboards');
  const errorMessage =
    error &&
    (error.message ||
      (error?.type === 'required'
        ? t('filtersModal.customInput.required')
        : t('filtersModal.customInput.error')));

  return (
    <div>
      <Input.Label>{label}</Input.Label>
      {tooltipText && (
        <Tooltip label={tooltipText}>
          <IconInfoCircle size={14} className="ms-2" />
        </Tooltip>
      )}
      {errorMessage && (
        <Input.Error color="red" size="sm">
          {errorMessage}
        </Input.Error>
      )}
      <div className="mt-1">{children}</div>
    </div>
  );
};
