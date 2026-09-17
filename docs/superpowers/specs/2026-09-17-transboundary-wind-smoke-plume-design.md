# Transboundary Wind & Smoke Plume Vector Overlay: Design Specification

**Date:** 2026-09-17  
**Status:** Approved  
**Author:** UdaraMY Architecture Team  

---

## 1. Executive Summary & Purpose

During Southeast Asian haze crises, citizen concern shifts from retrospective statutory averages to **prospective atmospheric trajectory**:
> *"Is the prevailing wind blowing satellite fire smoke from Sumatra or Kalimantan towards my city, or is it safely drifting offshore?"*

This specification defines the architectural design for the **Transboundary Wind & Smoke Plume Vector Overlay** in UdaraMY:
1. **Regional 2D Vector Field:** Continuous wind velocity interpolation across the Straits of Malacca, Peninsular Malaysia, the South China Sea, and Borneo.
2. **Animated Particle Streamline Engine:** Lightweight, GPU-friendly HTML5 Canvas overlay synchronized with Leaflet providing silky wind animations (30–40 fps capped, $<1.5\%$ mobile CPU).
3. **Smoke Dispersion Cones & ETA Horizon:** Downwind threat cones radiating from ASMC satellite fire clusters with real-time arrival estimates (e.g. *"Sumatra Smoke Drift: ~6h to Klang Valley at 18 km/h"*).
4. **Context-Aware Auto-Activation:** Automatically engages when satellite hotspots spike (`Sumatra > 50` or `Kalimantan > 100`), with manual one-tap toggling and cross-linking from the Hotspot Widget.

---

## 2. System Architecture & Components

