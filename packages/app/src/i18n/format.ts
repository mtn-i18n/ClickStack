import * as React from 'react';

import { useLocale } from './useLocale';

export function useFormatNumber() {
  const { locale } = useLocale();

  return React.useCallback(
    (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(locale, options).format(value),
    [locale],
  );
}

export function useNumberFormat(options?: Intl.NumberFormatOptions) {
  const { locale } = useLocale();
  return React.useMemo(
    () => new Intl.NumberFormat(locale, options),
    [locale, options],
  );
}
