import { useTranslation } from 'next-i18next/pages';
import { useFieldArray } from 'react-hook-form';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  InputLabel,
  Stack,
  Text,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';

import { TextInputControlled } from '@/components/InputControlled';

import { DrawerControl } from './utils';

export function FilterTemplateList({ control }: { control: DrawerControl }) {
  const { t } = useTranslation('dashboards');
  const {
    fields: filters,
    append,
    remove,
  } = useFieldArray({
    control,
    name: 'onClick.filters' as const,
  });

  return (
    <Box>
      <InputLabel>{t('chartEditor.onClick.filters')}</InputLabel>
      <Text size="xs" c="dimmed" mb="xs">
        {t('chartEditor.onClick.filtersDescription')}
      </Text>
      <Stack gap="xs">
        {filters.map((filter, i) => (
          <Group key={filter.id} gap="xs" align="flex-start" wrap="nowrap">
            <TextInputControlled
              control={control}
              name={`onClick.filters.${i}.expression` as const}
              placeholder={t('chartEditor.onClick.expression')}
              style={{ flex: 1 }}
              data-testid="onclick-filter-expression-input"
            />
            <TextInputControlled
              control={control}
              name={`onClick.filters.${i}.template` as const}
              placeholder={t('chartEditor.onClick.template', {
                pattern: '{{ServiceName}}',
              })}
              style={{ flex: 1 }}
              data-testid="onclick-filter-template-input"
            />
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label={t('chartEditor.onClick.removeFilter')}
              onClick={() => remove(i)}
              mt={3}
              data-testid="onclick-filter-remove-button"
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        ))}
        <Button
          variant="subtle"
          size="compact-sm"
          leftSection={<IconPlus size={14} />}
          onClick={() =>
            append({
              kind: 'expressionTemplate',
              expression: '',
              template: '',
            })
          }
          style={{ alignSelf: 'flex-start' }}
        >
          {t('chartEditor.onClick.addFilter')}
        </Button>
      </Stack>
    </Box>
  );
}
