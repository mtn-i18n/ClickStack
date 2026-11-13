#!/usr/bin/env node
/**
 * Fails when locale resources drift: missing keys, empty strings, or
 * placeholder mismatches between the default locale and English.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'public', 'locales');
const DEFAULT_LOCALE = 'zh-CN';
const FALLBACK_LOCALE = 'en';

const flatten = (value, prefix = '', out = {}) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, out);
    }
  } else {
    out[prefix] = value;
  }
  return out;
};

const placeholders = value =>
  [...String(value).matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)]
    .map(match => match[1])
    .sort();

const readLocale = locale => {
  const dir = path.join(LOCALES_DIR, locale);
  const files = fs.readdirSync(dir).filter(file => file.endsWith('.json'));
  const resources = {};
  for (const file of files) {
    const ns = path.basename(file, '.json');
    resources[ns] = flatten(
      JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')),
      '',
      {},
    );
  }
  return resources;
};

const defaultResources = readLocale(DEFAULT_LOCALE);
const fallbackResources = readLocale(FALLBACK_LOCALE);
const errors = [];

const namespaces = new Set([
  ...Object.keys(defaultResources),
  ...Object.keys(fallbackResources),
]);

for (const ns of namespaces) {
  const defaultNs = defaultResources[ns] ?? {};
  const fallbackNs = fallbackResources[ns] ?? {};

  for (const key of Object.keys(fallbackNs)) {
    if (!(key in defaultNs)) {
      errors.push(`${ns}: missing ${DEFAULT_LOCALE} key "${key}"`);
      continue;
    }
    if (typeof defaultNs[key] !== 'string' || defaultNs[key].trim() === '') {
      errors.push(`${ns}: empty ${DEFAULT_LOCALE} value for "${key}"`);
    }
    const expected = placeholders(fallbackNs[key]).join(',');
    const actual = placeholders(defaultNs[key]).join(',');
    if (expected !== actual) {
      errors.push(
        `${ns}: placeholder mismatch for "${key}" (${FALLBACK_LOCALE}: ${expected || 'none'}, ${DEFAULT_LOCALE}: ${actual || 'none'})`,
      );
    }
  }

  for (const key of Object.keys(defaultNs)) {
    if (!(key in fallbackNs)) {
      errors.push(`${ns}: missing ${FALLBACK_LOCALE} key "${key}"`);
    }
  }
}

if (errors.length > 0) {
  console.error(`i18n check failed with ${errors.length} issue(s):`);
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(
  `i18n check passed: ${namespaces.size} namespaces, ${DEFAULT_LOCALE} and ${FALLBACK_LOCALE} in sync.`,
);