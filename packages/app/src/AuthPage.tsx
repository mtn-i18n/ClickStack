import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { NextSeo } from 'next-seo';
import { HTTPError } from 'ky';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { Trans } from 'react-i18next';
import {
  Button,
  Notification,
  Paper,
  PasswordInput,
  Stack,
  TextInput,
} from '@mantine/core';
import { IconAt, IconLock } from '@tabler/icons-react';

import api from './api';
import { useBrandDisplayName, usePageTitle } from './brand';
import * as config from './config';
import LandingHeader from './LandingHeader';
import { CheckOrX, PasswordCheck } from './PasswordCheck';

type FormData = {
  email: string;
  password: string;
  confirmPassword: string;
};

export default function AuthPage({ action }: { action: 'register' | 'login' }) {
  const { t } = useTranslation('auth');
  const brandName = useBrandDisplayName();
  const { data: team, isLoading: teamIsLoading } = api.useTeam();
  const router = useRouter();

  const isLoggedIn = Boolean(!teamIsLoading && team);

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/search');
    }
  }, [isLoggedIn, router]);

  const isRegister = action === 'register';
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    control,
  } = useForm<FormData>({
    reValidateMode: 'onSubmit',
  });

  const { err, msg } = router.query;

  const { data: installation } = api.useInstallation();
  const registerPassword = api.useRegisterPassword();

  const verificationSent = msg === 'verify';
  const title = usePageTitle(isRegister ? t('signUp') : t('login'));

  useEffect(() => {
    // If an OSS user accidentally lands on /register after already creating a team
    // redirect them to login instead
    if (config.IS_OSS && installation?.isTeamExisting === true && isRegister) {
      router.push('/login');
    }
  }, [installation, isRegister, router]);

  const currentPassword = useWatch({
    control,
    name: 'password',
    defaultValue: '',
  });
  const confirmPassword = useWatch({
    control,
    name: 'confirmPassword',
    defaultValue: '',
  });

  const confirmPass = () => {
    return currentPassword === confirmPassword;
  };

  const onSubmit: SubmitHandler<FormData> = data =>
    registerPassword.mutate(
      {
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      },
      {
        onSuccess: () => router.push('/search'),
        onError: async error => {
          if (error instanceof HTTPError) {
            const jsonData = await error.response.json();

            if (Array.isArray(jsonData) && jsonData[0]?.errors?.issues) {
              return jsonData[0].errors.issues.forEach((issue: any) => {
                setError(issue.path[0], {
                  type: issue.code,
                  message: issue.message,
                });
              });
            }
          }
          setError('root', {
            type: 'manual',
            message: t('unexpectedError'),
          });
        },
      },
    );

  const form = isRegister
    ? {
        controller: { onSubmit: handleSubmit(onSubmit) },
        email: register('email', { required: true }),
        password: register('password', { required: true }),
        confirmPassword: register('confirmPassword', { required: true }),
      }
    : {
        controller: {
          action: `/api/login/password`,
          method: 'POST',
        },
        email: { name: 'email' },
        password: { name: 'password' },
      };

  return (
    <div className="AuthPage">
      <NextSeo title={title} />
      <LandingHeader activeKey={`/${action}`} fixed />
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div style={{ width: '26rem' }}>
          <div className="text-center mb-2 fs-5 " style={{ marginTop: -30 }}>
            {config.IS_OSS && isRegister
              ? t('setup')
              : isRegister
                ? t('registerFor')
                : t('loginTo')}
            <span className="text-brand fw-bold">{brandName}</span>
          </div>
          {action === 'login' && (
            <div className="text-center mb-2 ">{t('welcomeBack')}</div>
          )}
          {isRegister && config.IS_OSS === true && (
            <div className="text-center mb-2 text-muted">
              {t('createAccountHint')}
            </div>
          )}
          <form className="text-start mt-4" {...form.controller}>
            <Stack gap="xl">
              <Paper p={34} shadow="md" radius="md">
                <Stack gap="lg">
                  <TextInput
                    label={t('email')}
                    size="md"
                    withAsterisk={false}
                    placeholder={t('emailPlaceholder')}
                    type="email"
                    leftSection={<IconAt size={18} />}
                    error={errors.email?.message}
                    required
                    {...form.email}
                  />
                  <PasswordInput
                    size="md"
                    label={t('password')}
                    withAsterisk={false}
                    leftSection={<IconLock size={16} />}
                    error={errors.password?.message}
                    required
                    placeholder={t('password')}
                    {...form.password}
                  />
                  {isRegister && (
                    <>
                      <PasswordInput
                        label={
                          <CheckOrX
                            handler={confirmPass}
                            password={currentPassword}
                          >
                            {t('confirmPassword')}
                          </CheckOrX>
                        }
                        size="md"
                        required
                        withAsterisk={false}
                        leftSection={<IconLock size={16} />}
                        error={errors.confirmPassword?.message}
                        placeholder={t('confirmPassword')}
                        {...form.confirmPassword}
                      />
                      <Notification withCloseButton={false}>
                        <PasswordCheck password={currentPassword} />
                      </Notification>
                    </>
                  )}
                  <Button
                    mt={4}
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isSubmitting || verificationSent}
                    loading={isSubmitting}
                    data-test-id="submit"
                  >
                    {config.IS_OSS && isRegister
                      ? t('create')
                      : isRegister
                        ? t('register')
                        : t('login')}
                  </Button>
                </Stack>
              </Paper>

              {err != null && (
                <Notification
                  withCloseButton={false}
                  withBorder
                  color="red"
                  data-test-id="auth-error-msg"
                >
                  {err === 'missing'
                    ? t('invalidEmailOrPassword')
                    : err === 'invalid'
                      ? t('emailOrPasswordInvalid')
                      : err === 'authFail'
                        ? t('loginFailed')
                        : err === 'passwordAuthNotAllowed'
                          ? t('passwordAuthNotAllowed')
                          : err === 'teamAlreadyExists'
                            ? t('teamAlreadyExists')
                            : t('unexpectedError')}
                </Notification>
              )}

              {verificationSent && (
                <Notification
                  withCloseButton={false}
                  withBorder
                  color="green"
                  data-test-id="auth-msg"
                >
                  {t('verificationSent')}
                </Notification>
              )}

              {isRegister && config.IS_OSS === false && (
                <div data-test-id="login-link" className="text-center fs-8 ">
                  <Trans
                    ns="auth"
                    i18nKey="alreadyHaveAccountLink"
                    components={{ link: <Link href="/login" /> }}
                  />
                </div>
              )}
              {action === 'login' && config.IS_OSS === false && (
                <div data-test-id="register-link" className="text-center fs-8 ">
                  <Trans
                    ns="auth"
                    i18nKey="noAccountLink"
                    components={{ link: <Link href="/register" /> }}
                  />
                </div>
              )}
            </Stack>
          </form>
        </div>
      </div>
    </div>
  );
}
