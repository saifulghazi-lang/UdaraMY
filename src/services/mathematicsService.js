/**
 * Atmospheric Mathematics & Real-Time Predictive Engine
 * 
 * Implements:
 * 1. US EPA / WMO 12-Hour NowCast Decay Series Algorithm
 * 2. 1D Recursive Kalman Filter for Bayesian Sensor-Forecast Fusion
 * 3. 3-Hour Atmospheric Velocity & Trajectory Classification
 * 4. Next-6-Hour Predictive Horizon Projections
 */

/**
 * Imputes missing readings in an hourly sequence using Last Observation Carried Forward (LOCF).
 * Flags as degraded if missing count exceeds maxAllowedGap (default 2 hours).
 * 
 * @param {Array<number|null|undefined>} readings 
 * @param {number} [maxAllowedGap=2]
 * @returns {{ series: number[], isDataDegraded: boolean, missingCount: number }}
 */
export function imputeMissingReadings(readings, maxAllowedGap = 2) {
  if (!Array.isArray(readings) || readings.length === 0) {
    return { series: [], isDataDegraded: true, missingCount: 0 };
  }

  const raw = readings.slice(0, 12);
  let missingCount = 0;
  const imputed = [];
  let lastKnown = null;

  for (const val of raw) {
    if (typeof val === 'number' && !isNaN(val)) {
      lastKnown = val;
      break;
    }
  }

  if (lastKnown === null) {
    return { series: [], isDataDegraded: true, missingCount: raw.length };
  }

  for (let i = 0; i < raw.length; i++) {
    const val = raw[i];
    if (typeof val === 'number' && !isNaN(val)) {
      imputed.push(val);
      lastKnown = val;
    } else {
      missingCount++;
      // Last Observation Carried Forward
      imputed.push(lastKnown);
    }
  }

  const isDataDegraded = missingCount > maxAllowedGap;
  return { series: imputed, isDataDegraded, missingCount };
}

/**
 * Checks if telemetry data has exceeded maximum allowed age (e.g. 60 minutes)
 * based on elapsed fetch time, decoupled from wall-clock drift.
 * 
 * @param {number} fetchEpochMs 
 * @param {number} [maxAgeMs=3600000] - Default 60 minutes
 * @returns {boolean}
 */
export function isTelemetryStale(fetchEpochMs, maxAgeMs = 3600000) {
  if (!fetchEpochMs || typeof fetchEpochMs !== 'number' || isNaN(fetchEpochMs)) {
    return true;
  }
  return (Date.now() - fetchEpochMs) > maxAgeMs;
}

/**
 * Calculates the US EPA / WMO NowCast responsive index and regularized instantaneous
 * reconstructed estimate with non-linear damping and strict [0, 500] boundary clamping.
 * 
 * @param {number[]} hourlyReadings - Hourly values, most recent at index 0
 * @param {Object} [options]
 * @param {number} [options.alpha=8.0] - Momentum weight factor
 * @returns {{ nowCastApi: number, instantaneousEstimate: number, weightFactor: number, lagReductionHours: number, isHighVolatility: boolean, isDataDegraded: boolean }}
 */
