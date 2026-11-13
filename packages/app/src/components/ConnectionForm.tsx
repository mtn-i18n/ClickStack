import { useCallback, useState } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { omit } from 'lodash';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { testLocalConnection } from '@hyperdx/common-utils/dist/clickhouse/browser';
import { Connection } from '@hyperdx/common-utils/dist/types';
import {
  Anchor,
  Box,
  Button,
  Flex,
  Group,
  Stack,
  Switch,
  Text,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconHelpCircle, IconSettings } from '@tabler/icons-react';

import api from '@/api';
import {
  InputControlled,
  PasswordInputControlled,
  TextInputControlled,
} from '@/components/InputControlled';
import {
  IS_CLICKHOUSE_BUILD,
  IS_LOCAL_MODE,
  IS_PROMQL_ENABLED,
} from '@/config';
import {
  useCreateConnection,
  useDeleteConnection,
  useUpdateConnection,
} from '@/connection';
import { stripTrailingSlash } from '@/utils';

import ConfirmDeleteMenu from './ConfirmDeleteMenu';

enum TestConnectionState {
  Loading = 'loading',
  Valid = 'valid',
  Invalid = 'invalid',
}

function useTestConnection({
  getValues,
}: {
  getValues: (name: string) => string;
}) {
  const { t } = useTranslation('settings');
  const testConnection = api.useTestConnection();
  const [testConnectionState, setTestConnectionState] =
    useState<TestConnectionState | null>(null);

  const handleTestConnection = useCallback(async () => {
    const hostValue = getValues('host');
    const username = getValues('username');
    const password = getValues('password');
    const host = stripTrailingSlash(hostValue);

    if (testConnectionState) {
      return;
    }

    setTestConnectionState(TestConnectionState.Loading);

    if (IS_LOCAL_MODE) {
      try {
        const result = await testLocalConnection({ host, username, password });
        if (result) {
          setTestConnectionState(TestConnectionState.Valid);
        } else {
          setTestConnectionState(TestConnectionState.Invalid);
          notifications.show({
            color: 'red',
            message: t('connectionForm.testFailed'),
            autoClose: 5000,
          });
        }
      } catch (e) {
        console.error(e);
        setTestConnectionState(TestConnectionState.Invalid);
        notifications.show({
          color: 'red',
          message: e.message,
          autoClose: 5000,
        });
      }
    } else {
      try {
        const result = await testConnection.mutateAsync({
          host,
          username,
          password,
        });
        if (result.success) {
          setTestConnectionState(TestConnectionState.Valid);
        } else {
          setTestConnectionState(TestConnectionState.Invalid);
          notifications.show({
            color: 'red',
            message: result.error || t('connectionForm.testFailed'),
            autoClose: 5000,
          });
        }
      } catch (error: any) {
        const body = await error.response?.json();
        setTestConnectionState(TestConnectionState.Invalid);
        notifications.show({
          color: 'red',
          message: body?.error ?? t('connectionForm.testFailedGeneric'),
          autoClose: 5000,
        });
      }
    }

    setTimeout(() => {
      setTestConnectionState(null);
    }, 2000);
  }, [getValues, testConnection, testConnectionState, t]);

  return {
    testConnectionState,
    handleTestConnection,
  };
}

