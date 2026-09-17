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
 * Calculates the US EPA / WMO NowCast responsive index from an array of hourly readings.
 * 
 * Formula:
 * c_min = min(C_1..C_12), c_max = max(C_1..C_12)
 * omega = max(0.5, min(1.0, sqrt(c_min / c_max)))
 * NowCast = sum(omega^(i-1) * C_i) / sum(omega^(i-1))
 * 
 * @param {number[]} hourlyReadings - Hourly values, most recent at index 0
 * @returns {{ nowCastApi: number, weightFactor: number, lagReductionHours: number, isHighVolatility: boolean }}
 */
export function calculateNowCast(hourlyReadings) {
  if (!Array.isArray(hourlyReadings) || hourlyReadings.length === 0) {
    return {
      nowCastApi: 0,
      weightFactor: 1.0,
      lagReductionHours: 0,
      isHighVolatility: false
    };
  }

  // Filter valid numbers and cap at 12 hours
  const valid = hourlyReadings
    .filter(val => typeof val === 'number' && !isNaN(val))
    .slice(0, 12);

  if (valid.length === 0) {
    return {
      nowCastApi: 0,
      weightFactor: 1.0,
      lagReductionHours: 0,
      isHighVolatility: false
    };
  }

  const cMin = Math.min(...valid);
  const cMax = Math.max(...valid);

  if (cMax <= 0) {
    return {
      nowCastApi: 0,
      weightFactor: 1.0,
      lagReductionHours: 0,
      isHighVolatility: false
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

  const nowCastApi = denominator > 0 ? Math.round(numerator / denominator) : valid[0];
  const lagReductionHours = +(((1 - omega) * 10).toFixed(1));

  return {
    nowCastApi,
    weightFactor: +(omega.toFixed(3)),
    lagReductionHours,
    isHighVolatility: omega < 0.75
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
