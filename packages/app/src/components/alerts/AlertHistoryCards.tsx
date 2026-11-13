import * as React from 'react';
import { useTranslation } from 'next-i18next/pages';
import cx from 'classnames';
import { formatRelative } from 'date-fns';
import { Trans } from 'react-i18next';
import {
  AlertError,
  AlertErrorType,
  AlertHistory,
  AlertState,
} from '@hyperdx/common-utils/dist/types';
import {
  Code,
  Group,
  Modal,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconExclamationCircle } from '@tabler/icons-react';

import type { AlertsPageItem } from '@/types';
import { FormatTime } from '@/useFormatTime';

import styles from '@styles/AlertsPage.module.scss';

const HISTORY_ITEMS = 18;

export function useAlertErrorTypeLabels(): Record<AlertErrorType, string> {
  const { t } = useTranslation('alerts');
  return {
    [AlertErrorType.INVALID_ALERT]: t('errorInvalidConfiguration'),
    [AlertErrorType.QUERY_ERROR]: t('errorQuery'),
    [AlertErrorType.QUERY_TIMEOUT]: t('errorQueryTimeout'),
    [AlertErrorType.WEBHOOK_ERROR]: t('errorWebhook'),
    [AlertErrorType.UNKNOWN]: t('errorUnknown'),
  };
}

function stateToBgColorClass(state: AlertState) {
  switch (state) {
    case AlertState.OK:
      return styles.ok;
    case AlertState.PENDING:
      return styles.pending;
    case AlertState.ERROR:
      return styles.error;
    default:
      return styles.alarm;
  }
}

export function AlertErrorsContent({ errors }: { errors: AlertError[] }) {
  const labels = useAlertErrorTypeLabels();
  return (
    <Stack gap="md">
      {errors.map((error, idx) => (
        <Stack key={idx} gap={4}>
          <Text size="sm">
            <Trans
              ns="alerts"
              i18nKey="errorAt"
              values={{ label: labels[error.type] }}
              components={{ time: <FormatTime value={error.timestamp} /> }}
            />
          </Text>
          <Code
            flex={1}
            block
            style={{
              whiteSpace: 'pre-wrap',
            }}
          >
            {error.message}
          </Code>
        </Stack>
      ))}
    </Stack>
  );
}

/** Dedupe errors by type+message, keeping the most recent occurrence. */
function dedupeAlertErrors(errors: AlertError[]): AlertError[] {
  const map = new Map<string, AlertError>();
  for (const error of errors) {
    const key = `${error.type}||${error.message}`;
    const existing = map.get(key);
    if (
      !existing ||
      new Date(error.timestamp).getTime() >
        new Date(existing.timestamp).getTime()
    ) {
      map.set(key, error);
    }
  }
  return Array.from(map.values());
}

function errorTypeSummary(
  errors: AlertError[],
  labels: Record<AlertErrorType, string>,
  multipleLabel: string,
): string {
  const types = Array.from(new Set(errors.map(error => error.type)));
  return types.length === 1 ? labels[types[0]] : multipleLabel;
}

function AlertHistoryCard({
  history,
  alertUrl,
  onShowErrors,
}: {
  history: AlertHistory;
  alertUrl?: string;
  onShowErrors: (history: AlertHistory) => void;
}) {
  const { t } = useTranslation('alerts');
  const labels = useAlertErrorTypeLabels();
  const start = new Date(history.createdAt.toString());

  // eslint-disable-next-line no-restricted-syntax
  const today = React.useMemo(() => new Date(), []);

  const href = React.useMemo(() => {
    if (!alertUrl || !history.lastValues?.[0]?.startTime) return null;

    // Create time window from alert creation to last recorded value
    const to = new Date(history.createdAt).getTime();
    const from = new Date(history.lastValues[0].startTime).getTime();

    // Construct URL with time range parameters
    const url = new URL(alertUrl, window.location.origin);
    url.searchParams.set('from', from.toString());
    url.searchParams.set('to', to.toString());
    url.searchParams.set('isLive', 'false');

    return url.pathname + url.search;
  }, [history, alertUrl]);

  const isError = history.state === AlertState.ERROR;
  const time = formatRelative(start, today);

  const content = (
    <div
      className={cx(
        styles.historyCard,
        stateToBgColorClass(history.state),
        (href || isError) && styles.clickable,
      )}
    />
  );

  const label = React.useMemo(() => {
    if (isError) {
      const summary = errorTypeSummary(
        history.errors ?? [],
        labels,
        t('multipleErrors'),
      );
      return t('evaluationFailed', { summary, time });
    }
    const count = history.counts ?? 0;
    return history.state === AlertState.PENDING
      ? t('historyPendingCount', { count, time })
      : t('historyOkCount', { count, time });
  }, [isError, history, time, labels, t]);

  return (
    <Tooltip label={label} color="dark" withArrow>
      {isError ? (
        <UnstyledButton
          className={styles.historyCardLink}
          onClick={() => onShowErrors(history)}
          aria-label={t('viewEvaluationErrors')}
        >
          {content}
        </UnstyledButton>
      ) : href ? (
        <a href={href} className={styles.historyCardLink}>
          {content}
        </a>
      ) : (
        content
      )}
    </Tooltip>
  );
}

