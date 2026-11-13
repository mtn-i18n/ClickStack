// Pages Router i18n configuration.
//
// There is deliberately no `i18n` section in next.config.mjs: the app can be
// built with `output: 'export'`, and Next.js locale routing is incompatible
// with static export. Locale is a client-side preference instead. See
// agent_docs/i18n.md.
//
// Resources are bundled rather than fetched so the static export (and
// deployments under a basePath) need no asset path handling.

const NAMESPACES = [
  'common',
  'nav',
  'auth',
  'preferences',
  'search',
  'dashboards',
  'alerts',
  'sessions',
  'services',
  'k8s',
  'settings',
  'charts',
  'llm',
  'errors',
];

// E2E builds override this to `en` so the suite keeps its English selectors
// deterministic; every other build defaults to Simplified Chinese.
const DEFAULT_LOCALE =
  process.env.NEXT_PUBLIC_DEFAULT_LOCALE === 'en' ? 'en' : 'zh-CN';
const LOCALES = ['zh-CN', 'en'];

/** @type {{ zhCN: Record<string, object>, en: Record<string, object> }} */
const resources = {
  'zh-CN': {
    common: require('./public/locales/zh-CN/common.json'),
    nav: require('./public/locales/zh-CN/nav.json'),
    auth: require('./public/locales/zh-CN/auth.json'),
    preferences: require('./public/locales/zh-CN/preferences.json'),
    search: require('./public/locales/zh-CN/search.json'),
    dashboards: require('./public/locales/zh-CN/dashboards.json'),
    alerts: require('./public/locales/zh-CN/alerts.json'),
    sessions: require('./public/locales/zh-CN/sessions.json'),
    services: require('./public/locales/zh-CN/services.json'),
    k8s: require('./public/locales/zh-CN/k8s.json'),
    settings: require('./public/locales/zh-CN/settings.json'),
    charts: require('./public/locales/zh-CN/charts.json'),
    llm: require('./public/locales/zh-CN/llm.json'),
    errors: require('./public/locales/zh-CN/errors.json'),
  },
  en: {
    common: require('./public/locales/en/common.json'),
    nav: require('./public/locales/en/nav.json'),
    auth: require('./public/locales/en/auth.json'),
    preferences: require('./public/locales/en/preferences.json'),
    search: require('./public/locales/en/search.json'),
    dashboards: require('./public/locales/en/dashboards.json'),
    alerts: require('./public/locales/en/alerts.json'),
    sessions: require('./public/locales/en/sessions.json'),
    services: require('./public/locales/en/services.json'),
    k8s: require('./public/locales/en/k8s.json'),
    settings: require('./public/locales/en/settings.json'),
    charts: require('./public/locales/en/charts.json'),
    llm: require('./public/locales/en/llm.json'),
    errors: require('./public/locales/en/errors.json'),
  },
};

/** @type {import('next-i18next/pages').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    locales: LOCALES,
  },
  defaultNS: 'common',
  ns: NAMESPACES,
  resources,
  fallbackLng: 'en',
  supportedLngs: LOCALES,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
};