export function calculateNowCast(hourlyReadings, options = {}) {
  if (!Array.isArray(hourlyReadings) || hourlyReadings.length === 0) {
    return {
      nowCastApi: 0,
      instantaneousEstimate: 0,
      weightFactor: 1.0,
      lagReductionHours: 0,
      isHighVolatility: false,
      isDataDegraded: false
    };
  }

  // Telemetry gap imputation (LOCF up to 2 gaps)
  const { series: valid, isDataDegraded } = imputeMissingReadings(hourlyReadings, 2);

  if (valid.length === 0) {
    return {
      nowCastApi: 0,
      instantaneousEstimate: 0,
      weightFactor: 1.0,
      lagReductionHours: 0,
      isHighVolatility: false,
      isDataDegraded: true
    };
  }

  const cMin = Math.min(...valid);
  const cMax = Math.max(...valid);

  if (cMax <= 0) {
    return {
      nowCastApi: 0,
      instantaneousEstimate: 0,
      weightFactor: 1.0,
      lagReductionHours: 0,
      isHighVolatility: false,
      isDataDegraded
    };
  }

  // Dynamic weight factor omega based on volatility ratio
  const ratio = Math.max(0, cMin / cMax);
  const omega = Math.max(0.5, Math.min(1.0, Math.sqrt(ratio)));

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < valid.length; i++) {
    const weight = Math.pow(omega, i);
    numerator += weight * valid[i];
    denominator += weight;
  }

  let nowCastApi = denominator > 0 ? Math.round(numerator / denominator) : valid[0];

  // Reconstructed Instantaneous Rate-of-Change with Clamping and Non-Linear Damping
  const current = valid[0];
  const previous = valid.length > 1 ? valid[1] : current;
  const deltaRaw = current - previous;

  // Non-linear damping: alpha attenuates as API approaches high values (prevents runaway overshoot)
  const baseAlpha = typeof options.alpha === 'number' ? options.alpha : 8.0;
  const alphaDamped = baseAlpha * Math.max(0.2, 1 - (current / 600));

  // Clamped rate-of-change estimate
  const instantaneousRaw = current + (alphaDamped * deltaRaw);
  const instantaneousEstimate = Math.max(0, Math.min(500, Math.round(instantaneousRaw)));

  // Boundary clamp NowCast API to [0, 500]
  nowCastApi = Math.max(0, Math.min(500, nowCastApi));

  const lagReductionHours = +(((1 - omega) * 10).toFixed(1));

  return {
    nowCastApi,
    instantaneousEstimate,
    weightFactor: +(omega.toFixed(3)),
    lagReductionHours,
    isHighVolatility: omega < 0.75,
    isDataDegraded
  };
}

/**
 * 1D Recursive Kalman Filter for Bayesian sensor-forecast state fusion.
 * Fuses ground station APIMS measurement with atmospheric numerical model forecasts.
 * 
 * @param {number} groundObservation - Sensor measurement z_k
 * @param {number} modelForecast - Atmospheric forecast prior x_k^-
 * @param {Object} [options]
 * @param {number} [options.R=4.0] - Measurement noise covariance (sensor variance)
 * @param {number} [options.Q=9.0] - Process noise covariance (model uncertainty)
 * @returns {{ fusedEstimate: number, confidenceDelta: number, confidenceLower: number, confidenceUpper: number, posteriorVariance: number, priorVariance: number, kalmanGain: number }}
 */
export function applyKalmanFilter1D(groundObservation, modelForecast, options = {}) {
  const z = typeof groundObservation === 'number' && !isNaN(groundObservation) ? groundObservation : 50;
  const xPrior = typeof modelForecast === 'number' && !isNaN(modelForecast) ? modelForecast : z;

  const R = options.R || 4.0; // Measurement noise covariance
  const Q = options.Q || 9.0; // Prior forecast error covariance

  // Innovation
  const y = z - xPrior;
  // Innovation covariance
  const S = Q + R;
  // Optimal Kalman Gain
  const K = Q / S;

  // Posterior state estimate
  const xHat = xPrior + K * y;
  // Posterior error covariance
  const P = (1 - K) * Q;

  // 95% Bayesian Confidence Band (1.96 * sigma)
  const confidenceDelta = +(1.96 * Math.sqrt(P)).toFixed(1);

  return {
    fusedEstimate: Math.round(xHat),
    rawEstimate: +(xHat.toFixed(1)),
    priorVariance: Q,
    posteriorVariance: +(P.toFixed(2)),
    kalmanGain: +(K.toFixed(3)),
    confidenceDelta,
    confidenceLower: Math.max(0, Math.round(xHat - confidenceDelta)),
    confidenceUpper: Math.round(xHat + confidenceDelta)
  };
}

/**
 * Computes 3-hour atmospheric air quality velocity and trajectory.
 * 
 * @param {number[]} history - Hourly values, most recent at index 0
 * @returns {{ delta3h: number, velocityLabel: string, velocityTrend: string, isSurging: boolean, isClearing: boolean, isSteady: boolean }}
 */
