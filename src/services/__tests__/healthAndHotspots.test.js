import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Feature 4: Health Advice & Hotspot Widget Streamlining', () => {
  const healthPath = resolve('src/components/HealthAdvicePanel.vue');
  const healthContent = readFileSync(healthPath, 'utf8');

  const hotspotPath = resolve('src/components/HazeHotspotWidget.vue');
  const hotspotContent = readFileSync(hotspotPath, 'utf8');

  it('HealthAdvicePanel must keep header school alert and persona selector but remove duplicate school card in grid', () => {
    assert.match(healthContent, /isSchoolClosureTriggered/, 'must retain header school closure alert check');
    assert.match(healthContent, /personas/, 'must retain persona list');
    assert.doesNotMatch(healthContent, /t\('guidance\.schoolStatus'\)/, 'must remove duplicate school status card from grid');
  });

  it('HazeHotspotWidget must delete the 130-line educational guide modal and its trigger button', () => {
    assert.doesNotMatch(hotspotContent, /isGuideModalOpen/, 'must remove isGuideModalOpen state');
    assert.doesNotMatch(hotspotContent, /Teleport/, 'must remove Teleport modal container');
    assert.doesNotMatch(hotspotContent, /whatIsAsmc/, 'must remove static textbook definitions');
  });

  it('HazeHotspotWidget must retain live wind and trajectory indicators', () => {
    assert.match(hotspotContent, /windDirection/, 'must retain wind direction metric');
    assert.match(hotspotContent, /trendAnalysis/, 'must retain trend analysis');
  });
});
