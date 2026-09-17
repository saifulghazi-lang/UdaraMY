# Responsive NowCast & Predictive Air Math Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the US EPA / WMO NowCast decay series algorithm, 1D recursive Kalman filter, 3-hour velocity, and next-6-hour predictive projections in UdaraMY so citizens get fast, responsive, and predictive air quality numbers without reporting lag.

**Architecture:** A pure mathematical calculation service (`mathematicsService.js`) tested via Node's native test runner (`node --test`), integrated into Pinia store getters (`airQuality.js`), and rendered as clean dual-index and predictive pills in `AtmosphericCard.vue`.

**Tech Stack:** JavaScript (ESM), Vue 3, Pinia, TailwindCSS, Node.js Test Runner (`node --test`).

**Spec:** [`docs/superpowers/specs/2026-09-17-responsive-predictive-air-math-design.md`](../specs/2026-09-17-responsive-predictive-air-math-design.md)

## Global Constraints
- No academic LaTeX modals or derivation whitepapers displayed to users. Numbers must be practical, immediate, and actionable.
- Pure client-side execution ($O(1)$ constant time complexity) with zero server overhead.
- Strictly adhere to pure AMOLED dark theme and light theme styling tokens.

---

### Task 1: Core Mathematical Engine & Unit Tests

**Files:**
- Create: `src/services/mathematicsService.js`
- Test: `src/services/__tests__/mathematicsService.test.js`

**Interfaces:**
- Produces:
  - `calculateNowCast(hourlyReadings)` -> `{ nowCastApi, weightFactor, responsivenessLagHours }`
  - `applyKalmanFilter1D(groundObservation, modelForecast, options)` -> `{ fusedEstimate, confidenceDelta, kalmanGain }`
  - `calculateHourlyVelocity(history)` -> `{ delta3h, velocityLabel, velocityTrend, isSurging, isClearing }`
  - `generate6HourProjection(currentNowCast, forecastSeries)` -> `Array<{ hourOffset, timeLabel, projectedApi, trendDirection }>`

- [ ] **Step 1: Write unit tests in `src/services/__tests__/mathematicsService.test.js`**
  - Test NowCast under extreme smoke spike (e.g. $[180, 160, 140, 50, 45, \dots]$) ensures $\omega = 0.5$ and NowCast reflects the recent spike.
  - Test NowCast under steady conditions (e.g. $[40, 42, 40, 39, \dots]$) ensures $\omega \approx 0.97$.
  - Test 1D Kalman filter state fusion produces lower variance than either individual sensor or forecast.
  - Test 3-hour velocity categorizes surging ($+18$) vs rapid clearing ($-16$).
  - Test 6-hour projection produces ordered 6-hour interval steps.

- [ ] **Step 2: Run tests to confirm failure**
  - Run `node --test src/services/__tests__/mathematicsService.test.js` to ensure the tests fail before implementation.

- [ ] **Step 3: Implement `src/services/mathematicsService.js`**
  - Implement `calculateNowCast` with EPA 12-hour harmonic geometric weight equation:
    $\omega = \max(0.5, (C_{\min}/C_{\max})^{1/2})$
  - Implement `applyKalmanFilter1D` with optimal Kalman gain $K = P^- / (P^- + R)$ and posterior variance $P = (1-K)P^-$.
  - Implement `calculateHourlyVelocity` and `generate6HourProjection`.

- [ ] **Step 4: Run unit tests and confirm 100% pass**
  - Run `node --test src/services/__tests__/mathematicsService.test.js` and verify all tests pass with exit code 0.

- [ ] **Step 5: Commit Task 1**
  - `git add src/services/mathematicsService.js src/services/__tests__/mathematicsService.test.js`
  - `git commit -m "feat(math): implement NowCast, Kalman filter, and predictive air math engine"`

---

### Task 2: Pinia Store Integration

**Files:**
- Modify: `src/stores/airQuality.js`

**Interfaces:**
- Consumes: `calculateNowCast`, `applyKalmanFilter1D`, `calculateHourlyVelocity`, `generate6HourProjection` from `mathematicsService.js`
- Produces: Enhanced station computed properties:
  - `currentStation.nowCast`: `{ api, weightFactor, lagReductionHours }`
  - `currentStation.velocity3h`: `{ delta, label, trend }`
  - `currentStation.predictions6h`: `Array<{ time, api, trend }>`

- [ ] **Step 1: Update `src/stores/airQuality.js` getters**
  - In `currentStation` getter, compute `nowCast`, `velocity3h`, and `predictions6h` using the station's `history24h` and `forecast`.
  - Provide safe fallbacks if history length is less than 12 hours.

- [ ] **Step 2: Verify store execution via Node or build check**
  - Test import and execution to ensure no circular dependencies.

- [ ] **Step 3: Commit Task 2**
  - `git add src/stores/airQuality.js`
  - `git commit -m "feat(store): integrate NowCast and predictive math into airQuality store"`

---

### Task 3: Public-Facing UI Enhancements in AtmosphericCard

**Files:**
- Modify: `src/components/AtmosphericCard.vue`

**Interfaces:**
- Consumes: `station.nowCast`, `station.velocity3h`, `station.predictions6h` from `props.station`

- [ ] **Step 1: Add Dual-Index Display to `AtmosphericCard.vue`**
  - Display the primary **NowCast Real-Time API** prominently as the main number.
  - Display the **Official APIMS (24h Rolling Average)** in a clean secondary comparison capsule badge.
  - Include the **3-Hour Velocity indicator** (e.g. `▲ +14 pts Surging` or `▼ -8 pts Clearing`).

- [ ] **Step 2: Add Next-6-Hour Predictive Horizon Pill Bar**
  - Mount a compact horizontal strip below the atmospheric metrics showing the next 6 hours in 2-hour increments:
    - E.g. `+2h (4:00 PM): 142 ↗`, `+4h (6:00 PM): 125 ↘`, `+6h (8:00 PM): 95 🟢`.
  - Format with clean status color coding matching the air quality category.

- [ ] **Step 3: Verify responsive layout on mobile and desktop**
  - Ensure cards and text do not wrap awkwardly or clip on small screens.

- [ ] **Step 4: Commit Task 3**
  - `git add src/components/AtmosphericCard.vue`
  - `git commit -m "feat(ui): display NowCast real-time index and next-6-hour predictions on AtmosphericCard"`

---

### Task 4: End-to-End Build & Verification

**Files:**
- Test: Build output and live server verification

- [ ] **Step 1: Run production build**
  - Execute `npm run build` and ensure clean exit code 0.

- [ ] **Step 2: Verify live local server**
  - Confirm `http://localhost:5175/` loads the dual index, 3-hour velocity, and predictive horizon pills without any console errors.

- [ ] **Step 3: Update walkthrough artifact**
  - Document the completed mathematical features with verified outputs in `walkthrough.md`.
