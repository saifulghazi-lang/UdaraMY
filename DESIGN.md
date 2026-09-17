---
name: UdaraMY
description: Malaysia's real-time air quality and haze health monitor for everyday citizens — actionable, clinical, and precise in daylight and at midnight.
colors:
  paper-bg: "#f8fafc"
  surface-light: "#ffffff"
  surface-light-inset: "#f1f5f9"
  border-light: "#e2e8f0"
  border-light-strong: "#cbd5e1"
  text-light-primary: "#0f172a"
  text-light-secondary: "#475569"
  text-light-muted: "#94a3b8"
  void-black: "#000000"
  surface-raised: "#0a0a0a"
  surface-muted: "#171717"
  border-dark: "rgba(255,255,255,0.10)"
  border-dark-faint: "rgba(255,255,255,0.06)"
  text-dark-primary: "#ffffff"
  text-dark-secondary: "#cbd5e1"
  text-dark-muted: "#94a3b8"
  accent-indigo: "#6366f1"
  accent-indigo-hover: "#4f46e5"
  accent-indigo-deep: "#4338ca"
  status-good: "#00d2ff"
  status-good-secondary: "#0284c7"
  status-moderate: "#10b981"
  status-moderate-secondary: "#059669"
  status-unhealthy: "#f59e0b"
  status-unhealthy-secondary: "#d97706"
  status-very-unhealthy: "#ef4444"
  status-very-unhealthy-secondary: "#b91c1c"
  status-hazardous: "#881337"
  status-hazardous-secondary: "#4c0519"
  community-purple: "#a855f7"
  community-purple-light: "#c084fc"
typography:
  display:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(2.5rem, 8vw, 4rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Code', monospace"
    fontSize: "0.625rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.25rem"
  2xl: "1rem"
  3xl: "1.5rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.25rem"
  xl: "1.5rem"
  2xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.accent-indigo}"
    textColor: "{colors.text-dark-primary}"
    rounded: "{rounded.xl}"
    padding: "0.5rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.accent-indigo-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-light-secondary}"
    rounded: "{rounded.xl}"
    padding: "0.375rem 0.75rem"
  chip-default:
    backgroundColor: "transparent"
    textColor: "{colors.text-light-secondary}"
    rounded: "{rounded.full}"
    padding: "0.375rem 0.75rem"
  chip-active:
    backgroundColor: "{colors.accent-indigo}"
    textColor: "{colors.text-dark-primary}"
    rounded: "{rounded.full}"
    padding: "0.375rem 0.75rem"
  card-surface:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-light-primary}"
    rounded: "{rounded.3xl}"
    padding: "{spacing.xl}"
  input-search:
    backgroundColor: "{colors.surface-light-inset}"
    textColor: "{colors.text-light-primary}"
    rounded: "{rounded.2xl}"
    padding: "0.5rem 0.75rem 0.5rem 2.25rem"
  community-badge:
    backgroundColor: "rgba(168,85,247,0.15)"
    textColor: "{colors.community-purple}"
    rounded: "{rounded.full}"
    padding: "0.25rem 0.625rem"
---

# Design System: UdaraMY

## Overview

**Creative North Star: "The Clinical Instrument"**

UdaraMY is a civic health instrument engineered for Malaysian citizens, parents, and healthcare personnel. It is not an ambient weather widget or a playful consumer toy; it is an authoritative public decision surface. Whether evaluated under the tropical noon sun or checked at midnight in a dark bedroom before opening windows, every pixel must communicate precision, reliability, and calm authority.

The system is built on a **Dual-Theme Paradigm**:
- **Daylight Mode (Default):** A pristine, crisp clinical environment (`bg-slate-50` with pure white cards and precision `border-slate-200/80` borders). High legibility under bright ambient light, mirroring modern medical instrumentation and official scientific dashboards.
- **Night / Midnight Mode (AMOLED):** An uncompromised `#000000` AMOLED void where status signals, glowing gauge arcs, and neon measurement readouts float without visual noise or battery waste.

Typography is disciplined, compact, and bilingual (Bahasa Melayu / English). Measurements are heroic; narrative labels defer to them. Monospace font stacks govern data values (API numerals, PM2.5 concentrations, relative humidity, distance, timestamps) because monospace communicates empirical measurement rather than styling.

