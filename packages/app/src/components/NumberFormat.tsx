import * as React from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'next-i18next/pages';
import {
  Control,
  Controller,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import { NumberFormat, NumericUnit } from '@hyperdx/common-utils/dist/types';
import {
  Checkbox as MCheckbox,
  NativeSelect,
  Paper,
  Slider,
  Stack,
  TextInput,
} from '@mantine/core';
import {
  IconClock,
  IconCurrencyDollar,
  IconDatabase,
  IconHourglass,
  IconNumbers,
  IconPercentage,
} from '@tabler/icons-react';

import { formatNumber } from '@/utils';

import { ChartConfigDisplaySettings } from './ChartDisplaySettingsDrawer';

export const FORMAT_ICONS: Record<string, React.ReactNode> = {
  number: <IconNumbers size={14} />,
  currency: <IconCurrencyDollar size={14} />,
  percent: <IconPercentage size={14} />,
  byte: <IconDatabase size={14} />,
  time: <IconClock size={14} />,
  duration: <IconHourglass size={14} />,
  data_rate: <IconDatabase size={14} />,
  throughput: <IconNumbers size={14} />,
};

const TEST_NUMBER = 1234;

export const DEFAULT_NUMBER_FORMAT: NumberFormat = {
  factor: 1,
  output: 'number' as const,
  mantissa: 2,
  thousandSeparated: true,
  average: false,
  decimalBytes: false,
};

type UnitOption = { value: NumericUnit; labelKey: string };
type OutputOption = { value: NumberFormat['output']; labelKey: string };
type OutputGroup = { groupKey: string; items: OutputOption[] };

const DATA_UNIT_OPTIONS: UnitOption[] = [
  { value: NumericUnit.BytesIEC, labelKey: 'unitBytesIEC' },
  { value: NumericUnit.BytesSI, labelKey: 'unitBytesSI' },
  { value: NumericUnit.BitsIEC, labelKey: 'unitBitsIEC' },
  { value: NumericUnit.BitsSI, labelKey: 'unitBitsSI' },
  { value: NumericUnit.Kibibytes, labelKey: 'unitKibibytes' },
  { value: NumericUnit.Kilobytes, labelKey: 'unitKilobytes' },
  { value: NumericUnit.Mebibytes, labelKey: 'unitMebibytes' },
  { value: NumericUnit.Megabytes, labelKey: 'unitMegabytes' },
  { value: NumericUnit.Gibibytes, labelKey: 'unitGibibytes' },
  { value: NumericUnit.Gigabytes, labelKey: 'unitGigabytes' },
  { value: NumericUnit.Tebibytes, labelKey: 'unitTebibytes' },
  { value: NumericUnit.Terabytes, labelKey: 'unitTerabytes' },
  { value: NumericUnit.Pebibytes, labelKey: 'unitPebibytes' },
  { value: NumericUnit.Petabytes, labelKey: 'unitPetabytes' },
];

const DATA_RATE_UNIT_OPTIONS: UnitOption[] = [
  { value: NumericUnit.PacketsSec, labelKey: 'unitPacketsSec' },
  { value: NumericUnit.BytesSecIEC, labelKey: 'unitBytesSecIEC' },
  { value: NumericUnit.BytesSecSI, labelKey: 'unitBytesSecSI' },
  { value: NumericUnit.BitsSecIEC, labelKey: 'unitBitsSecIEC' },
  { value: NumericUnit.BitsSecSI, labelKey: 'unitBitsSecSI' },
  { value: NumericUnit.KibibytesSec, labelKey: 'unitKibibytesSec' },
  { value: NumericUnit.KibibitsSec, labelKey: 'unitKibibitsSec' },
  { value: NumericUnit.KilobytesSec, labelKey: 'unitKilobytesSec' },
  { value: NumericUnit.KilobitsSec, labelKey: 'unitKilobitsSec' },
  { value: NumericUnit.MebibytesSec, labelKey: 'unitMebibytesSec' },
  { value: NumericUnit.MebibitsSec, labelKey: 'unitMebibitsSec' },
  { value: NumericUnit.MegabytesSec, labelKey: 'unitMegabytesSec' },
  { value: NumericUnit.MegabitsSec, labelKey: 'unitMegabitsSec' },
  { value: NumericUnit.GibibytesSec, labelKey: 'unitGibibytesSec' },
  { value: NumericUnit.GibibitsSec, labelKey: 'unitGibibitsSec' },
  { value: NumericUnit.GigabytesSec, labelKey: 'unitGigabytesSec' },
  { value: NumericUnit.GigabitsSec, labelKey: 'unitGigabitsSec' },
  { value: NumericUnit.TebibytesSec, labelKey: 'unitTebibytesSec' },
  { value: NumericUnit.TebibitsSec, labelKey: 'unitTebibitsSec' },
  { value: NumericUnit.TerabytesSec, labelKey: 'unitTerabytesSec' },
  { value: NumericUnit.TerabitsSec, labelKey: 'unitTerabitsSec' },
  { value: NumericUnit.PebibytesSec, labelKey: 'unitPebibytesSec' },
  { value: NumericUnit.PebibitsSec, labelKey: 'unitPebibitsSec' },
  { value: NumericUnit.PetabytesSec, labelKey: 'unitPetabytesSec' },
  { value: NumericUnit.PetabitsSec, labelKey: 'unitPetabitsSec' },
];

const THROUGHPUT_UNIT_OPTIONS: UnitOption[] = [
  { value: NumericUnit.Cps, labelKey: 'unitCps' },
  { value: NumericUnit.Ops, labelKey: 'unitOps' },
  { value: NumericUnit.Rps, labelKey: 'unitRps' },
  { value: NumericUnit.ReadsSec, labelKey: 'unitReadsSec' },
  { value: NumericUnit.Wps, labelKey: 'unitWps' },
  { value: NumericUnit.Iops, labelKey: 'unitIops' },
  { value: NumericUnit.Cpm, labelKey: 'unitCpm' },
  { value: NumericUnit.Opm, labelKey: 'unitOpm' },
  { value: NumericUnit.RpmReads, labelKey: 'unitRpmReads' },
  { value: NumericUnit.Wpm, labelKey: 'unitWpm' },
];

const UNIT_OPTIONS_BY_OUTPUT: Record<string, UnitOption[]> = {
  byte: DATA_UNIT_OPTIONS,
  data_rate: DATA_RATE_UNIT_OPTIONS,
  throughput: THROUGHPUT_UNIT_OPTIONS,
};

const DEFAULT_NUMERIC_UNIT_BY_OUTPUT: Partial<
  Record<NumberFormat['output'], NumericUnit>
> = {
  byte: NumericUnit.BytesIEC,
  data_rate: NumericUnit.BytesSecIEC,
  throughput: NumericUnit.Cps,
};

const OUTPUT_CATEGORY_OPTIONS: OutputGroup[] = [
  {
    groupKey: 'outputGroupBasic',
    items: [
      { value: 'number', labelKey: 'outputNumber' },
      { value: 'currency', labelKey: 'outputCurrency' },
      { value: 'percent', labelKey: 'outputPercentage' },
      { value: 'duration', labelKey: 'outputDuration' },
      { value: 'time', labelKey: 'outputTimeClock' },
    ],
  },
  {
    groupKey: 'outputGroupData',
    items: [{ value: 'byte', labelKey: 'outputData' }],
  },
  {
    groupKey: 'outputGroupNetwork',
    items: [
      { value: 'data_rate', labelKey: 'outputDataRate' },
      { value: 'throughput', labelKey: 'outputThroughput' },
    ],
  },
];

const hasNumericUnit = (output: string) =>
  output === 'byte' || output === 'data_rate' || output === 'throughput';

export const NumberFormatForm: React.FC<{
  control: Control<Pick<ChartConfigDisplaySettings, 'numberFormat'>>;
  setValue: UseFormSetValue<Pick<ChartConfigDisplaySettings, 'numberFormat'>>;
  disclaimer?: React.ReactNode;
}> = ({ control, setValue, disclaimer }) => {
  const { t } = useTranslation('charts');
  const format =
    useWatch({ control, name: 'numberFormat' }) ?? DEFAULT_NUMBER_FORMAT;

  const unitOptions = useMemo(
    () =>
      format.output ? (UNIT_OPTIONS_BY_OUTPUT[format.output] ?? null) : null,
    [format.output],
  );

  const translatedUnitOptions = useMemo(
    () =>
      unitOptions?.map(option => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [unitOptions, t],
  );

  const translatedOutputOptions = useMemo(
    () =>
      OUTPUT_CATEGORY_OPTIONS.map(group => ({
        group: t(group.groupKey),
        items: group.items.map(item => ({
          value: item.value,
          label: t(item.labelKey),
        })),
      })),
    [t],
  );

  return (
    <>
      <Stack style={{ flex: 1 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            alignItems: 'stretch',
            justifyContent: 'stretch',
            gap: 10,
          }}
        >
          <Controller
            control={control}
            key="numberFormat.output"
            name="numberFormat.output"
            render={({ field: { onChange, ...field } }) => (
              <NativeSelect
                {...field}
                label={t('outputFormat')}
                leftSection={format.output && FORMAT_ICONS[format.output]}
                style={{ flex: 1 }}
                data={translatedOutputOptions}
                onChange={e => {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                  const newOutput = e.target.value as NumberFormat['output'];
                  onChange(newOutput);
                  setValue(
                    'numberFormat.numericUnit',
                    DEFAULT_NUMERIC_UNIT_BY_OUTPUT[newOutput] ?? undefined,
                  );
                }}
              />
            )}
          />
          {format.output === 'currency' && (
            <Controller
              control={control}
              key="numberFormat.currencySymbol"
              name="numberFormat.currencySymbol"
              render={({ field }) => (
                <TextInput
                  {...field}
                  w={80}
                  label={t('symbol')}
                  placeholder="$"
                />
              )}
            />
          )}
        </div>

        {unitOptions && (
          <Controller
            control={control}
            key="numberFormat.numericUnit"
            name="numberFormat.numericUnit"
            render={({ field: { value, onChange, ...field } }) => (
              <NativeSelect
                {...field}
                label={t('unit')}
                value={
                  value ?? DEFAULT_NUMERIC_UNIT_BY_OUTPUT[format.output ?? '']
                }
                onChange={e => onChange(e.target.value)}
                data={translatedUnitOptions}
              />
            )}
          />
        )}

        <div style={{ marginTop: -6 }}>
          <Paper p="xs" py={4}>
            <div
              style={{
                fontSize: 11,
              }}
            >
              {t('example')}
            </div>
            {formatNumber(TEST_NUMBER || 0, {
              ...format,
              numericUnit:
                format.numericUnit ??
                (format.output
                  ? DEFAULT_NUMERIC_UNIT_BY_OUTPUT[format.output]
                  : undefined),
            })}
          </Paper>
        </div>

        {format.output !== 'time' && format.output !== 'duration' && (
          <div>
            <div className="fs-8 mt-2 fw-bold mb-1">{t('decimals')}</div>
            <Controller
              control={control}
              key="numberFormat.mantissa"
              name="numberFormat.mantissa"
              render={({ field: { value, onChange } }) => (
                <Slider
                  mb="xl"
                  min={0}
                  max={10}
                  label={val => t('decimalsValue', { value: val })}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 10, label: '10' },
                  ]}
                  value={value ?? 2}
                  onChange={onChange}
                />
              )}
            />
          </div>
        )}

        <Stack gap="xs">
          {format.output === 'byte' && !format.numericUnit ? (
            <Controller
              control={control}
              key="numberFormat.decimalBytes"
              name="numberFormat.decimalBytes"
              render={({ field: { value, onChange, ...field } }) => {
                return (
                  <MCheckbox
                    {...field}
                    size="xs"
                    label={t('decimalBase')}
                    description={t('decimalBaseDescription')}
                    checked={value}
                    onChange={onChange}
                  />
                );
              }}
            />
          ) : format.output === 'time' || format.output === 'duration' ? (
            <Controller
              control={control}
              key="numberFormat.factor"
              name="numberFormat.factor"
              render={({ field: { value, onChange, ...field } }) => {
                const options = [
                  { value: '1', label: t('seconds') },
                  { value: '0.001', label: t('milliseconds') },
                  { value: '0.000001', label: t('microseconds') },
                  { value: '0.000000001', label: t('nanoseconds') },
                ];

                const stringValue =
                  options.find(option => parseFloat(option.value) === value)
                    ?.value ?? '1';

                return (
                  <NativeSelect
                    {...field}
                    size="sm"
                    label={t('inputUnit')}
                    value={stringValue}
                    onChange={e => onChange(parseFloat(e.target.value))}
                    data={options}
                  />
                );
              }}
            />
          ) : !hasNumericUnit(format.output ?? '') ? (
            <>
              <Controller
                control={control}
                key="numberFormat.thousandSeparated"
                name="numberFormat.thousandSeparated"
                render={({ field: { value, onChange, ...field } }) => (
                  <MCheckbox
                    {...field}
                    size="xs"
                    label={t('separateThousands')}
                    description={t('separateThousandsDescription')}
                    checked={value}
                    onChange={onChange}
                  />
                )}
              />
              <Controller
                control={control}
                key="numberFormat.average"
                name="numberFormat.average"
                render={({ field: { value, onChange, ...field } }) => (
                  <MCheckbox
                    {...field}
                    size="xs"
                    label={t('largeNumberFormat')}
                    description={t('largeNumberFormatDescription')}
                    checked={value}
                    onChange={onChange}
                  />
                )}
              />
            </>
          ) : null}
        </Stack>
        {disclaimer}
      </Stack>
    </>
  );
};
