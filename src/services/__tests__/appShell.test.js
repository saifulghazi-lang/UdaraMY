import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('App.vue Phase 1 Shell & Header Architecture', () => {
  const appPath = resolve('src/App.vue');
  const content = readFileSync(appPath, 'utf8');

  it('must not contain WIP splash elements or state', () => {
    assert.doesNotMatch(content, /showWipSplash/, 'showWipSplash variable must not exist');
    assert.doesNotMatch(content, /UNDER CONSTRUCTION/, 'Construction banner must not exist');
    assert.doesNotMatch(content, /wip-tape/, 'wip-tape animation must not exist');
  });

  it('must not import deleted components', () => {
    assert.doesNotMatch(content, /NewsBroadcastCarousel/, 'NewsBroadcastCarousel must not be imported');
    assert.doesNotMatch(content, /CivicActionBadge/, 'CivicActionBadge must not be imported');
    assert.doesNotMatch(content, /StateLeaderboardModal/, 'StateLeaderboardModal must not be imported');
  });

  it('must have clean header without overflow dropdown clutter', () => {
    assert.doesNotMatch(content, /isOverflowMenuOpen/, 'isOverflowMenuOpen must be eliminated');
    assert.doesNotMatch(content, /MoreHorizontal/, 'MoreHorizontal icon must not be in header');
  });

  it('must preserve direct access to Settings, Theme, and Station selector', () => {
    assert.match(content, /isSettingsModalOpen = true/, 'Settings modal trigger must exist');
    assert.match(content, /toggleTheme/, 'Theme toggle must exist');
    assert.match(content, /isStationModalOpen = true/, 'Station selector modal trigger must exist');
  });
});
