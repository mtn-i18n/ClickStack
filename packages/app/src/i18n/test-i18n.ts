import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- the config is CommonJS
const config = require('../../next-i18next.config.js');

// Tests assert the English copy, which is also the fallback locale.
export const testI18n = i18n.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: config.defaultNS,
  ns: config.ns,
  resources: { en: config.resources.en },
  interpolation: config.interpolation,
  react: { useSuspense: false },
  initAsync: false,
});

export default testI18n;