**Key Characteristics:**
- **Dual-Fidelity Theme:** Clean clinical white/slate daylight default with an authentic `#000000` AMOLED dark mode.
- **Strict 5-Tier Status Palette:** Cyan (Good) → Emerald (Moderate) → Amber (Unhealthy) → Red (Very Unhealthy) → Crimson (Hazardous).
- **Measurement-First Monospace:** All numerical readings, coordinates, distances, and timestamps rendered in tabular monospace.
- **Distinct Community Tier:** Verified government stations (JAS / APIMS) use solid rings and official badges; crowdsourced citizen sensors (OpenAQ / AirGradient / PurpleAir) use purple accenting, dashed borders, and clear humidity-calibration disclosure.
- **Civic Heritage:** Micro-vector Malaysian state flags (`StateFlag.vue`) anchor regional identity across all 14 states and Federal Territories.

## Colors

The palette is engineered with clear separation between navigation affordances, semantic data states, and civic categorization.

### Primary
- **Navigation Indigo** (`#6366f1` / `#4f46e5`): Exclusive to interactive navigation controls (active navigation pills, focused station rings, primary action buttons). Never used for air quality status.

### Secondary
- **Air Quality Status Spectrum (Official Malaysian APIMS Standards):**
  - **Status Good / Baik** (`#00d2ff` primary, `#0284c7` secondary): API 0–50. Cyan glow.
  - **Status Moderate / Sederhana** (`#10b981` primary, `#059669` secondary): API 51–100. Emerald signal.
  - **Status Unhealthy / Tidak Sihat** (`#f59e0b` primary, `#d97706` secondary): API 101–200. Amber warning.
  - **Status Very Unhealthy / Sangat Tidak Sihat** (`#ef4444` primary, `#b91c1c` secondary): API 201–300. Vivid red alert.
  - **Status Hazardous / Berbahaya** (`#881337` primary, `#4c0519` secondary): API 301+. Deep crimson emergency.

### Tertiary
- **Community Sensor Accents** (`#a855f7` Purple, `#c084fc` Lavender): Reserved strictly for crowdsourced citizen sensors (OpenAQ, AirGradient, PurpleAir) to distinguish unvalidated community hardware from official government BAM-1020 monitors.
- **Signal Highlights:** Emerald (`#34d399`) for live pulsing telemetry; Amber (`#fbbf24`) for simulation mode and active regional advisories.

### Neutral
- **Light Theme (Daylight Default):**
  - Floor Background: `#f8fafc` (`bg-slate-50`)
  - Primary Surface: `#ffffff` (`bg-white`)
  - Elevated Inset: `#f1f5f9` (`bg-slate-100`)
  - Border Subtle: `#e2e8f0` (`border-slate-200`)
  - Border Strong: `#cbd5e1` (`border-slate-300`)
  - Text Primary: `#0f172a` (`text-slate-900`)
  - Text Secondary: `#475569` (`text-slate-600`)
  - Text Muted: `#94a3b8` (`text-slate-400`)
- **Dark Theme (AMOLED Midnight):**
  - Floor Background: `#000000` (`bg-black`)
  - Primary Surface: `#000000` (`bg-black` with `border-white/10`)
  - Elevated Inset: `#0a0a0a` (`bg-neutral-950`)
  - Border Subtle: `rgba(255,255,255,0.10)` (`border-white/10`)
  - Border Faint: `rgba(255,255,255,0.06)` (`border-white/[0.06]`)
  - Text Primary: `#ffffff` (`text-white`)
  - Text Secondary: `#cbd5e1` (`text-slate-300`)
  - Text Muted: `#94a3b8` (`text-slate-400`)

### Named Rules
**The Dual-Theme Fidelity Rule.** Light mode surfaces must remain crisp slate/white (`bg-slate-50` / `bg-white`); Dark mode surfaces must remain pure `#000000` AMOLED. No dark-gray or muddy slate washes are permitted in dark mode.

