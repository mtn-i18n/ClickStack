import { useTranslation } from 'next-i18next/pages';
import { Flex, Text } from '@mantine/core';

type ColorLegendProps = {
  colors: string[];
};

export function ColorLegend({ colors }: ColorLegendProps) {
  const { t } = useTranslation('charts');

  return (
    <Flex align="center" gap={4} role="img" aria-label={t('colorScaleAria')}>
      <Text size="10px" c="dimmed">
        {t('low')}
      </Text>
      <div
        style={{
          display: 'flex',
          width: 80,
          height: 8,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {colors.map(color => (
          <div key={color} style={{ flex: 1, background: color }} />
        ))}
      </div>
      <Text size="10px" c="dimmed">
        {t('high')}
      </Text>
    </Flex>
  );
}
