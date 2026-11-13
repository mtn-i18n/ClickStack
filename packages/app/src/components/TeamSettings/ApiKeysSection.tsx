import { useTranslation } from 'next-i18next/pages';
import { Trans } from 'react-i18next';
import { Separator } from '@clickhouse/click-ui';
import { Box, Button, Card, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import api from '@/api';
import { RevealSnippet } from '@/components/RevealSnippet/RevealSnippet';
import { useConfirm } from '@/useConfirm';

// The reveal Input fills its container, so cap its width here at the parent.
const KEY_FIELD_MAX_WIDTH = 420;

/** Masked, read-only API-key field with an inline reveal eye and copy icon. */
function APIKeyCopyButton({
  value,
  dataTestId,
  ariaLabel,
}: {
  value: string;
  dataTestId?: string;
  ariaLabel?: string;
}) {
  const { t } = useTranslation('settings');
  return (
    <RevealSnippet value={value} secrets={[value]}>
      <RevealSnippet.Input
        aria-label={ariaLabel}
        data-testid={dataTestId}
        revealLabel={t('apiKeysSection.revealKey')}
        copyLabel={t('apiKeysSection.copyKey')}
      />
    </RevealSnippet>
  );
}

export default function ApiKeysSection() {
  const { t } = useTranslation('settings');
  const { data: team, refetch: refetchTeam } = api.useTeam();
  const { data: me, isLoading: isLoadingMe } = api.useMe();
  const rotateTeamApiKey = api.useRotateTeamApiKey();
  const rotatePersonalAccessKey = api.useRotatePersonalAccessKey();
  const confirm = useConfirm();
  const hasAdminAccess = true;

  // `confirm` resolves exactly once, so a double click on its Confirm button
  // during the modal's exit transition cannot fire a second rotation.
  const onRotateTeamApiKey = async () => {
    const confirmed = await confirm(
      <Trans
        ns="settings"
        i18nKey="apiKeysSection.rotateTeamConfirm"
        components={{ b: <b /> }}
      />,
      t('apiKeysSection.rotateKey'),
      { variant: 'danger' },
    );
    if (!confirmed) {
      return;
    }

    rotateTeamApiKey.mutate(undefined, {
      onSuccess: () => {
        notifications.show({
          color: 'green',
          message: t('apiKeysSection.rotateTeamSuccess'),
        });
        refetchTeam();
      },
      onError: e => {
        notifications.show({
          color: 'red',
          message: e.message,
          autoClose: 5000,
        });
      },
    });
  };

  const onRotateAccessKey = async () => {
    const confirmed = await confirm(
      <Trans
        ns="settings"
        i18nKey="apiKeysSection.rotatePersonalConfirm"
        components={{ b: <b /> }}
      />,
      t('apiKeysSection.rotateKey'),
      { variant: 'danger' },
    );
    if (!confirmed) {
      return;
    }

    rotatePersonalAccessKey.mutate(undefined, {
      onSuccess: () => {
        notifications.show({
          color: 'green',
          message: t('apiKeysSection.rotatePersonalSuccess'),
        });
      },
      onError: e => {
        notifications.show({
          color: 'red',
          message: e.message,
          autoClose: 5000,
        });
      },
    });
  };

  return (
    <Box id="api_keys" data-testid="api-keys-section">
      <Text size="md">{t('apiKeys')}</Text>
      <Separator size="lg" />
      <Card mb="md">
        <Text mb="md">{t('apiKeysSection.ingestionKey')}</Text>
        <Group gap="xs" align="flex-start" wrap="nowrap">
          {team?.apiKey && (
            <Box flex={1} miw={0} maw={KEY_FIELD_MAX_WIDTH}>
              <APIKeyCopyButton
                value={team.apiKey}
                dataTestId="ingestion-api-key"
                ariaLabel={t('apiKeysSection.ingestionKey')}
              />
            </Box>
          )}
          {hasAdminAccess && (
            <Button
              data-testid="rotate-api-key-button"
              variant="danger"
              onClick={onRotateTeamApiKey}
            >
              {t('apiKeysSection.rotateApiKey')}
            </Button>
          )}
        </Group>
      </Card>
      {!isLoadingMe && me != null && (
        <Card>
          <Card.Section p="md">
            <Text mb="md">{t('apiKeysSection.personalKey')}</Text>
            <Group gap="xs" align="flex-start" wrap="nowrap">
              <Box flex={1} miw={0} maw={KEY_FIELD_MAX_WIDTH}>
                <APIKeyCopyButton
                  value={me.accessKey}
                  dataTestId="personal-access-key"
                  ariaLabel={t('apiKeysSection.personalKey')}
                />
              </Box>
              <Button
                data-testid="rotate-access-key-button"
                variant="danger"
                onClick={onRotateAccessKey}
              >
                {t('apiKeysSection.rotateAccessKey')}
              </Button>
            </Group>
          </Card.Section>
        </Card>
      )}
    </Box>
  );
}
