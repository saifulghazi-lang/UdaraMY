import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNowCast,
  applyKalmanFilter1D,
  calculateHourlyVelocity,
  generate6HourProjection,
  imputeMissingReadings,
  isTelemetryStale
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
      assert.ok(!isNaN(projections[0].projectedApi));
      assert.ok(['rising', 'steady', 'clearing'].includes(projections[0].trendDirection));
    });

    it('should gracefully handle forecastSeries containing objects with api properties without producing NaN', () => {
      const currentNowCast = 157;
      const forecastSeries = [
        { api: 155 },
        { api: 160 },
        { api: 162 },
        { api: 158 },
        { api: 150 },
        { api: 145 }
      ];
      const projections = generate6HourProjection(currentNowCast, forecastSeries);

      assert.equal(projections.length, 3);
      for (const p of projections) {
        assert.ok(typeof p.projectedApi === 'number', 'projectedApi must be a number');
        assert.ok(!isNaN(p.projectedApi), 'projectedApi must not be NaN');
        assert.ok(p.projectedApi > 0, 'projectedApi must be greater than zero');
      }
    });

    it('should safely fallback to base NowCast when forecastSeries is empty or invalid', () => {
      const currentNowCast = 88;
      const projections = generate6HourProjection(currentNowCast, null);

      assert.equal(projections.length, 3);
      for (const p of projections) {
        assert.ok(!isNaN(p.projectedApi));
        assert.equal(p.projectedApi, 88);
      }
    });
  });

  describe('Reconstructed Hourly Math & Clamping', () => {
    it('should strictly clamp instantaneous estimate to [0, 500] even with extreme upward jump', () => {
      // Station reports 480 jumping from 400 (delta = +80). Without clamping, 480 + 8 * 80 = 1120!
      const jumpSeries = [480, 400, 380, 350, 300];
      const result = calculateNowCast(jumpSeries);

      assert.ok(result.instantaneousEstimate <= 500, `Expected <= 500, got ${result.instantaneousEstimate}`);
      assert.equal(result.instantaneousEstimate, 500);
    });

    it('should strictly clamp instantaneous estimate to 0 on extreme downward drop', () => {
      // Station reports 10 dropping from 80 (delta = -70). Without clamping, 10 + 8 * (-70) = -550!
      const dropSeries = [10, 80, 90, 85, 80];
      const result = calculateNowCast(dropSeries);

      assert.ok(result.instantaneousEstimate >= 0, `Expected >= 0, got ${result.instantaneousEstimate}`);
      assert.equal(result.instantaneousEstimate, 0);
    });

    it('should apply non-linear alpha damping to attenuate momentum at higher API levels', () => {
      // Low API: delta of +10 at API 50
      const lowSeries = [50, 40, 40];
      const lowResult = calculateNowCast(lowSeries);
      const lowBoost = lowResult.instantaneousEstimate - 50;

      // High API: same delta of +10 at API 350
      const highSeries = [350, 340, 340];
      const highResult = calculateNowCast(highSeries);
      const highBoost = highResult.instantaneousEstimate - 350;

      // High API boost must be smaller due to alpha damping (1 - 350/600 < 1 - 50/600)
      assert.ok(highBoost < lowBoost, `Expected highBoost (${highBoost}) < lowBoost (${lowBoost})`);
    });
  });

  describe('imputeMissingReadings (LOCF)', () => {
    it('should impute <= 2 missing hours using LOCF without flagging as degraded', () => {
      const gapped = [120, null, 110, undefined, 100, 95];
      const { series, isDataDegraded, missingCount } = imputeMissingReadings(gapped, 2);

      assert.equal(missingCount, 2);
      assert.equal(isDataDegraded, false);
      assert.equal(series[1], 120); // LOCF from index 0
      assert.equal(series[3], 110); // LOCF from index 2
    });

    it('should flag as degraded when missing hours exceed threshold (> 2 hours)', () => {
      const badlyGapped = [120, null, null, null, 100];
      const { isDataDegraded, missingCount } = imputeMissingReadings(badlyGapped, 2);

      assert.equal(missingCount, 3);
      assert.equal(isDataDegraded, true);
    });
  });

  describe('isTelemetryStale (Clock Drift Resilient)', () => {
    it('should report fresh when elapsed time is within 60 minutes', () => {
      const recentEpoch = Date.now() - (25 * 60 * 1000); // 25 mins ago
      assert.equal(isTelemetryStale(recentEpoch, 3600000), false);
    });

    it('should report stale when elapsed time exceeds 60 minutes', () => {
      const oldEpoch = Date.now() - (75 * 60 * 1000); // 75 mins ago
      assert.equal(isTelemetryStale(oldEpoch, 3600000), true);
    });

    it('should gracefully handle null or invalid epoch', () => {
      assert.equal(isTelemetryStale(null), true);
      assert.equal(isTelemetryStale(undefined), true);
      assert.equal(isTelemetryStale('invalid'), true);
    });
  });
});

