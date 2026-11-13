import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Badge, Separator } from '@clickhouse/click-ui';
import type { OrgApiKeyApiResponse } from '@hyperdx/common-utils/dist/types';
import { Box, Button, Card, Group, Table, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import api from '@/api';
import EmptyState from '@/components/EmptyState';
import { InlineNameInput } from '@/components/InlineNameInput/InlineNameInput';
import { currentDate } from '@/timeZone';
import { useConfirm } from '@/useConfirm';
import { useFormatTime } from '@/useFormatTime';

import CreateOrgApiKeyModal from './CreateOrgApiKeyModal';

// A minute tick is close enough for flipping the Expired badge.
const EXPIRY_TICK_MS = 60_000;

// Only read in a state initialiser and the interval, never during render.
const currentTime = () => currentDate().getTime();

function useNow() {
  const [now, setNow] = useState(currentTime);
  useEffect(() => {
    const id = window.setInterval(() => setNow(currentTime()), EXPIRY_TICK_MS);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function OrgApiKeyRow({
  apiKey,
  now,
}: {
  apiKey: OrgApiKeyApiResponse;
  now: number;
}) {
  const { t } = useTranslation('settings');
  const updateKey = api.useUpdateOrgApiKey();
  const deleteKey = api.useDeleteOrgApiKey();
  const confirm = useConfirm();
  const formatTime = useFormatTime();
  const formatDate = (iso: string) => formatTime(iso, { format: 'withYear' });
  const isExpired =
    apiKey.expiresAt != null && Date.parse(apiKey.expiresAt) <= now;

  const onRevoke = async () => {
    const confirmed = await confirm(
      t('orgApiKeys.revokeConfirm'),
      t('orgApiKeys.revoke'),
      { variant: 'danger' },
    );
    if (!confirmed) {
      return;
    }
    deleteKey.mutate(
      { id: apiKey.id },
      {
        onError: e => notifications.show({ color: 'red', message: e.message }),
      },
    );
  };

  return (
    <Table.Tr>
      <Table.Td>
        <InlineNameInput
          size="xs"
          aria-label={t('orgApiKeys.descriptionAria')}
          placeholder={t('orgApiKeys.untitled')}
          value={apiKey.description}
          maxLength={100}
          onCommit={description =>
            updateKey.mutateAsync({ id: apiKey.id, description }).catch(e => {
              notifications.show({
                color: 'red',
                message: t('orgApiKeys.renameFailed', { message: e.message }),
              });
              throw e;
            })
          }
        />
      </Table.Td>
      <Table.Td>
        {apiKey.createdBy
          ? apiKey.createdBy.name || apiKey.createdBy.email
          : t('orgApiKeys.deletedUser')}
      </Table.Td>
      <Table.Td>{formatDate(apiKey.createdAt)}</Table.Td>
      <Table.Td>
        {apiKey.lastUsedAt
          ? formatDate(apiKey.lastUsedAt)
          : t('orgApiKeys.never')}
      </Table.Td>
      <Table.Td>
        {isExpired ? (
          <Badge size="sm" text={t('orgApiKeys.expired')} state="danger" />
        ) : apiKey.expiresAt ? (
          formatDate(apiKey.expiresAt)
        ) : (
          t('orgApiKeys.never')
        )}
      </Table.Td>
      <Table.Td>
        <Button variant="danger" size="xs" onClick={onRevoke}>
          {t('orgApiKeys.revoke')}
        </Button>
      </Table.Td>
    </Table.Tr>
  );
}

export default function OrgApiKeysSection() {
  const { t } = useTranslation('settings');
  const { data, isLoading, isError } = api.useOrgApiKeys();
  const now = useNow();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const keys = data?.data ?? [];

  return (
    <Box id="org_api_keys" data-testid="org-api-keys-section">
      <Group justify="space-between">
        <Box>
          <Text size="md">{t('orgApiKeys.title')}</Text>
          <Text size="sm" c="dimmed">
            {t('orgApiKeys.description')}
          </Text>
        </Box>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          {t('orgApiKeys.create')}
        </Button>
      </Group>
      <Separator size="lg" />
      {isError ? (
        <Text size="sm" variant="danger">
          {t('orgApiKeys.loadError')}
        </Text>
      ) : !isLoading && keys.length === 0 ? (
        <EmptyState variant="card" title={t('orgApiKeys.empty')} />
      ) : (
        <Card>
          <Table horizontalSpacing="md" verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('orgApiKeys.descriptionColumn')}</Table.Th>
                <Table.Th>{t('orgApiKeys.createdBy')}</Table.Th>
                <Table.Th>{t('orgApiKeys.created')}</Table.Th>
                <Table.Th>{t('orgApiKeys.lastUsed')}</Table.Th>
                <Table.Th>{t('orgApiKeys.expires')}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {keys.map(apiKey => (
                <OrgApiKeyRow key={apiKey.id} apiKey={apiKey} now={now} />
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}
      <CreateOrgApiKeyModal
        opened={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </Box>
  );
}
