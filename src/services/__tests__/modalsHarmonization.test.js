import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Feature 5: Modals & Overlays Harmonization', () => {
  const stationModalPath = resolve('src/components/StationListModal.vue');
  const stationModalContent = readFileSync(stationModalPath, 'utf8');

  const settingsModalPath = resolve('src/components/SettingsModal.vue');
  const settingsModalContent = readFileSync(settingsModalPath, 'utf8');

  it('StationListModal must support light and dark theme classes', () => {
    assert.match(stationModalContent, /dark:bg-black/, 'must include dark mode background');
    assert.match(stationModalContent, /bg-white/, 'must include light mode background');
    assert.doesNotMatch(stationModalContent, /topHazeStations/, 'must remove redundant topHazeStations');
  });

  it('SettingsModal must tuck developer simulation slider into an expandable or secondary details container', () => {
    assert.match(settingsModalContent, /details/, 'simulation slider must be contained within a details element');
  });
});
