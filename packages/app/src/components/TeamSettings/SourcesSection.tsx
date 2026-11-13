import { useTranslation } from 'next-i18next/pages';
import { Separator } from '@clickhouse/click-ui';
import { Box, Text } from '@mantine/core';

import { SourcesList } from '@/components/Sources/SourcesList';

export default function SourcesSection() {
  const { t } = useTranslation('settings');
  return (
    <Box id="sources" data-testid="sources-section">
      <Text size="md">{t('sources')}</Text>
      <Separator size="lg" />
      <SourcesList
        withBorder={false}
        variant="default"
        showEmptyState={false}
      />
    </Box>
  );
}
