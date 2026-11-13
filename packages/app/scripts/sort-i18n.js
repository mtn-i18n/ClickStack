#!/usr/bin/env node
/** Sorts every locale namespace deterministically so key additions diff cleanly. */
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.resolve(__dirname, '..', 'public', 'locales');

const sortDeep = value => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort((a, b) => a.localeCompare(b))
        .map(key => [key, sortDeep(value[key])]),
    );
  }
  return value;
};

for (const locale of fs.readdirSync(LOCALES_DIR)) {
  const dir = path.join(LOCALES_DIR, locale);
  if (!fs.statSync(dir).isDirectory()) {
    continue;
  }
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.json')) {
      continue;
    }
    const filePath = path.join(dir, file);
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    fs.writeFileSync(filePath, `${JSON.stringify(sortDeep(json), null, 2)}\n`);
  }
}