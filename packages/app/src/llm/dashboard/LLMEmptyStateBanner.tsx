import { useTranslation } from 'next-i18next/pages';
import { Alert } from '@mantine/core';

import { useQueriedChartConfig } from '@/hooks/useChartConfig';

import { baseLLMChartConfig } from './chartConfig';
import { LLMChartProps } from './types';

/**
 * Shown when the selected trace source has no LLM spans in the searched
 * window, pointing users at the supported instrumentation options instead of
 * a page of empty charts.
 */
export function LLMEmptyStateBanner(props: LLMChartProps) {
  const { t } = useTranslation('llm');
  const config = {
    // Plain span count; skip the cost-alias WITH binding to keep it small.
    ...baseLLMChartConfig({ ...props, withCostAlias: false }),
    select: [{ aggFn: 'count' as const, valueExpression: '', alias: 'count' }],
  };

  const { data, isLoading, isError } = useQueriedChartConfig(config, {
    queryKey: ['llm-dashboard-llm-span-count', config],
    enabled: true,
  });

  const count = Number(data?.data?.[0]?.count ?? 0);
  if (isLoading || isError || count > 0) {
    return null;
  }

  return (
    <Alert variant="info" title={t('emptyState.title')} mb="sm">
      {t('emptyState.description')}
    </Alert>
  );
}