```
┌────────────────────────────────────────────────────────┐
│             External Meteorological Feeds              │
│  - ASMC NOAA-20 Satellite Hotspot Counts (Daily)       │
│  - Open-Meteo 10m & 850hPa Regional Wind Grid (Hourly) │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           src/services/windVectorService.js            │
│  - Ingests regional grid (Sumatra, Straits, Borneo)    │
│  - 2D Bilinear Vector Interpolation [u(x,y), v(x,y)]   │
│  - Calculates downwind plume dispersion arcs & ETAs    │
│  - Climatological monsoon fallbacks (SW/NE Monsoon)    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               src/stores/airQuality.js                 │
│  - State: windFieldGrid, activePlumes, showWindOverlay │
│  - Actions: fetchRegionalWindGrid(), toggleWindLayer() │
│  - Getters: isPlumeAlertActive                         │
└───────────────────────────┬────────────────────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         ▼                                     ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│  src/components/             │ │  src/components/             │
│  StationMapView.vue          │ │  HazeHotspotWidget.vue       │
│  - Leaflet HTML5 Canvas Layer│ │  - Direct "View Drift on     │
│  - Particle Streamline Engine│ │    Map" deep-link pill       │
│  - Threat Dispersion Cones   │ │  - Prevailing corridor badge │
│  - Interactive ETA markers   │ │                              │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## 3. Mathematical & Data Model

### 3.1 Regional Meteorological Grid Nodes
We sample 6 regional control points covering transboundary corridors:
1. **North Sumatra / Northern Malacca Straits:** `(3.0°N, 99.0°E)`
2. **Central Straits / Klang Valley Corridor:** `(3.1°N, 101.5°E)`
3. **Southern Straits / Johor & Singapore:** `(1.4°N, 103.8°E)`
4. **South China Sea Basin:** `(3.5°N, 106.0°E)`
5. **Western Sarawak / Kuching Corridor:** `(1.5°N, 110.3°E)`
6. **West/Central Kalimantan:** `(0.5°S, 111.0°E)`

### 3.2 2D Bilinear Vector Interpolation
For any geographic point $P(\phi, \lambda)$ (latitude, longitude) within bounding nodes, the vector velocity $(u, v)$ is calculated via inverse-distance bilinear interpolation:
$$w_i = \frac{1}{d(P, N_i)^2 + \epsilon}$$
$$u(P) = \frac{\sum w_i u_i}{\sum w_i}, \quad v(P) = \frac{\sum w_i v_i}{\sum w_i}$$
Where $u = -S \sin(\theta)$ and $v = -S \cos(\theta)$ for wind speed $S$ and meteorological direction $\theta$.

### 3.3 Smoke Plume Threat Cones & ETA
For each active fire cluster (Sumatra origin: `(0.5°N, 101.5°E)`, Kalimantan origin: `(1.0°S, 111.5°E)`):
1. **Dispersion Cone Arc:** Radiates $35^\circ$ downwind along the local $(u, v)$ heading vector for $300\text{ km}$.
2. **Impact Assessment:** Tests whether the downwind cone intersects the Malaysian coastline (Peninsular West Coast or Western Sarawak).
3. **Estimated Time of Arrival (ETA):**
   $$\text{ETA} = \max\left(1, \operatorname{round}\left(\frac{D_{\text{coastline}}}{S_{\text{mean}}}\right)\right) \text{ hours}$$
4. **Threat Level:**
   - **Severe Alert (Rose):** Hotspots $> 150$ and vector pointed directly at Malaysian land.
   - **Elevated Watch (Amber):** Hotspots $> 50$ with drifting trajectory.
   - **Offshore Safe (Teal/Neutral):** Wind vector blowing offshore/away from Malaysian borders.

---

## 4. Canvas Rendering Engine & Particle Lifecycle

### 4.1 Leaflet Canvas Integration
* A transparent `<canvas>` element mounted as a custom Leaflet overlay layer.
* Synchronized with Leaflet's `zoomstart`, `zoomend`, `move`, and `viewreset` events.
* Redraws on screen coordinate transformations using `map.latLngToContainerPoint()`.

### 4.2 Particle Streamline Physics
* **Particle Count:** 100–120 on desktop, 50–60 on mobile/small viewports.
* **Lifespan:** Random duration between 40 to 90 animation ticks. When expired, respawned at a random position within the current map bounding box.
* **Motion Vector:** In each frame, each particle advances by:
  $$\Delta x = u(\text{lat}, \text{lng}) \times \text{scale}$$
  $$\Delta y = -v(\text{lat}, \text{lng}) \times \text{scale}$$
* **Visual Trail:** The canvas is overlaid with a subtle fade rect (`rgba(15, 23, 42, 0.08)` in dark mode) creating glowing streamline trails without memory leaks.

### 4.3 Smoke Dispersion Cones
* Rendered as semi-transparent illuminated radial gradient cones originating from fire centroids.
* Pulsing boundary highlight along active threat corridors.
* Overlay badges on the map at the cone head showing:
  `[🔥 Sumatra Smoke Drift • ~6h to Klang Valley (18 km/h SSW)]`

---

## 5. UI Controls & User Experience

### 5.1 Auto-Activation & Map Toggle
* When `hotspots.sumatra > 50` or `hotspots.kalimantan > 100`, the layer automatically enables on first load.
* A prominent pill in the map controls:
  `[💨 Wind & Smoke Plume]`
  - Active: `bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm`
  - Inactive: `bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10`
* Tapping immediately clears the canvas and stops the animation loop.

### 5.2 Hotspot Widget Cross-Linking
* In `src/components/HazeHotspotWidget.vue`, the trajectory row adds a direct action button:
  `[📍 View Drift on Map ↗]`
* Tapping updates `store.selectedNav = 'map'`, enables `showWindOverlay = true`, and smoothly centers Leaflet on the Malacca Straits / Sarawak corridor.

---

## 6. Error Handling & Offline Reliability

1. **Network Failure / Rate Limits:** If Open-Meteo requests fail, the system falls back to regional climatological monsoon baseline vectors (Southwest Monsoon / Northeast Monsoon models) with zero user error notices.
2. **Stale Hotspot Data:** Uses cached ASMC counts with local timestamp indicator.
3. **Tab Inactivity:** Disables `requestAnimationFrame` when the map is not in the active viewport, conserving mobile battery and CPU.

---

## 7. Verification & Testing Strategy

* **Unit Tests (`src/services/__tests__/windVectorService.test.js`):**
  - Verify vector interpolation across regional grid coordinates.
  - Verify smoke cone angle and ETA calculation.
  - Verify graceful fallback on invalid/empty coordinates.
* **Performance Benchmark:**
  - Map drag/zoom maintains $\ge 50$ fps on desktop and $\ge 30$ fps on mobile.
  - CPU usage remains $< 1.5\%$ when wind layer is actively rendering.
* **Production Build:**
  - Pass `npm run build` with zero compiler errors.
