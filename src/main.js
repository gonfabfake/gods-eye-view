import { createStandaloneApplication } from './standalone/application.js';
import { describeError } from './standalone/errors.js';
import { localeManager } from './i18n/index.js';
import { bindLanguageSelector } from './i18n/languageSelector.js';

bindLanguageSelector({
  manager: localeManager,
  select: document.getElementById('language-select'),
  label: document.getElementById('language-select-label'),
});

const application = createStandaloneApplication({
  googleApiKey: import.meta.env.GOOGLE_MAPS_API_KEY,
  cesiumToken: import.meta.env.CESIUM_ION_TOKEN,
  allowQaRegistration: import.meta.env.DEV,
});

application.start().catch((error) => {
  console.error("God's Eye View initialization failed:", error);
  const loaderStatus = document.querySelector('#loading-screen .loader-status');
  loaderStatus.textContent = `Error: ${describeError(error)}`;
  loaderStatus.style.color = '#ff4444';
});

export { application };
