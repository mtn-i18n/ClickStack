import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { act, renderHook } from '@testing-library/react';

import testI18n from '@/i18n/test-i18n';
import { normalizeLocale, useLocale } from '@/i18n/useLocale';

const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
);

describe('normalizeLocale', () => {
  it('maps Chinese variants to zh-CN', () => {
    expect(normalizeLocale('zh')).toBe('zh-CN');
    expect(normalizeLocale('zh-Hans')).toBe('zh-CN');
    expect(normalizeLocale('zh-TW')).toBe('zh-CN');
  });

  it('maps English variants to en', () => {
    expect(normalizeLocale('en')).toBe('en');
    expect(normalizeLocale('en-US')).toBe('en');
  });

  it('falls back to the default locale', () => {
    expect(normalizeLocale()).toBe('zh-CN');
    expect(normalizeLocale('fr')).toBe('zh-CN');
  });
});

describe('useLocale', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await testI18n.changeLanguage('en');
  });

  it('persists the selected locale and changes the i18n language', async () => {
    const { result } = renderHook(() => useLocale(), { wrapper });

    await act(async () => {
      result.current.setLocale('zh-CN');
    });

    expect(window.localStorage.getItem('hdx-locale')).toBe('zh-CN');
    expect(testI18n.language).toBe('zh-CN');
  });
});