**The Signal Scarcity Rule.** Full-saturation status colors are reserved for the radial gauge arc, badge text, and live sensor pins. Card backgrounds and large containers use 10%–20% opacity tints so visual priority always belongs to the threat reading.

**The One Accent Rule.** Indigo (`#6366f1`) is exclusively for navigation, selection, and interactive triggers. It must never indicate air quality status.

**The Community Distinction Rule.** Community nodes must always be visually distinguished via purple tints (`#a855f7`) and dashed borders to uphold civic transparency regarding unvalidated crowdsourced data.

## Typography

**Display / Body Font:** Native system UI stack (`system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`) for instantaneous load, crisp rendering, and zero layout shift.
**Measurement / Mono Font:** Platform monospace (`ui-monospace, 'Cascadia Code', 'Fira Code', Menlo, monospace`) for all data points, distances, timestamps, and pollutant metrics.

### Hierarchy
- **Display** (black/900, `clamp(2.5rem, 8vw, 4rem)`, leading 1, tracking `-0.04em`): Center radial gauge integer. The primary visual anchor of the application.
- **Headline** (extrabold/800, `1.25rem` / 20px, leading 1.2, tracking `-0.02em`): Monitoring station name, national overview title, modal headings.
- **Title** (bold/700, `0.875rem` / 14px, leading 1.4, tracking `-0.01em`): Card section headers, widget titles, state names.
- **Body** (regular/400, `0.75rem` / 12px, leading 1.6): Health guidance paragraphs, station descriptions, advisory copy.
- **Label / Measurement** (bold/700 monospace, `0.625rem` / 10px to `0.75rem` / 12px, tracking `+0.08em`, uppercase): API values, raw/calibrated PM2.5, timestamps, distance badges, "LIVE / CACHED" tags.

### Named Rules
**The Number-First Rule.** In every card, the numerical measurement outranks narrative prose in visual hierarchy and weight.

**The Mono-as-Measurement Rule.** Monospace is strictly reserved for quantified measurements (API, µg/m³, km, °C, %, timestamps). Explanatory copy and UI buttons use system sans-serif.

## Layout

UdaraMY employs a responsive two-tab shell (Dashboard / Map) with a sticky top header and an adaptive navigation system (desktop pill tray vs. mobile bottom bar).

- **Grid Architecture:**
  - **Mobile (<1024px):** Single-column stacked layout with compact container padding (`p-3.5` to `p-4`) and fixed bottom navigation.
  - **Desktop (≥1024px):** 12-column split grid with equal `col-span-6` distribution on the dashboard (hero atmospheric stack on the left, telemetry & hotspots on the right). Max-width bounded to `max-w-5xl`.
  - **National Map View:** Expands to `max-w-7xl` with an adaptive 12-column layout (`col-span-7` or `col-span-8` for interactive Leaflet canvas, remainder for searchable station list).
- **Rhythm & Spacing:** Uniform `gap-4` to `gap-5` between major cards, `gap-2` to `gap-3` between sub-elements. Primary cards use `p-5 sm:p-6` internal padding.
- **Safe-Area Insets:** Mobile bottom bar adheres to `env(safe-area-inset-bottom)` to ensure zero clipping on iOS home indicators and Android navigation bars.

## Elevation & Depth

Depth is conveyed through subtle tonal contrasts, soft ambient shadows in light mode, and status glow in dark mode.

- **Light Mode Elevation:** Cards sit flat at rest with subtle 1px border (`border-slate-200`) and soft ambient shadows (`shadow-sm` on secondary cards, `shadow-xl` on the hero atmospheric card and modal sheets).
- **Dark Mode Elevation:** Cards sit on the pure AMOLED `#000000` void. Depth is established through 1px `border-white/10` and perceptual elevation of inset inputs (`#0a0a0a`).
- **Status Glow:** Data urgency generates status-reactive glow:
  - SVG `feDropShadow` on the radial gauge arc matching the active category color.
  - Colored focus rings (`ring-1 ring-cyan-500/40 shadow-sm`) on active station selections.

### Named Rules
**The Flat-at-Rest Rule.** Modals, list items, and cards use flat, crisp borders at rest. Shadows and glows emerge only as state reactions (hover, selection, or alert escalation).

