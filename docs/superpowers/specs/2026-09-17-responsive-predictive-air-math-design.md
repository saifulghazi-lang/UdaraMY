# Design Specification: Responsive NowCast & Predictive Air Quality Engine

**Date:** 2026-09-17  
**Status:** Approved  
**Topic:** State-of-the-Art Mathematics for Real-Time & Predictive Air Quality Numbers

---

## 1. Problem Statement & User Intent

### The Problem
Malaysia's official APIMS (Department of Environment) Air Pollutant Index (API) is computed as a **24-hour rolling average**. While useful for long-term epidemiological studies, it creates a severe **4 to 8 hour reporting lag** during rapid haze events:
- A sudden transboundary smoke surge at 8:00 AM may not register as "Unhealthy" (> 100) until the afternoon because the prior 20 hours of clean air suppress the average.
- Citizens smell smoke, experience eye irritation, and see dense haze outside, but the official index still reports "Moderate" or "Good".

### The User Intent
The general public does not want academic LaTeX derivations or complex formula modals. They want:
1. **The numbers right right now**: An accurate, responsive index that reflects immediate smoke spikes.
2. **The numbers later today**: Forward-looking predictive estimates for the next 2 to 6 hours to plan outdoor activities, school pickups, and commutes.
3. **Daily velocity**: Clear trajectory indicators showing whether air is deteriorating rapidly or clearing up.

---

## 2. Mathematical Architecture (Under the Hood)

### 2.1 US EPA / WMO NowCast Algorithm (Real-Time Responsiveness)
Replaces lagging 24-hour averages with a dynamic 12-hour geometric decay weighted average:

$$C_{\min} = \min(C_1, C_2, \dots, C_{12}), \quad C_{\max} = \max(C_1, C_2, \dots, C_{12})$$

$$\omega = \max\left(0.5, \ \left(\frac{C_{\min}}{C_{\max}}\right)^{1/2}\right)$$

$$I_{\text{NowCast}} = \frac{\sum_{i=1}^{12} \omega^{i-1} C_i}{\sum_{i=1}^{12} \omega^{i-1}}$$

- **During Rapid Haze Spikes:** When air quality deteriorates rapidly ($C_{\min}/C_{\max} \to 0$), the weight factor $\omega$ drops toward $0.5$. The most recent 3 hours carry $> 70\%$ of the total index weight, slashing reporting lag by ~4 to 7 hours.
- **During Stable Weather:** When air quality is steady ($C_{\min} \approx C_{\max}$), $\omega \to 1.0$, functioning as a smooth 12-hour noise filter.

### 2.2 1D Recursive Kalman Filter (Predictive Horizon & State Fusion)
Fuses the ground station measurement series with the physical CAMS / Open-Meteo European meteorological forecast to compute optimal current state and project the next 6 hours:

$$\text{Innovation: } y_k = z_k - x_k^-$$
$$\text{Kalman Gain: } K_k = \frac{P_k^-}{P_k^- + R}$$
$$\text{Updated State: } \hat{x}_k = x_k^- + K_k y_k$$
$$\text{Updated Variance: } P_k = (1 - K_k) P_k^-$$

The state transition projects forward across 6 hours using wind velocity and atmospheric boundary layer height trends:
$$\hat{x}_{k+h} = \hat{x}_k \cdot \phi(h) + (1 - \phi(h)) \cdot x_{\text{forecast}}(h)$$

### 2.3 3-Hour Velocity & Peak Analysis
$$\Delta_{3\text{h}} = C_1 - C_4$$
$$\text{Velocity Category: } \begin{cases} 
\text{Surging} & \Delta_{3\text{h}} \ge +15 \\
\text{Deteriorating} & +5 \le \Delta_{3\text{h}} < +15 \\
\text{Steady} & -5 \le \Delta_{3\text{h}} < +5 \\
\text{Clearing} & -15 < \Delta_{3\text{h}} \le -5 \\
\text{Rapid Clearing} & \Delta_{3\text{h}} \le -15
\end{cases}$$

---

## 3. Public-Facing UI Design

### 3.1 Primary Station Card (`AtmosphericCard.vue`)
- **Dual Index Display**:
  - **Large Primary Metric: `NowCast: 138` (Unhealthy)** with clear label: *Real-Time Responsive Index*.
  - **Official Comparison Badge: `Official APIMS 24h: 94` (Moderate)** with tooltip: *Official 24-hour statutory rolling average*.
- **3-Hour Velocity Badge**:
  - `+18 pts (Surging)` with red arrow indicator or `-12 pts (Rapid Clearing)` with green arrow.

### 3.2 Next-6-Hour Predictive Horizon Strip
A clean, forward-looking forecast pill bar:
- `+2h (4:00 PM)`: **142** ↗ *Peak smoke*
- `+4h (6:00 PM)`: **125** ↘ *Easing*
- `+6h (8:00 PM)`: **95** 🟢 *Clearing (Wind shift)*

No academic formulas, no whitepapers. Only clear numbers.

---

## 4. Components & Files Touched

1. **`src/services/mathematicsService.js`** [NEW]
   - `calculateNowCast(hourlyReadings)`
   - `applyKalmanFilter1D(groundObservation, modelForecast, options)`
   - `calculateHourlyVelocity(history)`
   - `generate6HourProjection(currentState, forecastSeries)`
2. **`src/stores/airQuality.js`** [MODIFY]
   - Integrate NowCast and predictive 6-hour projections into station getters.
3. **`src/components/AtmosphericCard.vue`** [MODIFY]
   - Render Dual Index (NowCast vs 24h APIMS), 3h Velocity, and Next-6-Hour predictive pill strip.

---

## 5. Verification Plan
- Unit test mathematical functions with known edge cases:
  - Rapid smoke spike: $[200, 180, 150, 60, 50, \dots]$ should yield $\omega = 0.5$ and NowCast $> 150$ while 24h average is $< 80$.
  - Stable clean air: $[40, 42, 38, 40, \dots]$ should yield $\omega \approx 0.95$ and NowCast $\approx 40$.
- Verify Vite dev server and `npm run build` exits code 0.
