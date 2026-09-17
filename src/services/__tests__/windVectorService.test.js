import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  interpolateWindVector,
  calculatePlumeThreat,
  getClimatologicalWindGrid
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

  it('should fallback gracefully when grid is missing or empty', () => {
    const fallbackGrid = getClimatologicalWindGrid();
    assert.equal(fallbackGrid.length, 6);
    const res = interpolateWindVector(3.14, 101.69, []);
    assert.ok(typeof res.speedKm === 'number');
    assert.ok(!isNaN(res.speedKm));
  });
});
