import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Feature 2: National Overview & Watchlist Simplification', () => {
  const nationalPath = resolve('src/components/NationalOverviewBar.vue');
  const nationalContent = readFileSync(nationalPath, 'utf8');

  it('NationalOverviewBar must not have dead leaderboard button or openLeaderboard event', () => {
    assert.doesNotMatch(nationalContent, /openLeaderboard/, 'openLeaderboard emit must be removed');
    assert.doesNotMatch(nationalContent, /viewLeaderboard/, 'Leaderboard button text must be removed');
    assert.doesNotMatch(nationalContent, /Trophy/, 'Trophy icon must be removed');
  });

  it('WatchlistEditModal must be removed and not imported in WatchlistBar', () => {
    const watchlistPath = resolve('src/components/WatchlistBar.vue');
    const watchlistContent = readFileSync(watchlistPath, 'utf8');
    assert.doesNotMatch(watchlistContent, /WatchlistEditModal/, 'WatchlistEditModal must not be imported');
    assert.doesNotMatch(watchlistContent, /showEditModal/, 'showEditModal ref must be removed');
    assert.equal(existsSync(resolve('src/components/WatchlistEditModal.vue')), false, 'WatchlistEditModal.vue must be deleted');
  });
});
