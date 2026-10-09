export function bindLanguageSelector({ manager, select, label } = {}) {
  if (!manager || !select) return () => {};

  const sync = ({ locale } = manager.getSnapshot()) => {
    select.value = locale;
    const text = manager.t('language.label');
    if (label) label.textContent = text;
    select.setAttribute('aria-label', text);
  };
  const onChange = () => manager.setLocale(select.value);

  select.addEventListener('change', onChange);
  const unsubscribe = manager.subscribe(sync);
  sync();

  return () => {
    select.removeEventListener('change', onChange);
    unsubscribe();
  };
}
