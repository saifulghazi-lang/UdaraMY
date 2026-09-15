import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import App from './App.vue';

import './assets/main.css';

import en from './locales/en.json';
import bm from './locales/bm.json';

const savedLang = localStorage.getItem('udaramy_lang') || 'bm';

const i18n = createI18n({
  legacy: false,
  locale: savedLang,
  fallbackLocale: 'en',
  messages: {
    en,
    bm
  }
});

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(i18n);

app.mount('#app');
