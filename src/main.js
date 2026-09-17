import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import App from './App.vue';

import './assets/main.css';

import en from './locales/en.json';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en
  }
});

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(i18n);

app.mount('#app');
