import * as React from 'react';
import { useTranslation } from 'next-i18next/pages';

import { DEFAULT_LOCALE, getSavedLocale, normalizeLocale } from './useLocale';

/**
 * Applies the stored locale after hydration.
 *
 * The static HTML is always rendered in the default locale, so this is the
 * point where a saved English preference takes effect. Keeping it in an effect
 * (and not in the config) avoids reading browser storage during SSR.
 */
export const LocaleInitializer = () => {
  const { i18n } = useTranslation();

  React.useEffect(() => {
    const locale = getSavedLocale() ?? DEFAULT_LOCALE;
    const current = normalizeLocale(i18n.resolvedLanguage ?? i18n.language);

    if (current !== locale) {
      void i18n.changeLanguage(locale);
    }
    document.documentElement.lang = locale;

    const onLanguageChanged = (next: string) => {
      document.documentElement.lang = normalizeLocale(next);
    };
    i18n.on('languageChanged', onLanguageChanged);

    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, [i18n]);

  return null;
};