export function calculateHourlyVelocity(history) {
  if (!Array.isArray(history) || history.length < 2) {
    return {
      delta3h: 0,
      velocityLabel: 'Steady',
      velocityTrend: 'stable',
      isSurging: false,
      isClearing: false,
      isSteady: true
    };
  }

  const valid = history.filter(val => typeof val === 'number' && !isNaN(val));
  if (valid.length < 2) {
    return {
      delta3h: 0,
      velocityLabel: 'Steady',
      velocityTrend: 'stable',
      isSurging: false,
      isClearing: false,
      isSteady: true
    };
  }

  const current = valid[0];
  const compareIdx = Math.min(3, valid.length - 1);
  const baseline = valid[compareIdx];
  const delta3h = current - baseline;

  if (delta3h >= 15) {
    return {
      delta3h,
      velocityLabel: 'Surging',
      velocityTrend: 'rising_fast',
      isSurging: true,
      isClearing: false,
      isSteady: false
    };
  } else if (delta3h >= 5) {
    return {
      delta3h,
      velocityLabel: 'Deteriorating',
      velocityTrend: 'rising',
      isSurging: false,
      isClearing: false,
      isSteady: false
    };
  } else if (delta3h <= -15) {
    return {
      delta3h,
      velocityLabel: 'Rapid Clearing',
      velocityTrend: 'falling_fast',
      isSurging: false,
      isClearing: true,
      isSteady: false
    };
  } else if (delta3h <= -5) {
    return {
      delta3h,
      velocityLabel: 'Improving',
      velocityTrend: 'falling',
      isSurging: false,
      isClearing: true,
      isSteady: false
    };
  }

  return {
    delta3h,
    velocityLabel: 'Steady',
    velocityTrend: 'stable',
    isSurging: false,
    isClearing: false,
    isSteady: true
  };
}

/**
 * Generates forward-looking 6-hour projections in 2-hour increments (+2h, +4h, +6h).
 * Fuses current NowCast baseline with model trend using exponential temporal decay.
 * 
 * @param {number} currentNowCast - Current active responsive index
 * @param {number[]} [forecastSeries=[]] - External forecast series from Open-Meteo
 * @returns {Array<{ hourOffset: number, timeLabel: string, projectedApi: number, trendDirection: 'rising' | 'clearing' | 'steady' }>}
 */
export function generate6HourProjection(currentNowCast, forecastSeries = []) {
  const base = typeof currentNowCast === 'number' && !isNaN(currentNowCast) ? currentNowCast : 50;
  const offsets = [2, 4, 6];
  const now = new Date();

  return offsets.map(offset => {
    const futureDate = new Date(now.getTime() + offset * 60 * 60 * 1000);
    const timeLabel = futureDate.toLocaleTimeString([], { hour: 'numeric', hour12: true });

    // Exponential decay weight for current persistence vs forecast
    const persistenceWeight = Math.exp(-offset / 3.5);

    let rawForecast = null;
    if (Array.isArray(forecastSeries) && forecastSeries.length >= offset) {
      const item = forecastSeries[offset - 1];
      if (typeof item === 'number' && !isNaN(item)) {
        rawForecast = item;
      } else if (item && typeof item.api === 'number' && !isNaN(item.api)) {
        rawForecast = item.api;
      }
    }

    const forecastTarget = (typeof rawForecast === 'number' && !isNaN(rawForecast))
      ? rawForecast
      : base;

    const projectedApi = Math.max(0, Math.round(base * persistenceWeight + forecastTarget * (1 - persistenceWeight)));
    const safeProjected = isNaN(projectedApi) ? base : projectedApi;
    const diff = safeProjected - base;

    let trendDirection = 'steady';
    if (diff >= 5) trendDirection = 'rising';
    else if (diff <= -5) trendDirection = 'clearing';

    return {
      hourOffset: offset,
      timeLabel: `+${offset}h (${timeLabel})`,
      projectedApi: safeProjected,
      trendDirection
    };
  });
}
