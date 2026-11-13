import { useTranslation } from 'next-i18next/pages';
import { Trans } from 'react-i18next';
import { Separator } from '@clickhouse/click-ui';
import { Box, Card, Text } from '@mantine/core';

export default function SecurityPoliciesSection({
  allowedAuthMethods,
}: {
  allowedAuthMethods: string[];
}) {
  const { t } = useTranslation('settings');
  return (
    <Box id="security-policies">
      <Text size="md">{t('security')}</Text>
      <Separator size="lg" />
      <Card>
        <Text size="sm" c="dimmed">
          <Trans
            ns="settings"
            i18nKey="securityPolicies.onlyMethods"
            values={{ methods: allowedAuthMethods.join(', ') }}
            components={{
              methods: <span className="text-capitalize fw-bold" />,
            }}
          />
        </Text>
      </Card>
    </Box>
  );
}
