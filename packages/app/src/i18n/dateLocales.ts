import type { Locale } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';

/** Maps an app locale to the date-fns locale used for display text. */
export const dateFnsLocale = (locale?: string): Locale => {
  return locale?.toLowerCase().startsWith('zh') ? zhCN : enUS;
};

export const isChineseLocale = (locale?: string): boolean =>
  !!locale && locale.toLowerCase().startsWith('zh');
