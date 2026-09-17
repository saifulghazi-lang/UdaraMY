import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  interpolateWindVector,
  calculatePlumeThreat,
  getClimatologicalWindGrid,
  fetchRegionalWindGrid
} from '../windVectorService.js';

describe('windVectorService', () => {
  it('should interpolate vector at exact node coordinates', () => {
    const grid = [
      { lat: 3.0, lng: 101.0, u: 10, v: 5, speedKm: 11.2, deg: 243 },
      { lat: 4.0, lng: 102.0, u: 20, v: 10, speedKm: 22.4, deg: 243 }
    ];
    const res = interpolateWindVector(3.0, 101.0, grid);
    assert.ok(Math.abs(res.u - 10) < 0.5);
    assert.ok(Math.abs(res.v - 5) < 0.5);
    assert.ok(typeof res.speedKm === 'number');
    assert.equal(res.deg, 243);
  });

  it('should interpolate intermediate coordinates with continuous origin direction', () => {
    // Intermediate point between Northern Straits (deg: 210) and Central Straits (deg: 200)
    const res = interpolateWindVector(3.05, 100.25);
    assert.ok(typeof res.speedKm === 'number');
    // Ensure meteorological origin angle is continuous (~200°–210°) and NOT inverted downwind (20°–30°)
    assert.ok(res.deg >= 195 && res.deg <= 215, `Expected continuous deg around ~205, received: ${res.deg}`);
  });

  it('should compute threat cone and ETA for Sumatra fire cluster', () => {
    const origin = { lat: 0.5, lng: 101.5, name: 'Sumatra' };
    const hotspotCount = 180;
    const windVector = { u: 12, v: 16, speedKm: 20, deg: 216 }; // South-Southwest blowing Northeast
    const threat = calculatePlumeThreat(origin, hotspotCount, windVector);

    assert.equal(threat.threatLevel, 'severe');
    assert.ok(threat.etaHours > 0 && threat.etaHours <= 24);
    assert.ok(threat.label.includes('Sumatra'));
  });

  it('should integrate interpolateWindVector directly into calculatePlumeThreat with severe threat', () => {
    const origin = { lat: 0.5, lng: 101.5, name: 'Sumatra' };
    const interpolatedVector = interpolateWindVector(origin.lat, origin.lng);
    const threat = calculatePlumeThreat(origin, 150, interpolatedVector);

    assert.equal(threat.threatLevel, 'severe');
    assert.equal(threat.isPointingAtMalaysia, true);
    assert.ok(threat.headingDeg >= 15 && threat.headingDeg <= 110);
  });

  it('should fallback gracefully when grid is missing or empty', () => {
    const fallbackGrid = getClimatologicalWindGrid();
    assert.equal(fallbackGrid.length, 6);
    const res = interpolateWindVector(3.14, 101.69, []);
    assert.ok(typeof res.speedKm === 'number');
    assert.ok(!isNaN(res.speedKm));
  });

  it('should fallback to climatological baseline when network fetch fails', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => {
        throw new Error('Simulated network error');
      };
      const grid = await fetchRegionalWindGrid();
      assert.equal(grid.length, 6);
      assert.equal(grid[0].id, 'north_straits');
      assert.equal(grid[0].deg, 210);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should preserve 0 values for calm wind and due north direction in fetchRegionalWindGrid', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => ({
        ok: true,
        json: async () => [
          { current: { wind_speed_10m: 0, wind_direction_10m: 0 } },
          { current: { wind_speed_10m: 5, wind_direction_10m: 90 } }
        ]
      });
      const grid = await fetchRegionalWindGrid();
      assert.equal(grid[0].speedKm, 0);
      assert.equal(grid[0].deg, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
