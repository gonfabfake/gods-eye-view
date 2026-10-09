import { DEFAULT_LOCALE, normalizeLocale } from './localeManager.js';

export function createFormatter(readLocale = () => DEFAULT_LOCALE) {
  const locale = () => normalizeLocale(readLocale()) || DEFAULT_LOCALE;
  return Object.freeze({
    number(value, options) {
      return new Intl.NumberFormat(locale(), options).format(value);
    },
    date(value, options) {
      return new Intl.DateTimeFormat(locale(), options).format(value);
    },
    relativeTime(value, unit, options) {
      return new Intl.RelativeTimeFormat(locale(), options).format(value, unit);
    },
    plural(value, options) {
      return new Intl.PluralRules(locale(), options).select(value);
    },
  });
}
