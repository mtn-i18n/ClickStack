import { useTranslation } from 'next-i18next/pages';
import { Separator } from '@clickhouse/click-ui';
import { Box, Card, Stack, Text } from '@mantine/core';

import WebhooksSection from './WebhooksSection';

export default function IntegrationsSection() {
  const { t } = useTranslation('settings');
  return (
    <Box id="integrations" data-testid="integrations-section">
      <Text size="md">{t('integrations')}</Text>
      <Separator size="lg" />
      <Card>
        <Stack gap="md">
          <WebhooksSection />
        </Stack>
      </Card>
    </Box>
  );
}
