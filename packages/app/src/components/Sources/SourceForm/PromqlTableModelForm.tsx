import { useEffect } from 'react';
import { useTranslation } from 'next-i18next/pages';

import { PROMQL_TIMESTAMP_EXPRESSION } from '@/source';

import { MinAutoGranularityFormRow } from './MinAutoGranularityFormRow';
import { TableModelProps } from './types';

export function PromqlTableModelForm({ control, setValue }: TableModelProps) {
  const { t } = useTranslation('settings');
  useEffect(() => {
    setValue('timestampValueExpression' as any, PROMQL_TIMESTAMP_EXPRESSION);
  }, [setValue]);

  // PromQL sources use the standard database + table fields from BaseSourceSchema.
  // The table should point to the TimeSeries engine table.
  return (
    <MinAutoGranularityFormRow
      control={control}
      helpText={t('sourceForm.minAutoGranularity.promqlHelp')}
    />
  );
}
