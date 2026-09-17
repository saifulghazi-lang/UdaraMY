import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNowCast,
  applyKalmanFilter1D,
  calculateHourlyVelocity,
  generate6HourProjection
} from '../mathematicsService.js';

describe('mathematicsService', () => {
  describe('calculateNowCast', () => {
    it('should clamp weight factor omega to 0.5 during extreme rapid haze spikes', () => {
      // Recent spike: 180 (latest), 160, 140, then historical low of 40
      const spikeSeries = [180, 160, 140, 90, 60, 50, 45, 40, 40, 40, 40, 40];
      const result = calculateNowCast(spikeSeries);

      // sqrt(40 / 180) = 0.471 -> clamped to minimum 0.5
      assert.equal(result.weightFactor, 0.5);
      // NowCast should heavily weight the first 3 hours (> 70% weight), so index should be > 130
      assert.ok(result.nowCastApi > 130, `Expected NowCast > 130, got ${result.nowCastApi}`);
      assert.ok(result.nowCastApi < 180);
      assert.ok(result.lagReductionHours >= 4, 'Expected lag reduction of at least 4 hours');
    });

    it('should calculate near-unity weight factor during stable atmospheric conditions', () => {
      // Stable air: readings hovering closely around 40
      const stableSeries = [40, 41, 39, 40, 40, 42, 38, 40, 41, 40, 39, 40];
      const result = calculateNowCast(stableSeries);

      // sqrt(38 / 42) = 0.951
      assert.ok(result.weightFactor > 0.9, `Expected weightFactor > 0.9, got ${result.weightFactor}`);
      assert.ok(Math.abs(result.nowCastApi - 40) <= 2, `Expected NowCast ~40, got ${result.nowCastApi}`);
    });

    it('should handle partial or short history arrays safely', () => {
      const shortSeries = [120, 110, 105];
      const result = calculateNowCast(shortSeries);

      assert.ok(result.nowCastApi >= 105 && result.nowCastApi <= 120);
      assert.ok(result.weightFactor >= 0.5 && result.weightFactor <= 1.0);
    });

    it('should fallback gracefully on empty or invalid input', () => {
      const result = calculateNowCast([]);
      assert.equal(result.nowCastApi, 0);
      assert.equal(result.weightFactor, 1.0);
    });
  });

  describe('applyKalmanFilter1D', () => {
    it('should fuse ground observation and model forecast with reduced posterior variance', () => {
      const groundZ = 120; // Ground sensor reading
      const forecastX = 100; // CAMS model forecast
      const result = applyKalmanFilter1D(groundZ, forecastX);

      // Fused estimate should fall between ground and forecast
      assert.ok(result.fusedEstimate > 100 && result.fusedEstimate < 120);
      // Posterior variance must be strictly smaller than prior variance (information fusion)
      assert.ok(result.posteriorVariance < result.priorVariance);
      assert.ok(result.confidenceDelta > 0, 'Should return non-zero 95% CI delta');
    });
  });

  describe('calculateHourlyVelocity', () => {
    it('should identify surging conditions when 3-hour delta is >= +15', () => {
      // Index jumped from 70 to 95 over 3 hours (delta = +25)
      const series = [95, 85, 78, 70, 68, 65];
      const velocity = calculateHourlyVelocity(series);

      assert.equal(velocity.isSurging, true);
      assert.equal(velocity.isClearing, false);
      assert.equal(velocity.delta3h, 25);
      assert.equal(velocity.velocityLabel, 'Surging');
    });

    it('should identify rapid clearing when 3-hour delta is <= -15', () => {
      // Index dropped from 130 to 105 over 3 hours (delta = -25)
      const series = [105, 115, 122, 130, 132, 135];
      const velocity = calculateHourlyVelocity(series);

      assert.equal(velocity.isSurging, false);
      assert.equal(velocity.isClearing, true);
      assert.equal(velocity.delta3h, -25);
      assert.equal(velocity.velocityLabel, 'Rapid Clearing');
    });

    it('should identify steady air when delta is within [-5, +5]', () => {
      const series = [82, 81, 83, 80, 81, 80];
      const velocity = calculateHourlyVelocity(series);

      assert.equal(velocity.isSteady, true);
      assert.equal(velocity.velocityLabel, 'Steady');
    });
  });

  describe('generate6HourProjection', () => {
    it('should produce 3 discrete forward projections (+2h, +4h, +6h)', () => {
      const currentNowCast = 110;
      const forecastSeries = [112, 115, 118, 114, 108, 102];
      const projections = generate6HourProjection(currentNowCast, forecastSeries);

      assert.equal(projections.length, 3);
      assert.equal(projections[0].hourOffset, 2);
      assert.equal(projections[1].hourOffset, 4);
      assert.equal(projections[2].hourOffset, 6);
      assert.ok(typeof projections[0].projectedApi === 'number');
      assert.ok(['rising', 'steady', 'clearing'].includes(projections[0].trendDirection));
    });
  });
});
