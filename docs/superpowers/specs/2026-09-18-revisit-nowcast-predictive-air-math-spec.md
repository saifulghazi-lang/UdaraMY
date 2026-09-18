# Technical Specification: Re-Integrating Real-Time NowCast & 6-Hour Predictive Air Horizon

**Date:** 2026-09-18  
**Status:** Proposed  
**Author:** AI Engineering & Design  
**Topic:** Re-integrating UdaraMY's #1 core capability (NowCast Real-Time Index, 3h Velocity, and 6h Predictive Horizon) into the streamlined post-refactor UI.

---

## 1. Executive Summary & Problem Context

In the recent codebase decluttering pass, the UI elements for the **US EPA / WMO NowCast responsive index**, **3-hour velocity surge/clearing pills**, and **6-hour predictive horizon strip** were stripped from `AtmosphericCard.vue` in favor of raw pollutant metrics (PM2.5, PM10, etc.).

However, UdaraMY's core product proposition ([PRODUCT.md](file:///c:/Users/saiful.lazim/OneDrive%20-%20Malaysian%20Communications%20and%20Multimedia%20Commission/Personal/Air%20Quality/PRODUCT.md)) is **eliminating the 4-to-8 hour statutory APIMS reporting lag** during rapid transboundary smoke intrusions. Without this UI, everyday Malaysians, parents, and outdoor workers cannot tell if air quality is surging or clearing in real time.

This specification outlines the re-integration of this core capability:
- **Backend Architecture (`/ponytail`)**: The simplest, zero-dependency, maximum-reuse implementation. Reuses the already tested `mathematicsService.js` and Pinia store getters. Zero extra dependencies, zero API calls, $O(1)$ client execution.
- **Frontend Architecture (`/impeccable`)**: Crafted for **Operate mode**. Resolves visual clutter by harmonizing the primary gauge, responsive NowCast comparison pill, 3-hour velocity badge, 6-hour projection strip, and primary pollutant telemetry into a unified, high-hierarchy card that fits comfortably on mobile viewports.

---

## 2. Backend Logic Specification (`/ponytail`)

### 2.1 The Ladder & YAGNI Assessment
1. **Does new backend logic need to be built?** **No.** `src/services/mathematicsService.js` is already implemented and verified with 100% pass rate in unit tests.
2. **Are new dependencies required?** **No.** Zero new packages. No chart libraries, no state machines.
3. **Is store modification needed?** **Minimal to None.** `src/stores/airQuality.js`'s `currentStation` getter already computes:
   - `nowCast`: `{ nowCastApi, weightFactor, lagReductionHours, isHighVolatility }`
   - `velocity3h`: `{ delta3h, velocityLabel, velocityTrend, isSurging, isClearing }`
   - `predictions6h`: `Array<{ hourOffset, timeLabel, projectedApi, trendDirection }>`
4. **Ponytail Rule:** Reuse the existing pipeline directly via component props. Do not reinvent wrappers, composables, or intermediate abstractions.

### 2.2 Data Contract (Unchanged & Verified)
```typescript
interface NowCastData {
  nowCastApi: number;          // e.g. 118 (responsive real-time index)
  weightFactor: number;        // dynamic geometric decay factor omega (0.5 - 1.0)
  lagReductionHours: number;   // e.g. 4.8 hours saved over statutory rolling avg
  isHighVolatility: boolean;   // true during sudden smoke intrusion spikes
}

interface Velocity3hData {
  delta3h: number;             // e.g. +18 or -12
  velocityLabel: string;       // 'Surging' | 'Deteriorating' | 'Steady' | 'Clearing' | 'Rapid Clearing'
  velocityTrend: string;       // 'rising_fast' | 'rising' | 'steady' | 'falling' | 'falling_fast'
  isSurging: boolean;
  isClearing: boolean;
}

interface PredictionItem {
  hourOffset: number;          // 2, 4, 6
  timeLabel: string;           // '11:00 AM', '1:00 PM', '3:00 PM'
  projectedApi: number;        // projected API value
  trendDirection: 'rising' | 'clearing' | 'steady';
}
```

---

## 3. UI/UX Design Requirements (`/impeccable`)

### 3.1 Mode: **Operate**
The user checks UdaraMY during morning routines (e.g. at 6:45 AM before sending children to school or commuting). Every millisecond counts. Telemetry must be scannable in $< 2$ seconds.

### 3.2 Visual Hierarchy & Information Architecture
The hero `AtmosphericCard.vue` must present three levels of information without cognitive overload:

