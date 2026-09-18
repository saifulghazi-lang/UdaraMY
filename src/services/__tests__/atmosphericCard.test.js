import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('AtmosphericCard.vue Phase 2 De-cluttering', () => {
  const cardPath = resolve('src/components/AtmosphericCard.vue');
  const content = readFileSync(cardPath, 'utf8');

  it('must not contain floating confetti particles or animated particle classes', () => {
    assert.doesNotMatch(content, /animate-particle/, 'animate-particle class must be removed');
    assert.doesNotMatch(content, /particles\s*=\s*computed/, 'particles computation must be removed');
  });

  it('must not contain fuzzy gradient background glow blobs', () => {
    assert.doesNotMatch(content, /ambientGlowClass/, 'ambientGlowClass must be removed');
  });

  it('must render tabular bold AQI numeral with clean status badge and key pollutants', () => {
    assert.match(content, /tabular-nums/, 'AQI numeral should use tabular-nums');
    assert.match(content, /station\.pollutants/, 'Primary pollutants should be directly accessible');
  });

  it('must explicitly label Hero Gauge as Health Indicator and separate Statutory / KPM Benchmark', () => {
    assert.match(content, /predictive\.healthIndicator/, 'Hero Gauge must have explicit Health Indicator semantic label');
    assert.match(content, /predictive\.officialStatusTitle/, 'Official APIMS must have isolated Statutory / KPM Benchmark label');
  });

  it('must use v-if (not v-show) for progressive disclosure of forecast and pollutants', () => {
    assert.match(content, /v-if="isForecastOpen"/, 'Progressive disclosure must use v-if to optimize INP and initial DOM mounting');
    assert.doesNotMatch(content, /v-show="isForecastOpen"/, 'Progressive disclosure must not use v-show');
  });

  it('must include 3-Hour Velocity Pill with direction indicators', () => {
    assert.match(content, /velocityText/, 'Must render velocityText');
    assert.match(content, /velocityIcon/, 'Must render velocityIcon');
  });
});
