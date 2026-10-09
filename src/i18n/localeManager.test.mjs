import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { catalogs, createLocaleManager } from './index.js';
import { LOCALE_STORAGE_KEY } from './localeManager.js';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test('all shipped catalogs have matching keys and interpolation placeholders', () => {
  const [baseLocale, baseCatalog] = Object.entries(catalogs)[0];
  const keys = Object.keys(baseCatalog).sort();
  const placeholders = (message) => [...message.matchAll(/\{([\w.-]+)\}/g)]
    .map((match) => match[1])
    .sort();

  for (const [locale, catalog] of Object.entries(catalogs)) {
    const source = readFileSync(
      new URL(`./catalogs/${locale}.json`, import.meta.url),
      'utf8',
    );
    const sourceKeys = [...source.matchAll(/^\s*"([^\"]+)"\s*:/gm)].map(
      (match) => match[1],
    );
    assert.equal(new Set(sourceKeys).size, sourceKeys.length, `${locale} duplicate keys`);
    assert.deepEqual(Object.keys(catalog).sort(), keys, `${locale} keys`);
    for (const key of keys) {
      assert.deepEqual(
        placeholders(catalog[key]),
        placeholders(baseCatalog[key]),
        `${locale}.${key} placeholders (base ${baseLocale})`,
      );
    }
  }
});

test('browser locale is detected when no stored preference is available', () => {
  const storage = {
    getItem() {
      throw new Error('storage blocked');
    },
    setItem() {
      throw new Error('storage blocked');
    },
  };
  const manager = createLocaleManager({
    catalogs,
    storage,
    languages: ['fr-FR', 'pt-BR'],
  });

  assert.equal(manager.getLocale(), 'pt-BR');
  assert.equal(manager.setLocale('es'), true);
  assert.equal(manager.getLocale(), 'es');
});

test('locale selection prefers stored choice, detects browser locale, and updates lang', () => {
  const storage = createStorage({ [LOCALE_STORAGE_KEY]: 'es-MX' });
  const document = {
    documentElement: {
      setAttribute: (key, value) => (document.lang = value),
    },
  };
  const manager = createLocaleManager({
    catalogs,
    storage,
    languages: ['pt-BR'],
    document,
  });

  assert.equal(manager.getLocale(), 'es');
  assert.equal(document.lang, 'es');
  assert.equal(manager.setLocale('zh-CN'), true);
  assert.equal(storage.getItem(LOCALE_STORAGE_KEY), 'zh-CN');
  assert.equal(document.lang, 'zh-CN');
});

test('unsupported browser languages fall back to English without exposing missing keys', () => {
  const manager = createLocaleManager({
    catalogs,
    storage: null,
    languages: ['fr-FR'],
  });
  assert.equal(manager.getLocale(), 'en');
  assert.equal(manager.t('status.loading'), 'Loading...');
  assert.equal(manager.t('missing.translation'), '');
});

test('locale changes notify current listeners once and unsubscribe cleanly', () => {
  const manager = createLocaleManager({
    catalogs,
    storage: null,
    initialLocale: 'en',
  });
  const snapshots = [];
  const unsubscribe = manager.subscribe((snapshot) =>
    snapshots.push(snapshot.locale),
  );

  assert.equal(manager.setLocale('pt-BR'), true);
  assert.equal(manager.setLocale('pt-BR'), false);
  unsubscribe();
  assert.equal(manager.setLocale('es'), true);
  assert.deepEqual(snapshots, ['pt-BR']);
});

test('formatters follow the currently selected locale without changing numeric values', async () => {
  const { createFormatter } = await import('./formatter.js');
  let locale = 'en';
  const formatter = createFormatter(() => locale);
  const english = formatter.number(1234.5);
  locale = 'pt-BR';
  const portuguese = formatter.number(1234.5);

  assert.notEqual(portuguese, english);
  assert.equal(formatter.plural(2), 'other');
  assert.equal(formatter.relativeTime(-1, 'day'), 'há 1 dia');
});