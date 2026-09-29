import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import App from './App.vue';

import './assets/main.css';

import en from './locales/en.json';
import ms from './locales/ms.json';

const savedLocale = typeof localStorage !== 'undefined' ? (localStorage.getItem('udaramy_locale') || 'ms') : 'ms';

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    ms
  }
});

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(i18n);

app.mount('#app');
