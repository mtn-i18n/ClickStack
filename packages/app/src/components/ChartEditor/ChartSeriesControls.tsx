import { ReactNode } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Control, Path } from 'react-hook-form';
import { NumberFormat } from '@hyperdx/common-utils/dist/types';
import {
  ActionIcon,
  Button,
  Divider,
  Group,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconArrowDown,
  IconArrowUp,
  IconCopy,
  IconTrash,
} from '@tabler/icons-react';

import { TextInputControlled } from '@/components/InputControlled';
import { FORMAT_ICONS } from '@/components/NumberFormat';

import { ChartEditorFormState } from './types';

export function ChartSeriesControls({
  control,
  aliasName,
  aliasPlaceholder,
  index,
  length = 1,
  numberFormat,
  onSubmit,
  onSwap,
  onRemove,
  onDuplicate,
  onOpenNumberFormat,
  leadingSection,
  trailingSection,
}: {
  control: Control<ChartEditorFormState>;
  aliasName: Path<ChartEditorFormState>;
  aliasPlaceholder: string;
  index: number;
  length?: number;
  numberFormat?: NumberFormat;
  onSubmit: () => void;
  onSwap?: (from: number, to: number) => void;
  onRemove?: (index: number) => void;
  onDuplicate?: (index: number) => void;
  /** Absent where the row has no format of its own. */
  onOpenNumberFormat?: () => void;
  /** Rendered before the alias (the builder's formula reference badge). */
  leadingSection?: ReactNode;
  /** Rendered after the format button (the builder's color picker). */
  trailingSection?: ReactNode;
}) {
  const { t } = useTranslation('dashboards');
  const isFirst = index <= 0;
  const isLast = index >= length - 1;

  return (
    <Divider
      label={
        <Group gap="xs">
          {leadingSection}
          <Text size="xxs">{t('chartEditor.alias')}</Text>

          <div style={{ width: 150 }}>
            <TextInputControlled
              name={aliasName}
              control={control}
              placeholder={aliasPlaceholder}
              onChange={() => onSubmit()}
              size="xs"
              data-testid="series-alias-input"
            />
          </div>
          {onSwap && !isFirst && (
            <Button
              variant="subtle"
              color="gray"
              size="xxs"
              onClick={() => onSwap(index, index - 1)}
              title={t('chartEditor.moveUp')}
            >
              <IconArrowUp size={14} />
            </Button>
          )}
          {onSwap && !isLast && (
            <Button
              variant="subtle"
              color="gray"
              size="xxs"
              onClick={() => onSwap(index, index + 1)}
              title={t('chartEditor.moveDown')}
            >
              <IconArrowDown size={14} />
            </Button>
          )}
          {onDuplicate && (
            <Button
              variant="subtle"
              color="gray"
              size="xxs"
              onClick={() => onDuplicate(index)}
              title={t('chartEditor.duplicate')}
              data-testid="series-duplicate-button"
            >
              <IconCopy size={14} />
            </Button>
          )}
          {onRemove && (
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              onClick={() => onRemove(index)}
              data-testid="series-remove-button"
            >
              <IconTrash size={14} className="me-2" />
              {t('chartEditor.remove')}
            </Button>
          )}
          {onOpenNumberFormat && (
            <Tooltip label={t('chartEditor.editDisplayFormat')}>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="xs"
                onClick={onOpenNumberFormat}
                aria-label={t('chartEditor.editDisplayFormat')}
              >
                {FORMAT_ICONS[numberFormat?.output ?? 'number']}
              </ActionIcon>
            </Tooltip>
          )}
          {trailingSection}
        </Group>
      }
      labelPosition="right"
      mb={8}
      mt="sm"
    />
  );
}
