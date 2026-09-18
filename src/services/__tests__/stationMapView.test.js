import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Feature 3: StationMapView.vue Simplification & Optimization', () => {
  const mapPath = resolve('src/components/StationMapView.vue');
  const content = readFileSync(mapPath, 'utf8');

  it('must remove redundant isFilterDrawerOpen and nested filter drawer', () => {
    assert.doesNotMatch(content, /isFilterDrawerOpen/, 'isFilterDrawerOpen must be removed');
    assert.doesNotMatch(content, /getDrawerButtonClass/, 'getDrawerButtonClass must be removed');
  });

  it('must remove redundant mapViewMode switcher (both/heatmap/pins)', () => {
    assert.doesNotMatch(content, /mapViewMode/, 'mapViewMode must be removed');
    assert.doesNotMatch(content, /setViewMode/, 'setViewMode must be removed');
  });

  it('must provide direct consolidated network and region controls in top bar', () => {
    assert.match(content, /networkFilter/, 'must maintain networkFilter');
    assert.match(content, /currentFilter/, 'must maintain currentFilter for regions');
    assert.match(content, /zoomToRegion/, 'must maintain zoomToRegion helper');
  });

  it('must contain streamlined compact popup with view full dashboard action', () => {
    assert.match(content, /ud-popup/, 'must contain popup container');
    assert.match(content, /btn-dash-/, 'must contain open dashboard action');
    assert.match(content, /btn-pin-/, 'must contain pin toggle action');
  });
});
