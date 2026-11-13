import { useTranslation } from 'next-i18next/pages';
import { tcFromSource } from '@hyperdx/common-utils/dist/core/metadata';
import { Box } from '@mantine/core';

import SQLInlineEditor from '@/components/SQLEditor/SQLInlineEditor';
import { useSource } from '@/source';

export function buildPatternColumnExpression({
  patternColumn,
  fallback,
}: {
  patternColumn: string | null | undefined;
  fallback: string;
}): string {
  if (!patternColumn) return fallback;
  return `toString(${patternColumn})`;
}

export function PatternColumnSelector({
  sourceId,
  value,
  onChange,
  onSubmit,
  dateRange,
  bodyValueExpression,
}: {
  sourceId: string | undefined;
  value: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  dateRange?: [Date, Date];
  bodyValueExpression?: string;
}) {
  const { data: source } = useSource({ id: sourceId });
  const { t } = useTranslation('search');
  const tableConnection = tcFromSource(source);

  if (!onChange) return null;

  const placeholder = bodyValueExpression
    ? t('pattern.columnPlaceholderDefault', {
        expression: bodyValueExpression,
      })
    : t('pattern.columnPlaceholder');

  return (
    <Box py="xs" maw={600}>
      <SQLInlineEditor
        tableConnection={tableConnection}
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        enableHotkey
        label={t('pattern.expression')}
        placeholder={placeholder}
        size="xs"
        allowMultiline={false}
        sourceId={sourceId}
        dateRange={dateRange}
      />
    </Box>
  );
}
