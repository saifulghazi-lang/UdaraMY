import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Network, Proxy, and CORS Bug Reproduction', () => {
  const communityPath = resolve('src/services/communityService.js');
  const communityContent = readFileSync(communityPath, 'utf8');

  const forecastPath = resolve('src/services/airQualityForecastService.js');
  const forecastContent = readFileSync(forecastPath, 'utf8');

  const vitePath = resolve('vite.config.js');
  const viteContent = readFileSync(vitePath, 'utf8');

  it('Bug 1 (OpenAQ CORS Failure): communityService must not make direct cross-origin fetches to https://api.openaq.org', () => {
    // Direct requests to api.openaq.org with X-API-Key/User-Agent headers trigger CORS preflight OPTIONS failure
    // because OpenAQ does not allow localhost:5173 origins with custom headers.
    assert.doesNotMatch(
      communityContent,
      /https:\/\/api\.openaq\.org\/v3/,
      'communityService must not make direct cross-origin fetches to https://api.openaq.org (triggers CORS preflight failure in browser)'
    );
  });

  it('Bug 2 (Open-Meteo Connection Timed Out): airQualityForecastService must route through /open-meteo proxy and use AbortSignal.timeout', () => {
    // Direct unproxied calls to air-quality-api.open-meteo.com time out in corporate/restricted firewalls
    assert.match(
      forecastContent,
      /\/open-meteo/,
      'airQualityForecastService must route through local /open-meteo proxy rather than direct external origin'
    );
    assert.match(
      forecastContent,
      /AbortSignal\.timeout/,
      'airQualityForecastService must pass AbortSignal.timeout to guard against ERR_CONNECTION_TIMED_OUT'
    );
  });

  it('Bug 3 (Missing Vite Proxy): vite.config.js must configure /open-meteo reverse proxy', () => {
    // Both server.proxy and preview.proxy need /open-meteo forwarding to air-quality-api.open-meteo.com
    assert.match(
      viteContent,
      /['"]\/open-meteo['"]/,
      'vite.config.js is missing /open-meteo proxy entry'
    );
    assert.match(
      viteContent,
      /https:\/\/air-quality-api\.open-meteo\.com/,
      'vite.config.js is missing target https://air-quality-api.open-meteo.com'
    );
  });

  it('Bug 4 (i18n Missing Key): en.json must define settings.notificationDesc', () => {
    const enLocalePath = resolve('src/locales/en.json');
    const enLocale = JSON.parse(readFileSync(enLocalePath, 'utf8'));
    assert.ok(
      enLocale.settings?.notificationDesc,
      'settings.notificationDesc is missing in en.json locale messages'
    );
  });

  it('Bug 5 (Vite Proxy Corporate SSL): vite.config.js /open-meteo must use secure: false for corporate SSL proxy compatibility', () => {
    assert.doesNotMatch(
      viteContent,
      /'\/open-meteo':\s*\{[^}]+secure:\s*true/s,
      'vite.config.js /open-meteo proxy should use secure: false for corporate proxy compatibility'
    );
  });
});
