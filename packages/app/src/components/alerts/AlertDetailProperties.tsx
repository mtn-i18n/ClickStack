import * as React from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Trans } from 'react-i18next';
import { Badge } from '@clickhouse/click-ui';
import { Group, Text } from '@mantine/core';

import { AlertPropertiesSummary } from '@/components/alerts/AlertPropertiesSummary';
import type { AlertsPageItem } from '@/types';
import { FormatTime } from '@/useFormatTime';
import { isAlertSilenceExpired } from '@/utils/alerts';

function PropertyRow({
  label,
  children,
  testId,
}: {
  label: string;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <Group gap="xs" align="baseline" wrap="nowrap" data-testid={testId}>
      <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
        {label}
      </Text>
      <Text size="xs" component="div" style={{ minWidth: 0 }}>
        {children}
      </Text>
    </Group>
  );
}

/**
 * Full alert metadata block for the alert detail page: the shared one-line
 * summary (threshold, schedule, targets) plus every other persisted
 * property — notification title, message template, group-by, schedule
 * anchor/offset, acknowledgement, tags, and created/updated timestamps. Rows
 * render only when the field is set.
 */
export function AlertDetailProperties({ alert }: { alert: AlertsPageItem }) {
  const { t } = useTranslation('alerts');
  const tags = alert.tags ?? [];
  const hasScheduleAnchor = alert.scheduleStartAt != null;
  const hasScheduleOffset =
    alert.scheduleOffsetMinutes != null && alert.scheduleOffsetMinutes > 0;

  return (
    <div data-testid="alert-detail-properties">
      <AlertPropertiesSummary alert={alert} variant="detail" />
      <div className="d-flex flex-column gap-1 mt-2">
        {alert.name && (
          <PropertyRow
            label={t('notificationTitle')}
            testId="alert-property-name"
          >
            {alert.name}
          </PropertyRow>
        )}
        {alert.message && (
          <PropertyRow
            label={t('messageTemplate')}
            testId="alert-property-message"
          >
            {alert.message}
          </PropertyRow>
        )}
        {alert.groupBy && (
          <PropertyRow label={t('groupedBy')} testId="alert-property-group-by">
            <Text size="xs" ff="monospace" component="span">
              {alert.groupBy}
            </Text>
          </PropertyRow>
        )}
        {(hasScheduleAnchor || hasScheduleOffset) && (
          <PropertyRow label={t('schedule')} testId="alert-property-schedule">
            {hasScheduleAnchor ? (
              <Trans
                ns="alerts"
                i18nKey="windowsAnchoredAt"
                components={{
                  time: (
                    <FormatTime
                      value={alert.scheduleStartAt!}
                      format="withYear"
                    />
                  ),
                }}
              />
            ) : (
              t('offsetIntoWindow', { minutes: alert.scheduleOffsetMinutes })
            )}
          </PropertyRow>
        )}
        {alert.silenced && (
          <PropertyRow
            label={t('acknowledged')}
            testId="alert-property-silenced"
          >
            {alert.silenced.by ? (
              <>{t('byUser', { name: alert.silenced.by })}</>
            ) : null}
            {isAlertSilenceExpired(alert.silenced) ? (
              <Trans
                ns="alerts"
                i18nKey="expiredAt"
                components={{
                  time: <FormatTime value={alert.silenced.until} />,
                }}
              />
            ) : (
              <Trans
                ns="alerts"
                i18nKey="silencedUntil"
                components={{
                  time: <FormatTime value={alert.silenced.until} />,
                }}
              />
            )}
          </PropertyRow>
        )}
        {tags.length > 0 && (
          <PropertyRow label={t('tags')} testId="alert-property-tags">
            <Group gap={4}>
              {tags.map(tag => (
                <Badge key={tag} size="sm" text={tag} state="neutral" />
              ))}
            </Group>
          </PropertyRow>
        )}
      </div>
      {/* Provenance, not configuration: the creator joins the timestamps in
          one dimmed sub-heading line rather than competing with the alert's
          settings above. */}
      <Text size="xs" c="dimmed" mt="xs" data-testid="alert-property-created">
        {alert.createdBy && (
          <>
            {t('createdBy', {
              name: alert.createdBy.name || alert.createdBy.email,
            })}{' '}
          </>
        )}
        <FormatTime value={alert.createdAt} format="withYear" />
        {alert.updatedAt && alert.updatedAt !== alert.createdAt && (
          <>
            {' '}
            ·{' '}
            <Trans
              ns="alerts"
              i18nKey="updatedAt"
              components={{
                time: <FormatTime value={alert.updatedAt} format="withYear" />,
              }}
            />
          </>
        )}
      </Text>
    </div>
  );
}
