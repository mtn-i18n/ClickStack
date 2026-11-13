import React from 'react';
import { useTranslation } from 'next-i18next/pages';
import { formatDate } from '@hyperdx/common-utils/dist/core/utils';

import { useLocale } from './i18n/useLocale';
import { useDisplayTimeZone } from './useDisplayTimeZone';
import { useUserPreferences } from './useUserPreferences';

type DateLike = number | string | Date;

type DateFormat = 'normal' | 'short' | 'withMs' | 'time' | 'withYear';

const parse = (time: DateLike) => {
  if (time instanceof Date) {
    return time;
  }
  return new Date(time);
};

export const useFormatTime = () => {
  const {
    userPreferences: { timeFormat },
  } = useUserPreferences();
  const timeZone = useDisplayTimeZone();
  const { t } = useTranslation('common');
  const { locale } = useLocale();

  return React.useCallback(
    (time: DateLike, { format }: { format?: DateFormat } | undefined = {}) => {
      try {
        const date = parse(time);
        return formatDate(date, {
          clock: timeFormat,
          timeZone,
          format,
          locale,
        });
      } catch (err) {
        console.error(err, time);
        return t('unknownDate');
      }
    },
    [timeZone, timeFormat, locale, t],
  );
};

export const FormatTime = ({
  value,
  format,
}: {
  value?: DateLike;
  format?: DateFormat;
}) => {
  const formatTime = useFormatTime();

  if (!value) {
    return null;
  }

  return <>{formatTime(value, { format })}</>;
};
