import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Pillar 4: i18n Localization & Bilingual BM/EN Parity', () => {
  const enPath = path.resolve('src/locales/en.json');
  const msPath = path.resolve('src/locales/ms.json');
  const mainJsPath = path.resolve('src/main.js');
  const settingsModalPath = path.resolve('src/components/SettingsModal.vue');

  test('en.json and ms.json files must exist and be valid JSON', () => {
    assert.ok(fs.existsSync(enPath), 'src/locales/en.json must exist');
    assert.ok(fs.existsSync(msPath), 'src/locales/ms.json must exist');

    assert.doesNotThrow(() => JSON.parse(fs.readFileSync(enPath, 'utf8')), 'en.json must be valid JSON');
    assert.doesNotThrow(() => JSON.parse(fs.readFileSync(msPath, 'utf8')), 'ms.json must be valid JSON');
  });

  function getLeafKeys(obj, prefix = '') {
    let keys = [];
    for (const key of Object.keys(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        keys = keys.concat(getLeafKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
  }

  test('ms.json must provide complete key parity with en.json without missing translations', () => {
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const ms = JSON.parse(fs.readFileSync(msPath, 'utf8'));

    const enKeys = getLeafKeys(en);
    const msKeys = new Set(getLeafKeys(ms));

    const missingInMs = enKeys.filter(k => !msKeys.has(k));
    assert.deepStrictEqual(missingInMs, [], `ms.json is missing keys: ${missingInMs.join(', ')}`);
  });

  test('src/main.js must load and register both en and ms messages', () => {
    const mainContent = fs.readFileSync(mainJsPath, 'utf8');
    assert.ok(mainContent.includes("import en from './locales/en.json'"), 'main.js imports en.json');
    assert.ok(mainContent.includes("import ms from './locales/ms.json'"), 'main.js imports ms.json');
    assert.ok(mainContent.includes('messages: {'), 'main.js defines messages');
    assert.ok(mainContent.includes('ms') && mainContent.includes('en'), 'main.js registers en and ms');
  });

  test('SettingsModal.vue must support switching languages', () => {
    const modalContent = fs.readFileSync(settingsModalPath, 'utf8');
    assert.ok(modalContent.includes('setLanguage'), 'SettingsModal has setLanguage function');
    assert.ok(modalContent.includes("setLanguage('ms')"), 'SettingsModal can switch to ms');
    assert.ok(modalContent.includes("setLanguage('en')"), 'SettingsModal can switch to en');
    assert.ok(modalContent.includes('udaramy_locale'), 'SettingsModal persists locale to localStorage');
  });
});
