# Transboundary Wind & Smoke Plume Vector Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real-time, animated Transboundary Wind & Smoke Plume Vector Overlay on the National Map (Leaflet) with 2D vector field interpolation, animated streamline particles, and satellite fire smoke dispersion cones with arrival ETAs.

**Architecture:** A standalone mathematical service (`windVectorService.js`) ingests regional Open-Meteo wind vectors and computes continuous bilinear field interpolations and downwind threat cones. A synchronized HTML5 Canvas overlay on Leaflet animates streamline particles and threat cones efficiently (<1.5% CPU). The layer auto-activates when satellite hotspots spike and connects directly to the Hotspot Tracker.

**Tech Stack:** Vue 3, Pinia, Leaflet 1.9, HTML5 Canvas 2D, Open-Meteo Wind API, Node.js Test Runner.

**Spec:** [`docs/superpowers/specs/2026-09-17-transboundary-wind-smoke-plume-design.md`](file:///c:/Users/saiful.lazim/OneDrive%20-%20Malaysian%20Communications%20and%20Multimedia%20Commission/Personal/Air%20Quality/docs/superpowers/specs/2026-09-17-transboundary-wind-smoke-plume-design.md)

## Global Constraints

- Zero mock telemetry; use real Open-Meteo regional wind vectors with robust climatological monsoon fallbacks.
- Mobile performance: throttle particle animation to 30–40 fps, cap particles at 50–60 on mobile (<1.5% CPU).
- Clean pause & teardown: stop animation loop when map is hidden or layer is toggled off.
- English default interface with localized strings in `src/locales/en.json`.
- All tests must pass via `node --test` with zero failures.

---

### Task 1: Meteorological Grid & Wind Vector Service

**Files:**
- Create: `src/services/windVectorService.js`
- Test: `src/services/__tests__/windVectorService.test.js`

**Interfaces:**
- Produces:
  - `interpolateWindVector(lat, lng, grid)`: returns `{ u: number, v: number, speedKm: number, deg: number }`
  - `calculatePlumeThreat(origin, hotspotCount, windVector)`: returns `{ arcDeg: number, headingDeg: number, lengthKm: number, etaHours: number, threatLevel: 'severe' | 'elevated' | 'safe', label: string }`
  - `fetchRegionalWindGrid()`: returns array of 6 regional node objects `{ id, name, lat, lng, speedKm, deg, u, v }`
  - `getClimatologicalWindGrid()`: returns fallback monsoon baseline node grid

- [ ] **Step 1: Write the failing unit tests**

```javascript
// src/services/__tests__/windVectorService.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/services/__tests__/windVectorService.test.js`  
Expected: FAIL (Cannot find module '../windVectorService.js')

- [ ] **Step 3: Implement `src/services/windVectorService.js`**

```javascript
// src/services/windVectorService.js
/**
 * Transboundary Wind & Smoke Plume Vector Service
 * Provides continuous 2D vector field interpolation and downwind plume dispersion modeling.
 */

export const REGIONAL_NODES = [
  { id: 'north_straits', name: 'Northern Malacca Straits', lat: 3.0, lng: 99.0 },
  { id: 'central_straits', name: 'Central Straits / Klang Valley', lat: 3.1, lng: 101.5 },
  { id: 'south_straits', name: 'Southern Straits / Johor', lat: 1.4, lng: 103.8 },
  { id: 'south_china_sea', name: 'South China Sea Basin', lat: 3.5, lng: 106.0 },
  { id: 'west_sarawak', name: 'Western Sarawak / Kuching', lat: 1.5, lng: 110.3 },
  { id: 'west_kalimantan', name: 'West/Central Kalimantan', lat: -0.5, lng: 111.0 }
];

export const MONSOON_BASELINE_NODES = [
  { id: 'north_straits', name: 'Northern Malacca Straits', lat: 3.0, lng: 99.0, speedKm: 14, deg: 210, u: 7.0, v: 12.1 },
  { id: 'central_straits', name: 'Central Straits / Klang Valley', lat: 3.1, lng: 101.5, speedKm: 12, deg: 200, u: 4.1, v: 11.3 },
  { id: 'south_straits', name: 'Southern Straits / Johor', lat: 1.4, lng: 103.8, speedKm: 15, deg: 190, u: 2.6, v: 14.8 },
  { id: 'south_china_sea', name: 'South China Sea Basin', lat: 3.5, lng: 106.0, speedKm: 18, deg: 215, u: 10.3, v: 14.7 },
  { id: 'west_sarawak', name: 'Western Sarawak / Kuching', lat: 1.5, lng: 110.3, speedKm: 14, deg: 175, u: -1.2, v: 13.9 },
  { id: 'west_kalimantan', name: 'West/Central Kalimantan', lat: -0.5, lng: 111.0, speedKm: 16, deg: 165, u: -4.1, v: 15.5 }
];

export function getClimatologicalWindGrid() {
  return [...MONSOON_BASELINE_NODES];
}

export function interpolateWindVector(lat, lng, grid = []) {
  const activeGrid = Array.isArray(grid) && grid.length >= 2 ? grid : MONSOON_BASELINE_NODES;

  let totalWeight = 0;
  let weightedU = 0;
  let weightedV = 0;

  for (const node of activeGrid) {
    const dLat = lat - node.lat;
    const dLng = lng - node.lng;
    const distSq = dLat * dLat + dLng * dLng;

    if (distSq < 0.0001) {
      return {
        u: node.u,
        v: node.v,
        speedKm: node.speedKm,
        deg: node.deg
      };
    }

    const weight = 1 / (distSq + 0.05);
    totalWeight += weight;
    weightedU += node.u * weight;
    weightedV += node.v * weight;
  }

  const u = weightedU / totalWeight;
  const v = weightedV / totalWeight;
  const speedKm = +(Math.sqrt(u * u + v * v).toFixed(1));
  let headingRad = Math.atan2(u, v);
  let deg = Math.round((headingRad * 180 / Math.PI + 360) % 360);

  return { u, v, speedKm, deg };
}

export function calculatePlumeThreat(origin, hotspotCount = 0, windVector = null) {
  const vector = windVector || { u: 10, v: 12, speedKm: 15, deg: 210 };
  const speed = Math.max(5, vector.speedKm || 15);
  
  // Downwind heading is opposite to the meteorological wind origin
  const headingDeg = (vector.deg + 180) % 360;
  
  // Distance from fire cluster to Malaysian coastline
  const distToCoastKm = origin.name === 'Sumatra' ? 180 : 150;
  const etaHours = Math.max(1, Math.round(distToCoastKm / speed));

  // Check if heading points towards Malaysia (Northeast for Sumatra, North/Northwest for Kalimantan)
  let isPointingAtMalaysia = false;
  if (origin.name === 'Sumatra') {
    isPointingAtMalaysia = headingDeg >= 15 && headingDeg <= 110;
  } else {
    isPointingAtMalaysia = headingDeg >= 280 || headingDeg <= 45;
  }

  let threatLevel = 'safe';
  if (hotspotCount >= 100 && isPointingAtMalaysia) {
    threatLevel = 'severe';
  } else if (hotspotCount >= 40 && isPointingAtMalaysia) {
    threatLevel = 'elevated';
  }

  return {
    originName: origin.name,
    originLat: origin.lat,
    originLng: origin.lng,
    hotspotCount,
    headingDeg,
    arcDeg: 35,
    lengthKm: 280,
    speedKm: speed,
    etaHours,
    isPointingAtMalaysia,
    threatLevel,
    label: `${origin.name} Smoke Drift • ~${etaHours}h to coast (${speed} km/h)`
  };
}

export async function fetchRegionalWindGrid() {
  try {
    const lats = REGIONAL_NODES.map(n => n.lat.toFixed(2)).join(',');
    const lngs = REGIONAL_NODES.map(n => n.lng.toFixed(2)).join(',');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=wind_speed_10m,wind_direction_10m`;
    
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const items = Array.isArray(data) ? data : [data];
    return REGIONAL_NODES.map((node, i) => {
      const current = items[i]?.current || {};
      const speedKm = Math.round(current.wind_speed_10m || 12);
      const deg = Math.round(current.wind_direction_10m || 210);
      const rad = deg * Math.PI / 180;
      const u = +(-speedKm * Math.sin(rad)).toFixed(1);
      const v = +(-speedKm * Math.cos(rad)).toFixed(1);
      return { ...node, speedKm, deg, u, v };
    });
  } catch (err) {
    console.warn('Regional wind grid fetch failed, using monsoon baseline:', err.message);
    return getClimatologicalWindGrid();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/services/__tests__/windVectorService.test.js`  
Expected: PASS (all 3 tests pass)

- [ ] **Step 5: Commit Task 1**

```bash
git add src/services/windVectorService.js src/services/__tests__/windVectorService.test.js
git commit -m "feat(wind): implement regional 2D wind vector and plume threat service"
```

---

### Task 2: Store Integration in `src/stores/airQuality.js`

**Files:**
- Modify: `src/stores/airQuality.js:40-120`

**Interfaces:**
- Consumes: `fetchRegionalWindGrid`, `calculatePlumeThreat`, `getClimatologicalWindGrid` from `../services/windVectorService.js`
- Produces in state: `windFieldGrid`, `activePlumes`, `showWindOverlay`
- Produces actions: `loadRegionalWindGrid()`, `toggleWindOverlay(forceState?)`
- Produces getters: `isPlumeThreatActive`

- [ ] **Step 1: Import wind vector functions and declare store state**
- [ ] **Step 2: Add `loadRegionalWindGrid` and auto-activate when hotspots are elevated**
- [ ] **Step 3: Verify with existing unit tests**
- [ ] **Step 4: Commit Task 2**

```bash
git add src/stores/airQuality.js
git commit -m "feat(store): integrate regional wind grid and plume threat state"
```

---

### Task 3: Animated Canvas Overlay in `src/components/StationMapView.vue`

**Files:**
- Modify: `src/components/StationMapView.vue`

**Interfaces:**
- Consumes: `store.windFieldGrid`, `store.activePlumes`, `store.showWindOverlay`
- Renders: Synchronized HTML5 Canvas particle streamline ribbons and plume threat cones
- Adds: Map control pill `[💨 Wind & Smoke Plumes]`

- [ ] **Step 1: Implement custom Canvas layer on Leaflet**
- [ ] **Step 2: Add particle streamline physics engine (30–40 fps capped, responsive count)**
- [ ] **Step 3: Add smoke threat dispersion cones radiating from Sumatra and Kalimantan**
- [ ] **Step 4: Add control toggle button and cleanup on destroy**
- [ ] **Step 5: Verify build with `npm run build`**
- [ ] **Step 6: Commit Task 3**

```bash
git add src/components/StationMapView.vue
git commit -m "feat(ui): add animated wind streamlines and smoke threat cones to Leaflet map"
```

---

### Task 4: Hotspot Widget Cross-Linking & Locales

**Files:**
- Modify: `src/components/HazeHotspotWidget.vue`
- Modify: `src/locales/en.json`

**Interfaces:**
- Consumes: `store.toggleWindOverlay`, `store.showWindOverlay`
- Renders: Action button `[📍 View Drift on Map ↗]` in the trajectory card

- [ ] **Step 1: Add localization keys in `src/locales/en.json` (`windOverlay`, `viewDriftOnMap`, `threatCone`)**
- [ ] **Step 2: Add `[📍 View Drift on Map ↗]` button in `HazeHotspotWidget.vue`**
- [ ] **Step 3: Commit Task 4**

```bash
git add src/components/HazeHotspotWidget.vue src/locales/en.json
git commit -m "feat(ui): cross-link hotspot widget to wind and smoke plume map view"
```

---

### Task 5: End-to-End Build, Verification & Documentation

**Files:**
- Modify: `walkthrough.md`
- Modify: `task.md`

- [ ] **Step 1: Run all unit tests: `node --test src/services/__tests__/*.test.js`**
- [ ] **Step 2: Run production build: `npm run build`**
- [ ] **Step 3: Update `walkthrough.md` and `task.md`**
- [ ] **Step 4: Commit and finalize**
