---
'@hyperdx/app': minor
'@hyperdx/common-utils': patch
---

Add i18n to the web app with Simplified Chinese as the default locale and English as a selectable locale. Locale is stored per browser; no URL routing is added, so the static ClickStack build keeps working. `formatDate` accepts an optional locale for localized month and day names.