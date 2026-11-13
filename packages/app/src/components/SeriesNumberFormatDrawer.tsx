import { useCallback, useEffect } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { useForm, useWatch } from 'react-hook-form';
import { Separator } from '@clickhouse/click-ui';
import { NumberFormat } from '@hyperdx/common-utils/dist/types';
import {
  Button,
  Drawer,
  Group,
  SegmentedControl,
  Stack,
  Text,
} from '@mantine/core';

import { DEFAULT_NUMBER_FORMAT, NumberFormatForm } from './NumberFormat';

type FormState = { numberFormat?: NumberFormat };

interface SeriesNumberFormatDrawerProps {
  opened: boolean;
  numberFormat?: NumberFormat;
  onChange: (format: FormState) => void;
  onClose: () => void;
}

export default function SeriesNumberFormatDrawer({
  numberFormat: initialNumberFormat,
  opened,
  onChange,
  onClose,
}: SeriesNumberFormatDrawerProps) {
  const { t } = useTranslation('charts');
  const { control, handleSubmit, reset, setValue } = useForm<FormState>({
    defaultValues: undefined,
  });

  const numberFormat = useWatch({ control, name: 'numberFormat' });
  const isUsingCustomFormat = numberFormat != null;

  const resetToDefaults = useCallback(() => {
    reset({ numberFormat: initialNumberFormat });
  }, [reset, initialNumberFormat]);

  useEffect(() => {
    resetToDefaults();
  }, [resetToDefaults]);

  const handleClose = useCallback(() => {
    reset({ numberFormat: initialNumberFormat });
    onClose();
  }, [onClose, reset, initialNumberFormat]);

  const applyChanges = useCallback(() => {
    handleSubmit(onChange)();
    onClose();
  }, [onChange, handleSubmit, onClose]);

  return (
    <Drawer
      title={t('seriesDisplaySettings')}
      opened={opened}
      onClose={handleClose}
      position="right"
    >
      <Stack>
        <SegmentedControl
          size="xs"
          value={isUsingCustomFormat ? 'format' : 'inherit'}
          onChange={value => {
            if (value === 'inherit') {
              setValue('numberFormat', undefined);
            } else if (numberFormat) {
              setValue('numberFormat', numberFormat);
            } else {
              setValue('numberFormat', DEFAULT_NUMBER_FORMAT);
            }
          }}
          data={[
            { label: t('inherit'), value: 'inherit' },
            { label: t('custom'), value: 'format' },
          ]}
        />
        {isUsingCustomFormat ? (
          <>
            <NumberFormatForm control={control} setValue={setValue} />
            <Separator size="xs" />
          </>
        ) : (
          <Text size="xs">{t('inheritDisplaySettings')}</Text>
        )}
        <Group gap="xs" mt="xs" justify="space-between">
          {isUsingCustomFormat ? (
            <Button type="submit" variant="secondary" onClick={resetToDefaults}>
              {t('common:actions.reset')}
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" variant="primary" onClick={applyChanges}>
            {t('common:actions.apply')}
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
}
