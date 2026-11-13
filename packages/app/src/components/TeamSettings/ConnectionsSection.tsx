import { useState } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Separator } from '@clickhouse/click-ui';
import { Box, Button, Card, Flex, Stack, Text } from '@mantine/core';
import { IconPencil, IconX } from '@tabler/icons-react';

import { ConnectionForm } from '@/components/ConnectionForm';
import { IS_CLICKHOUSE_BUILD, IS_LOCAL_MODE } from '@/config';
import { useConnections } from '@/connection';

export default function ConnectionsSection() {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const { data: connections } = useConnections();
  const [editedConnectionId, setEditedConnectionId] = useState<string | null>(
    null,
  );
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);

  return (
    <Box id="connections" data-testid="connections-section">
      <Text size="md">{t('connections')}</Text>
      <Separator size="lg" />
      <Card>
        <Stack mb="md">
          {connections?.map(connection => (
            <Box key={connection.id}>
              <Flex justify="space-between" align="flex-start">
                <Stack gap="xs">
                  <Text fw={500} size="lg">
                    {connection.name}
                  </Text>
                  <Text size="sm" c="dimmed">
                    <b>{t('connectionFields.host')}</b> {connection.host}
                  </Text>
                  <Text size="sm" c="dimmed">
                    <b>{t('connectionFields.username')}</b>{' '}
                    {connection.username}
                  </Text>
                  <Text size="sm" c="dimmed">
                    <b>{t('connectionFields.password')}</b>{' '}
                    {t('connectionFields.configured')}
                  </Text>
                </Stack>
                {editedConnectionId !== connection.id ? (
                  <Button
                    variant="subtle"
                    onClick={() => setEditedConnectionId(connection.id)}
                    size="sm"
                  >
                    <IconPencil size={14} className="me-2" />{' '}
                    {tCommon('actions.edit')}
                  </Button>
                ) : (
                  <Button
                    variant="subtle"
                    onClick={() => setEditedConnectionId(null)}
                    size="sm"
                  >
                    <IconX size={14} className="me-2" />{' '}
                    {tCommon('actions.cancel')}
                  </Button>
                )}
              </Flex>
              {editedConnectionId === connection.id && (
                <ConnectionForm
                  connection={connection}
                  isNew={false}
                  onSave={() => {
                    setEditedConnectionId(null);
                  }}
                  showCancelButton={false}
                  showDeleteButton
                />
              )}
              <Separator size="lg" />
            </Box>
          ))}
        </Stack>
        {!isCreatingConnection &&
          (IS_LOCAL_MODE ? (connections?.length ?? 0) < 1 : true) && (
            <Button
              data-testid="add-connection-button"
              variant="primary"
              onClick={() => setIsCreatingConnection(true)}
            >
              {t('addConnection')}
            </Button>
          )}
        {isCreatingConnection && (
          <Stack gap="md">
            <ConnectionForm
              connection={{
                id: 'new',
                name: 'My New Connection',
                host: IS_CLICKHOUSE_BUILD
                  ? window.location.origin
                  : 'http://localhost:8123',
                username: 'default',
                password: '',
              }}
              isNew={true}
              onSave={() => setIsCreatingConnection(false)}
              onClose={() => setIsCreatingConnection(false)}
              showCancelButton
            />
          </Stack>
        )}
      </Card>
    </Box>
  );
}
