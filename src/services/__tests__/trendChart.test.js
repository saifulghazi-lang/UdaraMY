import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('TrendChart.vue Phase 3 De-cluttering', () => {
  const chartPath = resolve('src/components/TrendChart.vue');
  const content = readFileSync(chartPath, 'utf8');

  it('must render clean SVG sparkline without heavy drop-shadow filter tags', () => {
    assert.doesNotMatch(content, /lineGlowFilter/, 'Heavy filter drop-shadow must be eliminated for clean SVG rendering');
  });

  it('must support interactive scrubbing with tabular numerical feedback', () => {
    assert.match(content, /handleMouseMove/, 'Scrubber mouse handler must exist');
    assert.match(content, /tabular-nums/, 'Active point readout should use tabular-nums');
  });
});
