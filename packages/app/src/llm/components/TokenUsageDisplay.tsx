import { useTranslation } from 'next-i18next/pages';
import { Group, Text, Tooltip } from '@mantine/core';

import { formatCostUsd, formatTokenCount } from '@/llm/lib/extract';
import { LLMUsage } from '@/llm/lib/types';

function UsageStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <Group gap={4} wrap="nowrap">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="xs" fw={500}>
        {value}
      </Text>
      {detail != null && (
        <Text size="xs" c="dimmed">
          ({detail})
        </Text>
      )}
    </Group>
  );
}

/**
 * Compact token usage + cost summary line for an LLM span. Shown in the
 * overview subpanel and the conversation panel header.
 */
export function TokenUsageDisplay({
  usage,
  costUsd,
  costEstimated,
}: {
  usage: LLMUsage;
  costUsd?: number;
  costEstimated?: boolean;
}) {
  const { t } = useTranslation('llm');
  const hasUsage =
    usage.inputTokens != null ||
    usage.outputTokens != null ||
    usage.totalTokens != null;
  if (!hasUsage && costUsd == null) {
    return null;
  }

  return (
    <Group gap="md" wrap="wrap" data-testid="llm-token-usage">
      {usage.inputTokens != null && (
        <UsageStat
          label={t('tokenUsage.input')}
          value={formatTokenCount(usage.inputTokens)}
          detail={
            usage.cachedInputTokens != null && usage.cachedInputTokens > 0
              ? t('tokenUsage.cached', {
                  value: formatTokenCount(usage.cachedInputTokens),
                })
              : undefined
          }
        />
      )}
      {usage.outputTokens != null && (
        <UsageStat
          label={t('tokenUsage.output')}
          value={formatTokenCount(usage.outputTokens)}
          detail={
            usage.reasoningOutputTokens != null &&
            usage.reasoningOutputTokens > 0
              ? t('tokenUsage.reasoning', {
                  value: formatTokenCount(usage.reasoningOutputTokens),
                })
              : undefined
          }
        />
      )}
      {usage.totalTokens != null && (
        <UsageStat
          label={t('tokenUsage.total')}
          value={formatTokenCount(usage.totalTokens)}
        />
      )}
      {costUsd != null && (
        <Tooltip
          label={
            costEstimated
              ? t('tokenUsage.estimatedTooltip')
              : t('tokenUsage.reportedTooltip')
          }
          position="top"
        >
          <Group gap={4} wrap="nowrap">
            <Text size="xs" c="dimmed">
              {t('tokenUsage.cost')}
            </Text>
            <Text size="xs" fw={500} data-testid="llm-cost">
              {costEstimated ? '~' : ''}
              {formatCostUsd(costUsd)}
            </Text>
          </Group>
        </Tooltip>
      )}
    </Group>
  );
}
