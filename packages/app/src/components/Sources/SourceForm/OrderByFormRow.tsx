import { useState } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Control, useWatch } from 'react-hook-form';
import { ClickHouseQueryError } from '@hyperdx/common-utils/dist/clickhouse';
import { TSource } from '@hyperdx/common-utils/dist/types';
import { ActionIcon, Box, Flex, Text, Tooltip } from '@mantine/core';
import { useDebouncedCallback, useDidUpdate } from '@mantine/hooks';
import { IconCheck } from '@tabler/icons-react';

import { EDITOR_INPUT_HEIGHTS } from '@/components/editorInputHeights';
import { ErrorCollapse } from '@/components/Error/ErrorCollapse';
import { SQLInlineEditorControlled } from '@/components/SQLEditor/SQLInlineEditor';
import { useExplainQuery } from '@/hooks/useExplainQuery';

import { FormRow } from './FormRow';

export function OrderByFormRow({
  control,
  databaseName,
  tableName,
  connectionId,
}: {
  control: Control<TSource>;
  databaseName: string;
  tableName: string;
  connectionId: string;
}) {
  const { t } = useTranslation('settings');
  const orderByInput = useWatch({
    control,
    name: 'orderByExpression',
  });

  const [explainExpression, setExplainExpression] = useState<string>();

  const setExplainExpressionDebounced = useDebouncedCallback((expr: string) => {
    setExplainExpression(expr);
  }, 1_000);

  useDidUpdate(() => {
    setExplainExpressionDebounced(orderByInput ?? '');
  }, [orderByInput]);

  const {
    data: explainData,
    error: explainError,
    isLoading: explainLoading,
  } = useExplainQuery(
    {
      from: { databaseName, tableName },
      connection: connectionId,
      select: '*',
      where: '',
      orderBy: explainExpression,
    },
    {
      enabled: !!explainExpression,
    },
  );

  const runValidation = () => {
    setExplainExpression(orderByInput ?? '');
  };

  const isExpressionValid = !!explainData?.length;
  const isExpressionInvalid = explainError instanceof ClickHouseQueryError;

  const shouldShowResult =
    explainExpression === (orderByInput ?? '') &&
    !!explainExpression &&
    (isExpressionValid || isExpressionInvalid);

  return (
    <>
      <FormRow
        label={t('sourceForm.orderBy.label')}
        helpText={t('sourceForm.orderBy.help')}
      >
        <Flex align="flex-start" gap="sm">
          <Box flex={1}>
            <SQLInlineEditorControlled
              tableConnection={{
                databaseName,
                tableName,
                connectionId,
              }}
              control={control}
              name="orderByExpression"
              placeholder="e.g. Timestamp DESC"
              disableKeywordAutocomplete
            />
          </Box>
          <Flex h={`${EDITOR_INPUT_HEIGHTS.sm}px`} align="center">
            <Tooltip label={t('sourceForm.validateExpression')}>
              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                loading={explainLoading}
                disabled={!orderByInput || explainLoading}
                onClick={runValidation}
              >
                <IconCheck size={16} />
              </ActionIcon>
            </Tooltip>
          </Flex>
        </Flex>
        {shouldShowResult && (
          <Box>
            {isExpressionValid && (
              <Text c="green" size="xs">
                {t('sourceForm.expressionValid')}
              </Text>
            )}
            {isExpressionInvalid && (
              <ErrorCollapse
                summary={t('sourceForm.expressionInvalid')}
                details={explainError?.message}
              />
            )}
          </Box>
        )}
      </FormRow>
    </>
  );
}
