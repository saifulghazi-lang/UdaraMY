import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Feature 1: Removal of Deep Analysis Accordion & Synthetic Calendar', () => {
  const appPath = resolve('src/App.vue');
  const appContent = readFileSync(appPath, 'utf8');

  it('App.vue must not import PollutantBars or HazeCalendarGrid', () => {
    assert.doesNotMatch(appContent, /PollutantBars/, 'PollutantBars must not be imported');
    assert.doesNotMatch(appContent, /HazeCalendarGrid/, 'HazeCalendarGrid must not be imported');
  });

  it('App.vue must not contain isDeepAnalysisOpen state or accordion toggle', () => {
    assert.doesNotMatch(appContent, /isDeepAnalysisOpen/, 'isDeepAnalysisOpen ref must be removed');
    assert.doesNotMatch(appContent, /detailedAnalysis/, 'detailedAnalysis key must not be in template');
  });

  it('Component files must be deleted from filesystem', () => {
    assert.equal(existsSync(resolve('src/components/HazeCalendarGrid.vue')), false, 'HazeCalendarGrid.vue should be deleted');
    assert.equal(existsSync(resolve('src/components/PollutantBars.vue')), false, 'PollutantBars.vue should be deleted');
  });
});
