import { useTranslation } from 'next-i18next/pages';
import { ChartVariable } from '@hyperdx/common-utils/dist/types';
import { Box, Text } from '@mantine/core';

/**
 * Documents the dashboard variables a tile can reference, and how.
 * Renders nothing when variables is undefined or empty.
 */
export function RawSqlVariableInstructions({
  variables,
}: {
  variables: ChartVariable[] | undefined;
}) {
  const { t } = useTranslation('dashboards');

  if (!variables?.length) {
    return null;
  }

  return (
    <Box mb="xs">
      <Text size="xs" fw="bold">
        {t('chartEditor.dashboardVariables')}
      </Text>
      <Text size="xs">
        {t('chartEditor.dashboardVariablesDescription', {
          variables: variables.map(variable => `$${variable.name}`).join(', '),
        })}
      </Text>

      <Text size="xs">{t('chartEditor.dashboardVariablesMacrosHint')}</Text>
    </Box>
  );
}