export function ConnectionForm({
  connection,
  isNew,
  onSave,
  onClose,
  showCancelButton = false,
  showDeleteButton = false,
}: {
  connection: Connection;
  isNew: boolean;
  onSave?: () => void;
  onClose?: () => void;
  showCancelButton?: boolean;
  showDeleteButton?: boolean;
}) {
  const { t } = useTranslation('settings');
  const { control, handleSubmit, resetField, getValues, formState, trigger } =
    useForm<Connection>({
      defaultValues: {
        id: connection.id,
        name: connection.name,
        host: connection.host ?? '',
        username: connection.username,
        password: connection.password,
        hyperdxSettingPrefix: connection.hyperdxSettingPrefix,
        isPrometheusEndpoint: connection.isPrometheusEndpoint,
      },
    });

  const watchedHost = useWatch({ control, name: 'host' });
  const isPrometheusEndpoint = useWatch({
    control,
    name: 'isPrometheusEndpoint',
  });

  const createConnection = useCreateConnection();
  const updateConnection = useUpdateConnection();
  const deleteConnection = useDeleteConnection();

  const onSubmit = (data: Connection) => {
    const stripped = data.host ? stripTrailingSlash(data.host) : '';
    const normalizedData: Connection = data.isPrometheusEndpoint
      ? {
          ...data,
          host: stripped,
          username: '',
          hyperdxSettingPrefix: null,
        }
      : {
          ...data,
          host: stripped,
          hyperdxSettingPrefix: data.hyperdxSettingPrefix || null,
        };

    if (isNew) {
      const connection = omit(normalizedData, ['id']);
      createConnection.mutate(
        { connection },
        {
          onSuccess: () => {
            notifications.show({
              color: 'green',
              message: t('connectionForm.created'),
            });
            onSave?.();
          },
          onError: () => {
            notifications.show({
              color: 'red',
              message: t('connectionForm.createError'),
              autoClose: 5000,
            });
          },
        },
      );
    } else {
      updateConnection.mutate(
        { connection: normalizedData, id: connection.id },
        {
          onSuccess: () => {
            notifications.show({
              color: 'green',
              message: t('connectionForm.updated'),
            });
            onSave?.();
          },
          onError: () => {
            notifications.show({
              color: 'red',
              message: t('connectionForm.updateError'),
              autoClose: 5000,
            });
          },
        },
      );
    }
  };

  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const { testConnectionState, handleTestConnection } = useTestConnection({
    getValues,
  });

  return (
    <form
      data-testid="connection-form"
      onSubmit={e => {
        e.preventDefault();
        handleSubmit(d => {
          onSubmit(d);
        })();
      }}
    >
      <Stack gap="md">
        <Box>
          <Text size="xs" mb="xs">
            {t('connectionForm.nameLabel')}
          </Text>
          <InputControlled
            data-testid="connection-name-input"
            name="name"
            control={control}
            placeholder={t('connectionForm.namePlaceholder')}
            rules={{ required: t('connectionForm.nameRequired') }}
          />
        </Box>
        <Box>
          <Group gap="xs" mb="xs">
            <Text size="xs">{t('connectionForm.hostLabel')}</Text>
            <Tooltip
              label={
                isPrometheusEndpoint
                  ? t('connectionForm.hostTooltipPrometheus')
                  : t('connectionForm.hostTooltip')
              }
              color="dark"
              c="white"
              multiline
              maw={400}
            >
              <IconHelpCircle size={16} className="cursor-pointer" />
            </Tooltip>
          </Group>
          <TextInputControlled
            data-testid="connection-host-input"
            name="host"
            control={control}
            placeholder={
              isPrometheusEndpoint
                ? 'http://thanos-querier:10902'
                : IS_CLICKHOUSE_BUILD
                  ? window.location.origin
                  : 'http://localhost:8123'
            }
            rules={{
              validate: value => {
                if (typeof value !== 'string' || !value) {
                  return t('connectionForm.hostRequired');
                }
                if (isPrometheusEndpoint) {
                  try {
                    new URL(value);
                    return true;
                  } catch {
                    return t('connectionForm.hostInvalid');
                  }
                }
                return true;
              },
            }}
          />
        </Box>
        {!isPrometheusEndpoint && (
          <>
            <Box>
              <Text size="xs" mb="xs">
                {t('connectionForm.usernameLabel')}
              </Text>
              <InputControlled
                data-testid="connection-username-input"
                name="username"
                control={control}
                placeholder={t('connectionForm.usernamePlaceholder')}
              />
            </Box>
            <Box>
              <Text size="xs" mb="xs">
                {t('connectionForm.passwordLabel')}
              </Text>
              {!showUpdatePassword && !isNew && (
                <Button
                  data-testid="update-password-button"
                  variant="secondary"
                  onClick={() => {
                    setShowUpdatePassword(true);
                  }}
                >
                  {t('connectionForm.updatePassword')}
                </Button>
              )}
              {(showUpdatePassword || isNew) && (
                <Flex align="center" gap="sm">
                  <PasswordInputControlled
                    data-testid="connection-password-input"
                    style={{ flexGrow: 1 }}
                    name="password"
                    control={control}
                    placeholder={t('connectionForm.passwordPlaceholder')}
                  />
                  {!isNew && (
                    <Button
                      data-testid="cancel-password-button"
                      variant="secondary"
                      onClick={() => {
                        setShowUpdatePassword(false);
                        resetField('password');
                      }}
                    >
                      {t('cancel')}
                    </Button>
                  )}
                </Flex>
              )}
            </Box>
          </>
        )}
        <Box>
          {!showAdvancedSettings && (
            <Anchor
              underline="always"
              onClick={() => setShowAdvancedSettings(true)}
              size="xs"
            >
              <Group gap="xs">
                <IconSettings size={14} />
                {t('connectionForm.advancedSettings')}
              </Group>
            </Anchor>
          )}
          {showAdvancedSettings && (
            <Button
              onClick={() => setShowAdvancedSettings(false)}
              size="xs"
              variant="subtle"
            >
              {t('connectionForm.hideAdvancedSettings')}
            </Button>
          )}
        </Box>
        <Box
          style={{
            display: showAdvancedSettings ? 'block' : 'none',
          }}
        >
          <Stack gap="md">
            {IS_PROMQL_ENABLED && (
              <Box>
                <Controller
                  control={control}
                  name="isPrometheusEndpoint"
                  render={({ field: { value, onChange } }) => (
                    <Group gap="xs">
                      <Switch
                        data-testid="connection-prometheus-compatible-switch"
                        checked={!!value}
                        onChange={e => {
                          onChange(e.currentTarget.checked);
                          if (
                            formState.isSubmitted ||
                            formState.touchedFields.host
                          ) {
                            void trigger('host');
                          }
                        }}
                      />
                      <Text size="sm">
                        {t('connectionForm.prometheusCompatible')}
                      </Text>
                      <Tooltip
                        label={t('connectionForm.prometheusCompatibleTooltip')}
                        color="dark"
                        c="white"
                        multiline
                        maw={400}
                      >
                        <IconHelpCircle size={16} className="cursor-pointer" />
                      </Tooltip>
                    </Group>
                  )}
                />
              </Box>
            )}
            {!isPrometheusEndpoint && (
              <Box>
                <Group gap="xs" mb="xs">
                  <Text size="xs">{t('connectionForm.queryLogPrefix')}</Text>
                  <Tooltip
                    label={t('connectionForm.queryLogPrefixTooltip')}
                    color="dark"
                    c="white"
                    multiline
                    maw={400}
                  >
                    <IconHelpCircle size={16} className="cursor-pointer" />
                  </Tooltip>
                </Group>
                <InputControlled
                  data-testid="connection-setting-prefix-input"
                  name="hyperdxSettingPrefix"
                  control={control}
                  placeholder="hyperdx"
                />
              </Box>
            )}
          </Stack>
        </Box>
        <Group justify="space-between">
          <Tooltip
            label={
              isPrometheusEndpoint
                ? t('connectionForm.testTooltipPrometheus')
                : !watchedHost
                  ? t('connectionForm.testTooltipNoHost')
                  : t('connectionForm.testTooltipPassword')
            }
            position="right"
            disabled={isNew && !!watchedHost && !isPrometheusEndpoint}
            withArrow
          >
            <Button
              disabled={
                !formState.isValid || !watchedHost || isPrometheusEndpoint
              }
              variant={
                testConnectionState === TestConnectionState.Invalid
                  ? 'danger'
                  : 'secondary'
              }
              type="button"
              onClick={handleTestConnection}
              loading={testConnectionState === TestConnectionState.Loading}
            >
              {testConnectionState === TestConnectionState.Valid ? (
                <>{t('connectionForm.testSuccess')}</>
              ) : testConnectionState === TestConnectionState.Invalid ? (
                <>{t('connectionForm.testUnreachable')}</>
              ) : (
                t('connectionForm.testConnection')
              )}
            </Button>
          </Tooltip>
          <Group gap="xs">
            {onClose && showCancelButton && (
              <Button variant="secondary" onClick={onClose}>
                {t('cancel')}
              </Button>
            )}
            {!isNew && showDeleteButton !== false && (
              <ConfirmDeleteMenu
                onDelete={() =>
                  deleteConnection.mutate(
                    { id: connection.id },
                    {
                      onSuccess: () => {
                        onClose?.();
                      },
                    },
                  )
                }
              />
            )}
            <Button
              data-testid="connection-save-button"
              variant="primary"
              type="submit"
              loading={
                isNew ? createConnection.isPending : updateConnection.isPending
              }
            >
              {isNew
                ? t('connectionForm.createConnection')
                : t('connectionForm.saveConnection')}
            </Button>
          </Group>
        </Group>
      </Stack>
    </form>
  );
}
