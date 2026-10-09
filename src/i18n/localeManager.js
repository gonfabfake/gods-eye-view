export const DEFAULT_LOCALE = 'en';
export const SUPPORTED_LOCALES = Object.freeze(['en', 'pt-BR', 'es', 'zh-CN']);
export const LOCALE_STORAGE_KEY = 'gev:locale:v1';

const localeByLanguage = new Map([
  ['en', 'en'],
  ['pt', 'pt-BR'],
  ['es', 'es'],
  ['zh', 'zh-CN'],
]);

export function normalizeLocale(value) {
  if (typeof value !== 'string') return null;
  try {
    const [locale] = Intl.getCanonicalLocales(value.trim());
    if (!locale) return null;
    return localeByLanguage.get(locale.split('-')[0].toLowerCase()) || null;
  } catch {
    return null;
  }
}

function readStoredLocale(storage) {
  try {
    return normalizeLocale(storage?.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return null;
  }
}

function getDefaultStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function detectBrowserLocale(languages) {
  for (const language of languages || []) {
    const locale = normalizeLocale(language);
    if (locale) return locale;
  }
  return DEFAULT_LOCALE;
}

export function createLocaleManager({
  catalogs,
  storage = getDefaultStorage(),
  languages = globalThis.navigator?.languages,
  document = globalThis.document,
  initialLocale,
} = {}) {
  if (!catalogs || !catalogs[DEFAULT_LOCALE]) {
    throw new TypeError('An English fallback catalog is required');
  }

  const listeners = new Set();
  let locale =
    normalizeLocale(initialLocale) ||
    readStoredLocale(storage) ||
    detectBrowserLocale(languages);

  const catalog = () => catalogs[locale] || catalogs[DEFAULT_LOCALE];
  const snapshot = () => Object.freeze({ locale });
  const notify = () => {
    document?.documentElement?.setAttribute('lang', locale);
    for (const listener of [...listeners]) {
      try {
        listener(snapshot());
      } catch {
        // One observer must not prevent the remaining UI from updating.
      }
    }
  };

  document?.documentElement?.setAttribute('lang', locale);

  return Object.freeze({
    getLocale: () => locale,
    getSnapshot: snapshot,
    subscribe(listener) {
      if (typeof listener !== 'function')
        throw new TypeError('Locale subscriber must be a function');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setLocale(value) {
      const next = normalizeLocale(value);
      if (!next || !catalogs[next] || next === locale) return false;
      locale = next;
      try {
        storage?.setItem(LOCALE_STORAGE_KEY, locale);
      } catch {
        // Storage can be unavailable in private or restricted contexts.
      }
      notify();
      return true;
    },
    t(key, values = {}) {
      const message = catalog()[key] ?? catalogs[DEFAULT_LOCALE][key] ?? '';
      return String(message).replace(/\{([\w.-]+)\}/g, (match, name) =>
        Object.hasOwn(values, name) ? String(values[name]) : match,
      );
    },
  });
}
