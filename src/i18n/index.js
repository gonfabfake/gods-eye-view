import en from './catalogs/en.json' with { type: 'json' };
import ptBR from './catalogs/pt-BR.json' with { type: 'json' };
import es from './catalogs/es.json' with { type: 'json' };
import zhCN from './catalogs/zh-CN.json' with { type: 'json' };
import { createLocaleManager } from './localeManager.js';

export const catalogs = Object.freeze({
  en,
  'pt-BR': ptBR,
  es,
  'zh-CN': zhCN,
});

export const localeManager = createLocaleManager({ catalogs });
export { createLocaleManager, normalizeLocale } from './localeManager.js';
export { createFormatter } from './formatter.js';
