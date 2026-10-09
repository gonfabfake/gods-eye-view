import test from 'node:test';
import assert from 'node:assert/strict';
import { bindLanguageSelector } from './languageSelector.js';
import { catalogs, createLocaleManager } from './index.js';

function createSelect() {
  const listeners = new Map();
  return {
    value: '',
    attributes: {},
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: (type, listener) => {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    dispatchChange() {
      listeners.get('change')?.();
    },
    listenerCount: () => listeners.size,
  };
}

test('language selector changes the active locale without recreating the manager', () => {
  const manager = createLocaleManager({
    catalogs,
    storage: null,
    initialLocale: 'en',
  });
  const select = createSelect();
  const label = { textContent: '' };
  const dispose = bindLanguageSelector({ manager, select, label });
  const originalManager = manager;

  assert.equal(select.value, 'en');
  select.value = 'pt-BR';
  select.dispatchChange();

  assert.equal(manager, originalManager);
  assert.equal(manager.getLocale(), 'pt-BR');
  assert.equal(select.value, 'pt-BR');
  assert.equal(label.textContent, 'Idioma');
  assert.equal(select.attributes['aria-label'], 'Idioma');
  dispose();
  assert.equal(select.listenerCount(), 0);
});