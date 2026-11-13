import { useState } from 'react';
import { useTranslation } from 'next-i18next/pages';
import {
  type OrgApiKeyExpiry,
  OrgApiKeyExpirySchema,
} from '@hyperdx/common-utils/dist/types';
import {
  Button,
  Group,
  Modal,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

import api from '@/api';
import { RevealSnippet } from '@/components/RevealSnippet/RevealSnippet';

export default function CreateOrgApiKeyModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation('settings');
  const expiryOptions = [
    { value: '30d', label: t('createOrgApiKey.expiry30d') },
    { value: '1y', label: t('createOrgApiKey.expiry1y') },
    { value: 'never', label: t('createOrgApiKey.expiryNever') },
  ];
  const createKey = api.useCreateOrgApiKey();
  const [description, setDescription] = useState('');
  const [expiry, setExpiry] = useState<OrgApiKeyExpiry>('30d');
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  // Closing mid-request would let the late response reopen on the old key.
  const close = () => {
    if (createKey.isPending) {
      return;
    }
    setDescription('');
    setExpiry('30d');
    setCreatedKey(null);
    onClose();
  };

  const onCreate = () => {
    createKey.mutate(
      { description: description.trim(), expiry },
      {
        onSuccess: data => setCreatedKey(data.key),
        onError: e => {
          notifications.show({
            color: 'red',
            message: e.message,
            autoClose: 5000,
          });
        },
      },
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={t('createOrgApiKey.title')}
      centered
      // The key is shown once, so only Done may dismiss it.
      closeOnClickOutside={createdKey == null}
      closeOnEscape={createdKey == null}
      withCloseButton={createdKey == null}
    >
      {createdKey != null ? (
        <Stack>
          <Text size="sm">{t('createOrgApiKey.copyNow')}</Text>
          <RevealSnippet value={createdKey} secrets={[createdKey]}>
            <RevealSnippet.Input
              aria-label={t('createOrgApiKey.newKeyAria')}
              revealLabel={t('createOrgApiKey.revealKey')}
              copyLabel={t('createOrgApiKey.copyKey')}
            />
          </RevealSnippet>
          <Group justify="flex-end">
            <Button variant="primary" onClick={close}>
              {t('createOrgApiKey.done')}
            </Button>
          </Group>
        </Stack>
      ) : (
        <Stack>
          <TextInput
            label={t('createOrgApiKey.description')}
            value={description}
            maxLength={100}
            onChange={e => setDescription(e.currentTarget.value)}
            data-autofocus
          />
          <Stack gap={4}>
            <Text size="sm" fw={500}>
              {t('createOrgApiKey.expires')}
            </Text>
            <SegmentedControl
              aria-label={t('createOrgApiKey.expires')}
              data={expiryOptions}
              value={expiry}
              onChange={value => setExpiry(OrgApiKeyExpirySchema.parse(value))}
            />
          </Stack>
          <Group justify="flex-end">
            <Button
              variant="secondary"
              onClick={close}
              disabled={createKey.isPending}
            >
              {t('createOrgApiKey.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={onCreate}
              disabled={description.trim() === ''}
              loading={createKey.isPending}
            >
              {t('createOrgApiKey.create')}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