```
+-------------------------------------------------------------+
| [Location Pin] Cheras, Kuala Lumpur        [GPS 1.8km] [Live]|
|                                                             |
|                    (  118  )  <-- NowCast Primary Gauge     |
|                   UNHEALTHY                                 |
|                                                             |
|   [⚡ Real-Time NowCast: 118]  vs  [🏛️ APIMS 24h: 86]       |
|            [▲ +18 pts/3h Surging (Rapid Smoke)]             |
|                                                             |
|   🔮 NEXT 6 HOURS (PROJECTION)                              |
|   +-------------------+-------------------+-----------------+
|   | +2h (11:00 AM)    | +4h (1:00 PM)     | +6h (3:00 PM)   |
|   | 135 ▲ Unhealthy   | 128 ▼ Unhealthy   | 98 🟢 Moderate  |
|   +-------------------+-------------------+-----------------+
|                                                             |
|   🧪 PRIMARY POLLUTANTS (2x4 or 4x1 Micro Grid)             |
|   [PM2.5: 42.1 µg] [PM10: 58 µg] [O3: 0.04 ppm] [CO: 1.1]   |
|                                                             |
|   🛡️ HEALTH ACTION BANNER                                   |
|   "Unhealthy air: sensitive groups stay indoors..."         |
+-------------------------------------------------------------+
```

### 3.3 Design Tokens & Theming (Light & AMOLED Pure Black)
* **Canvas Surfaces:**
  * Light: `bg-white border-slate-200/90 shadow-sm`
  * Dark: `dark:bg-neutral-950/80 dark:border-white/10`
* **Subtle Inset Modules:**
  * Light: `bg-slate-50 border-slate-200/80`
  * Dark: `dark:bg-white/[0.03] dark:border-white/10`
* **Typography:**
  * Gauge number: `font-mono font-black tracking-tighter tabular-nums`
  * Forecast & velocity figures: `font-mono font-bold tabular-nums`
  * Status labels: `font-sans font-bold uppercase tracking-wider text-[10px]`
* **Status Accents:**
  * Good: `#00d2ff` (Cyan)
  * Moderate: `#10b981` (Emerald)
  * Unhealthy: `#f59e0b` (Amber)
  * Very Unhealthy: `#ef4444` (Crimson)
  * Hazardous: `#881337` (Deep Rose / Burgundy)

### 3.4 Component Specifications

#### A. Dual-Index & Velocity Capsule Row
* **Real-Time NowCast Tag:**
  * Clean cyan/indigo tint pill (`bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25`).
  * Features a micro `Sparkles` icon and displays the responsive NowCast value (`displayApi`).
* **Statutory APIMS 24h Comparison Badge:**
  * Muted secondary capsule (`bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300`).
  * Explicitly displays `station.api` with label `APIMS 24j`. Tooltip explains statutory rolling average.
* **3-Hour Velocity Trajectory Indicator:**
  * Visual states:
    * **Surging / Rising:** `bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-400` with `TrendingUp` icon and sign prefix (`+18 pts`).
    * **Clearing / Falling:** `bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400` with `TrendingDown` icon (`-12 pts`).
    * **Steady:** `bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400` with `Minus` icon.

#### B. Next-6-Hour Predictive Horizon Strip
* **Position:** Directly below the velocity pills and above the primary pollutant grid.
* **Layout:** 3-column equal-width grid (`grid grid-cols-3 gap-2`).
* **Content Per Cell:**
  * Header: Time offset and clock hour (e.g. `+2j • 11:00 AM`).
  * Body: Projected API number (`tabular-nums font-mono font-black text-sm sm:text-base`) paired with micro-trend arrow (`TrendingUp` in rose or `TrendingDown` in emerald).
  * Category Chip: Micro-pill with border matching the projected API category color.
* **Micro-interactions:** Subtle hover scale/border highlight on desktop, tap-safe on mobile.

#### C. Telemetry Harmonization
* The 4-cell primary pollutant grid (`PM2.5`, `PM10`, `O₃`, `CO`) is preserved beneath the predictive horizon.
* Padding and spacing tuned to `gap-2` and `py-2` so the total card height increases by only ~85px, ensuring health guidance remains immediately visible above the mobile fold.

---

## 4. Internationalization (i18n)

Translations are already registered in `src/i18n/index.js`:
* `predictive.title`: "Ramalan 6-Jam" / "6-Hour Forecast Horizon"
* `predictive.subtitle`: "Model CAMS + Kalman" / "CAMS + Kalman Hybrid"
* `predictive.realtimeIndex`: "Indeks Masa-Nyata" / "Real-Time Index"
* `predictive.statutoryIndex`: "APIMS 24j" / "Statutory APIMS (24h)"
* `predictive.realtimeTooltip`: Tooltip explaining lag reduction
* `predictive.statutoryTooltip`: Tooltip explaining official 24h rolling average

---

## 5. Implementation Roadmap & Verification

### Step 1: Template Update in `src/components/AtmosphericCard.vue`
* Re-introduce the dual-index capsule and velocity pill row between the main gauge readout and the primary pollutant telemetry.
* Re-introduce the 3-column 6-hour prediction grid with responsive typography and category badges.
* Ensure all existing tests pass.

### Step 2: Automated & Quality Verification
* **Test Suite:** Execute `node --test src/services/__tests__/*.test.js` to verify mathematical rigor (NowCast harmonic decay, Kalman 1D fusion, 3h velocity limits, and modal harmonization).
* **Build Verification:** Run `npm run build` to confirm zero bundler errors or chunk size regressions.
* **Responsive Verification:** Inspect viewport scaling at 360px (mobile), 768px (tablet), and 1280px (desktop) in both Light Mode and AMOLED Pure Black Dark Mode.