function AlertErrorsIndicator({ alert }: { alert: AlertsPageItem }) {
  const { t } = useTranslation('alerts');
  const labels = useAlertErrorTypeLabels();
  const [opened, { open, close }] = useDisclosure(false);

  const uniqueErrors = React.useMemo(
    () => dedupeAlertErrors(alert.executionErrors ?? []),
    [alert.executionErrors],
  );

  if (uniqueErrors.length === 0) return null;

  const errorType = errorTypeSummary(uniqueErrors, labels, t('multipleErrors'));

  return (
    <>
      <Tooltip
        label={t('clickForDetails', { label: errorType })}
        multiline
        maw={400}
        withArrow
        color="dark"
      >
        <UnstyledButton
          data-testid={`alert-error-icon-${alert._id}`}
          onClick={open}
          style={{
            display: 'inline-flex',
            color: 'var(--mantine-color-red-6)',
            cursor: 'pointer',
          }}
          aria-label={t('viewAlertExecutionErrors')}
        >
          <IconExclamationCircle size={18} />
        </UnstyledButton>
      </Tooltip>

      <Modal
        opened={opened}
        onClose={close}
        size="lg"
        title={t('alertExecutionErrors')}
        data-testid={`alert-error-modal-${alert._id}`}
      >
        <AlertErrorsContent errors={uniqueErrors} />
      </Modal>
    </>
  );
}

export function AlertHistoryCardList({
  alert,
  alertUrl,
  history: historyProp,
  maxItems = HISTORY_ITEMS,
  showErrorIndicator = true,
}: {
  alert: AlertsPageItem;
  alertUrl?: string;
  /** Evaluation windows to render; defaults to the alert's inline history. */
  history?: AlertHistory[];
  maxItems?: number;
  showErrorIndicator?: boolean;
}) {
  const { t } = useTranslation('alerts');
  const history = historyProp ?? alert.history;
  const [errorHistory, setErrorHistory] = React.useState<AlertHistory | null>(
    null,
  );

  const items = React.useMemo(() => {
    if (history.length < maxItems) {
      return history;
    }
    return history.slice(0, maxItems);
  }, [history, maxItems]);

  const paddingItems = React.useMemo(() => {
    if (history.length > maxItems) {
      return [];
    }
    return new Array(maxItems - history.length).fill(null);
  }, [history, maxItems]);

  const modalErrors = React.useMemo(
    () => dedupeAlertErrors(errorHistory?.errors ?? []),
    [errorHistory],
  );

  return (
    <Group gap="xs" wrap="nowrap">
      {showErrorIndicator && <AlertErrorsIndicator alert={alert} />}
      {items.length > 0 && (
        <div className={styles.historyCardWrapper}>
          {paddingItems.map((_, index) => (
            <Tooltip label={t('noData')} withArrow key={index}>
              <div className={styles.historyCard} />
            </Tooltip>
          ))}
          {items
            .slice()
            .reverse()
            .map((history, index) => (
              <AlertHistoryCard
                key={index}
                history={history}
                alertUrl={alertUrl}
                onShowErrors={setErrorHistory}
              />
            ))}
        </div>
      )}
      <Modal
        opened={errorHistory != null}
        onClose={() => setErrorHistory(null)}
        size="lg"
        title={
          <>
            {t('evaluationErrors')}
            {errorHistory != null && (
              <Text span size="sm" c="dimmed" ml="xs">
                <FormatTime value={errorHistory.createdAt} />
              </Text>
            )}
          </>
        }
        data-testid={`alert-evaluation-error-modal-${alert._id}`}
      >
        <AlertErrorsContent errors={modalErrors} />
      </Modal>
    </Group>
  );
}
