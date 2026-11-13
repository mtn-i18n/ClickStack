import * as React from 'react';
import { useTranslation } from 'next-i18next/pages';
import type { Duration } from 'date-fns';
import { add } from 'date-fns';
import { Trans } from 'react-i18next';
import { Button, Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBell } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';

import api from '@/api';
import { ErrorBoundary } from '@/components/Error/ErrorBoundary';
import type { AlertsPageItem } from '@/types';
import { FormatTime } from '@/useFormatTime';
import { isAlertSilenceExpired } from '@/utils/alerts';

export function AckAlert({ alert }: { alert: AlertsPageItem }) {
  const { t } = useTranslation('alerts');
  const queryClient = useQueryClient();
  const silenceAlert = api.useSilenceAlert();
  const unsilenceAlert = api.useUnsilenceAlert();

  const mutateOptions = React.useMemo(
    () => ({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: api.getAlertsQueryKey() });
        queryClient.invalidateQueries({
          queryKey: api.getAlertQueryKey(alert._id),
        });
      },
      onError: (error: any) => {
        const status = error?.response?.status;
        let message = t('silenceFailed');

        if (status === 404) {
          message = t('alertNotFound');
        } else if (status === 400) {
          message = t('silenceInvalidDuration');
        }

        notifications.show({
          color: 'red',
          message,
        });
      },
    }),
    [queryClient, alert._id, t],
  );

  const handleUnsilenceAlert = React.useCallback(() => {
    unsilenceAlert.mutate(alert._id || '', mutateOptions);
  }, [alert._id, mutateOptions, unsilenceAlert]);

  const isNoLongerMuted = React.useMemo(() => {
    return isAlertSilenceExpired(alert.silenced);
  }, [alert.silenced]);

  const handleSilenceAlert = React.useCallback(
    (duration: Duration) => {
      // eslint-disable-next-line no-restricted-syntax
      const mutedUntil = add(new Date(), duration);
      silenceAlert.mutate(
        {
          alertId: alert._id || '',
          mutedUntil: mutedUntil.toISOString(),
        },
        mutateOptions,
      );
    },
    [alert._id, mutateOptions, silenceAlert],
  );

  if (alert.silenced?.at) {
    return (
      <ErrorBoundary message={t('ackMenuFailed')}>
        <Menu>
          <Menu.Target>
            <Button
              size="compact-sm"
              variant="primary"
              color={
                isNoLongerMuted
                  ? 'var(--color-bg-warning)'
                  : 'var(--color-bg-success)'
              }
              leftSection={<IconBell size={16} />}
            >
              {t('acked')}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label py={6}>
              {alert.silenced?.by ? (
                <Trans
                  ns="alerts"
                  i18nKey="acknowledgedBy"
                  values={{ by: alert.silenced.by }}
                  components={{
                    bold: <strong />,
                    time: <FormatTime value={alert.silenced?.at} />,
                  }}
                />
              ) : (
                <Trans
                  ns="alerts"
                  i18nKey="acknowledgedOn"
                  components={{
                    time: <FormatTime value={alert.silenced?.at} />,
                  }}
                />
              )}
            </Menu.Label>

            <Menu.Label py={6}>
              {isNoLongerMuted ? (
                t('alertResumed')
              ) : (
                <Trans
                  ns="alerts"
                  i18nKey="resumesAt"
                  components={{
                    time: <FormatTime value={alert.silenced.until} />,
                  }}
                />
              )}
            </Menu.Label>
            <Menu.Item
              lh="1"
              py={8}
              color="orange"
              onClick={handleUnsilenceAlert}
              disabled={unsilenceAlert.isPending}
            >
              {isNoLongerMuted ? t('unacknowledge') : t('resumeAlert')}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </ErrorBoundary>
    );
  }

  if (alert.state === 'ALERT') {
    return (
      <ErrorBoundary message={t('ackMenuFailed')}>
        <Menu disabled={silenceAlert.isPending}>
          <Menu.Target>
            <Button size="compact-sm" variant="secondary">
              {t('ack')}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label lh="1" py={6}>
              {t('acknowledgeAndSilenceFor')}
            </Menu.Label>
            <Menu.Item
              lh="1"
              py={8}
              onClick={() =>
                handleSilenceAlert({
                  minutes: 30,
                })
              }
            >
              {t('minutes30')}
            </Menu.Item>
            <Menu.Item
              lh="1"
              py={8}
              onClick={() =>
                handleSilenceAlert({
                  hours: 1,
                })
              }
            >
              {t('hours1')}
            </Menu.Item>
            <Menu.Item
              lh="1"
              py={8}
              onClick={() =>
                handleSilenceAlert({
                  hours: 6,
                })
              }
            >
              {t('hours6')}
            </Menu.Item>
            <Menu.Item
              lh="1"
              py={8}
              onClick={() =>
                handleSilenceAlert({
                  hours: 24,
                })
              }
            >
              {t('hours24')}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </ErrorBoundary>
    );
  }

  return null;
}
