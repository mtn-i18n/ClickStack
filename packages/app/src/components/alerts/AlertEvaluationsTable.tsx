import * as React from 'react';
import { useTranslation } from 'next-i18next/pages';
import {
  AlertEvaluation,
  AlertInterval,
} from '@hyperdx/common-utils/dist/types';
import { Center, Skeleton, Table, Text, Tooltip } from '@mantine/core';

import { AlertEvaluationRow } from '@/components/alerts/AlertEvaluationRow';
import { InfiniteScrollFooter } from '@/components/InfiniteScrollFooter';

type AlertEvaluationsTableProps = {
  evaluations: AlertEvaluation[];
  interval: AlertInterval;
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
};

/**
 * Datadog-style evaluation event stream: one parent row per evaluation
 * window, newest first, expandable into per-group child rows for group-by
 * alerts, with error details for failed evaluations. Fetches older windows
 * in pages as the user scrolls to the bottom.
 */
export function AlertEvaluationsTable({
  evaluations,
  interval,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: AlertEvaluationsTableProps) {
  const { t } = useTranslation('alerts');
  if (isLoading) {
    return <Skeleton h={160} w="100%" />;
  }

  if (evaluations.length === 0 && isError) {
    return (
      <Center py="lg">
        <Text size="sm" c="red" data-testid="alert-evaluations-error">
          {t('evaluationsLoadFailed')}
        </Text>
      </Center>
    );
  }

  if (evaluations.length === 0 && !hasNextPage) {
    return (
      <Center py="lg">
        <Text size="sm" c="dimmed">
          {t('noEvaluations')}
        </Text>
      </Center>
    );
  }

  return (
    <>
      <Table highlightOnHover data-testid="alert-evaluations-table">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('evaluationWindow')}</Table.Th>
            <Table.Th>{t('alertState')}</Table.Th>
            <Table.Th>{t('latestValue')}</Table.Th>
            <Table.Th>{t('breaches')}</Table.Th>
            <Table.Th>{t('backfilledBuckets')}</Table.Th>
            <Table.Th>{t('queryDuration')}</Table.Th>
            <Table.Th>
              <Tooltip
                label={t('notificationDurationTooltip')}
                multiline
                maw={320}
                withArrow
                color="dark"
              >
                <span>{t('notificationDuration')}</span>
              </Tooltip>
            </Table.Th>
            <Table.Th>{t('errors')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {evaluations.map(history => (
            <AlertEvaluationRow
              key={history.createdAt}
              history={history}
              interval={interval}
            />
          ))}
        </Table.Tbody>
      </Table>
      <InfiniteScrollFooter
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isFetchNextPageError={isError}
        onLoadMore={onLoadMore}
        loadingLabel={t('loadingOlderEvaluations')}
        errorLabel={t('olderEvaluationsFailed')}
        sentinelTestId="alert-evaluations-load-more"
        errorTestId="alert-evaluations-load-error"
      />
    </>
  );
}
