import * as React from 'react';
import { useTranslation } from 'next-i18next/pages';

// E2E builds set this to `en` so assertion text stays deterministic.
export const DEFAULT_LOCALE =
  process.env.NEXT_PUBLIC_DEFAULT_LOCALE === 'en' ? 'en' : 'zh-CN';

export const LOCALES = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en', label: 'English' },
] as const;

export type AppLocale = (typeof LOCALES)[number]['value'];

const STORAGE_KEY = 'hdx-locale';

export function normalizeLocale(value?: string | null): AppLocale {
  if (value && value.toLowerCase().startsWith('zh')) {
    return 'zh-CN';
  }
  if (value && value.toLowerCase().startsWith('en')) {
    return 'en';
  }
  return DEFAULT_LOCALE;
}

export function getSavedLocale(): AppLocale | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? normalizeLocale(value) : null;
  } catch {
    return null;
  }
}

export function useLocale() {
  const { i18n } = useTranslation();
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language);

  const setLocale = React.useCallback(
    (next: AppLocale) => {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // Storage can be unavailable in private windows; the in-memory
          // language change below still applies for this session.
        }
      }
      void i18n.changeLanguage(next);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = next;
      }
    },
    [i18n],
  );

  return { locale, setLocale };
}