## Shapes

- **Primary Card Radius — `rounded-3xl` (1.5rem / 24px):** Hero AtmosphericCard, map container, modal dialogs, and major section panels.
- **Secondary Surface Radius — `rounded-2xl` (1rem / 16px):** Search input fields, inner telemetry boxes, station list items, and watchlist pills.
- **Interactive Control Radius — `rounded-xl` (0.75rem / 12px):** Action buttons, quick-filter chips, and sort controls.
- **Badge / Pill Radius — `rounded-full` (9999px):** Status badges, distance pills, live indicators, and circular map pins.
- **Border Grammar:**
  - Standard elements: Solid 1px border (`border-slate-200` in light, `border-white/10` in dark).
  - Community elements: Dashed 2px border (`border-2 border-dashed border-purple-500/70`) on map pins and cards.

## Components

### Buttons
- **Primary Action (Indigo Fill):** `bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition active:scale-95`.
- **Secondary Ghost Control:** Light: `bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 rounded-xl`. Dark: `dark:bg-neutral-950 dark:border-white/10 dark:text-slate-300 dark:hover:bg-black rounded-xl`.

### Chips & Filter Pills
- **Container Tray:** Rounded pill container (`rounded-full p-1 border border-slate-200 dark:border-white/10`).
- **Active Filter Chip:** `bg-indigo-600 text-white rounded-full font-medium shadow-sm`.
- **Inactive Filter Chip:** `text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white`.

### Cards & Containers
- **Primary Hero Card:** Light: `bg-white border-slate-200/80 shadow-xl rounded-3xl p-5 sm:p-6`. Dark: `dark:bg-black dark:border-white/10 dark:shadow-2xl`.
- **Telemetry Widget Cards:** Compact `rounded-3xl` containers with internal divider lines (`border-t border-slate-100 dark:border-white/[0.06]`).

### Radial Gauge (Signature Component)
- 256px responsive SVG gauge featuring an outer reference tick ring, background track arc, dynamic SVG gradient arc animated over 700ms, and ambient particle animations floating above the status readout.

### Community Sensor Cards
- Cards tagged with `👥 Komuniti`, sensor hardware model (AirGradient / PurpleAir), contributor affiliation, dual raw vs. EPA-calibrated PM2.5 metrics, and relative humidity percentage.

### State Flags (Civic Component)
- Clean vector SVG flags rendered at `w-6 h-4` with subtle `rounded-[3px]` and a 1px protective perimeter stroke for high contrast on both light and dark backgrounds.

### Leaflet Map Popups
- Embedded popup cards with auto-pan padding, high-contrast typography, category API indicators, and direct station selection buttons (`Pilih Stesen` and `Papan Pemuka`).

## Do's and Don'ts

### Do:
- **Do** respect the user's active theme: clean clinical slate/white in Light Mode (`bg-slate-50`, `border-slate-200`), pure `#000000` AMOLED in Dark Mode (`dark:bg-black`, `dark:border-white/10`).
- **Do** use monospace typography (`font-mono`) for all quantitative metrics (API values, PM2.5 concentrations, coordinates, distances, timestamps).
- **Do** clearly distinguish community sensor data with purple tags (`#a855f7`), dashed borders, and EPA humidity calibration disclosures.
- **Do** maintain the 5-tier APIMS status color mapping without deviation: Cyan (Good) → Emerald (Moderate) → Amber (Unhealthy) → Red (Very Unhealthy) → Crimson (Hazardous).
- **Do** preserve 1px crisp borders on cards and interactive elements across all breakpoints.

### Don't:
- **Don't** use dark gray (`#1e293b` or `#334155`) as card or page backgrounds in Dark Mode; dark mode must remain authentic `#000000` AMOLED.
- **Don't** use Navigation Indigo (`#6366f1`) to represent air quality or pollution levels; Indigo is reserved strictly for navigation.
- **Don't** display uncalibrated raw community sensor readings as equivalent to official JAS APIMS values without noting calibration status.
- **Don't** apply decorative gradient text to body copy or measurements.
- **Don't** use emoji as interactive action button icons; interactive buttons must use clean Lucide SVG icons.
