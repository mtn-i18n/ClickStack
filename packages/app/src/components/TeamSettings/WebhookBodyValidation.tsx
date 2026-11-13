import { useTranslation } from 'next-i18next/pages';
import type { TFunction } from 'i18next';
import { WebhookTemplateError } from '@hyperdx/common-utils/dist/core/handlebarsEnv';
import { Alert, Code } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

const errorTitle = ({ line, column }: WebhookTemplateError, t: TFunction) => {
  if (line == null) return t('webhookValidation.templateError');
  return column == null
    ? t('webhookValidation.templateErrorLine', { line })
    : t('webhookValidation.templateErrorLineColumn', { line, column });
};

export function WebhookBodyValidationAlert({
  error,
}: {
  error: WebhookTemplateError;
}) {
  const { t } = useTranslation('settings');
  return (
    <Alert
      variant="danger"
      icon={<IconAlertTriangle size={16} />}
      title={errorTitle(error, t)}
      data-testid="webhook-body-error"
    >
      <Code block>{error.message}</Code>
    </Alert>
  );
}
