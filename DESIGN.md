---
name: UdaraMY
description: Malaysia's real-time air quality and haze health monitor for everyday citizens — actionable, precise, and calm at midnight.
colors:
  void-black: "#000000"
  surface-raised: "#0a0a0a"
  surface-muted: "#171717"
  border-subtle: "rgba(255,255,255,0.10)"
  border-faint: "rgba(255,255,255,0.06)"
  text-primary: "#ffffff"
  text-secondary: "#e2e8f0"
  text-muted: "#94a3b8"
  text-dim: "#64748b"
  accent-indigo: "#6366f1"
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
  signal-cyan: "#22d3ee"
  signal-emerald: "#34d399"
  signal-amber: "#fbbf24"
  signal-rose: "#fb7185"
  signal-violet: "#a78bfa"
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
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "0.375rem 0.875rem"
  button-primary-hover:
    backgroundColor: "{colors.accent-indigo-deep}"
  button-ghost:
    backgroundColor: "{colors.void-black}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.xl}"
    padding: "0.375rem 0.75rem"
  button-ghost-hover:
    backgroundColor: "{colors.surface-muted}"
  chip-default:
    backgroundColor: "{colors.void-black}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.full}"
    padding: "0.375rem 0.75rem"
  chip-active:
    backgroundColor: "{colors.void-black}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.full}"
    padding: "0.375rem 0.75rem"
  card-surface:
    backgroundColor: "{colors.void-black}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.3xl}"
    padding: "{spacing.xl}"
  input-search:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.2xl}"
    padding: "0.5rem 0.75rem 0.5rem 2.25rem"
---

# Design System: UdaraMY

## Overview

**Creative North Star: "The Night Clinic"**

UdaraMY is a civic health instrument designed to be trusted at midnight. Not a weather widget. Not a data dashboard. A clinical decision surface — the kind of thing a parent looks at before deciding whether to let their child run outside, or a healthcare worker checks before advising a patient. That civic weight is the design brief. Every choice must earn the user's trust under low-ambient-light conditions, on a glowing phone screen in the dark.

The visual language is built on a single premise: darkness is not decoration, it is the working environment. The `#000000` AMOLED void is not a color choice — it is the canvas every signal is written against. The pulsing neon gauge arc, the luminous API numeral, the cyan GPS icon: these glow precisely because they have nothing competing with them. When air quality deteriorates, the system shifts from cyan through amber to crimson; the user's eye learns this vocabulary faster than any legend because the hue is the threat level.

Typography is disciplined, compact, and bilingual. Numbers are the hero; labels are subservient to them. Monospace font stacks appear wherever data precision is conveyed — timestamps, API readings, distance badges — because monospace signals measurement, not style.

**Key Characteristics:**
- Pure AMOLED black (`#000000`) canvas throughout — no dark-gray washes, no muddy blur backgrounds
- Status-reactive ambient neons: Cyan (Good) → Emerald (Moderate) → Amber (Unhealthy) → Red (Very Unhealthy) → Crimson (Hazardous)
- Monospace numerals and labels wherever precision matters (readings, timestamps, distances)
- `border-white/10` as the universal separator — thin, crisp, never gray
- Radial gauge as the product's signature object: glowing, physically weighted, the single most important visual

## Colors

The palette is a dark void with precisely five status signal colors and one navigation accent. Every color earns its presence.

### Primary
- **Navigation Indigo** (`#6366f1`): Exclusive to active navigation states (selected tab fill, active station ring, focus highlights). Never used for data status.

### Secondary
- **Cyan Pulse** (`#00d2ff`): The default "all-clear" status signal and the primary icon tint across the interface. The color of the gauge at healthy API levels. Also used for GPS/locate icons and active persona ring.
- **Status Gradient Secondaries** (`#0284c7`, `#059669`, `#d97706`, `#b91c1c`, `#4c0519`): Paired with their primaries to form the radial gauge arc gradients — never used stand-alone.

### Tertiary
- **Signal Palette** (Emerald `#34d399`, Amber `#fbbf24`, Rose `#fb7185`, Violet `#a78bfa`): Used at 20–30% opacity (`/20` tint) for semantic chip backgrounds and status badge surfaces. Their full-opacity versions appear only in badge text and icon fills.

### Neutral
- **The Void** (`#000000`): The entire surface substrate. Every card, modal, nav bar, and page background.
- **Surface Raised** (`#0a0a0a`): Subtly elevated surfaces within cards — search inputs, stat group backgrounds — distinguished from the void floor by perception rather than contrast.
- **Surface Muted** (`#171717`): Hover state for ghost buttons and station list items. One step above `surface-raised`.
- **Border Subtle** (`rgba(255,255,255,0.10)`): Universal separator. Card edges, input strokes, modal outlines.
- **Border Faint** (`rgba(255,255,255,0.06)`): Internal section dividers within a card.
- **Text Primary** (`#ffffff`): Station names, API numerals, headings, active states.
- **Text Secondary** (`#e2e8f0`): Body content, card paragraph text.
- **Text Muted** (`#94a3b8`): Labels, secondary identifiers, timestamp footers.
- **Text Dim** (`#64748b`): Placeholder text, disabled states, low-priority annotations.

### Named Rules
**The Void Purity Rule.** No surface is ever a gray or slate color. `#000000` is the floor. `#0a0a0a` is the only permitted "elevation" inside a card. Anything warmer or lighter is a semantic tint, not a surface.

**The Signal Scarcity Rule.** Status colors appear at full opacity only in the gauge arc, badge text, and icon fills. Everywhere else they appear as 20–30% opacity tints. Their rarity is the instrument's calibration — when something glows at full saturation, the user's eye has learned to read it as alarm-level information.

**The One Accent Rule.** Navigation Indigo (`#6366f1`) is the only non-status accent in the system. It covers selected nav tabs, active station rings, and focus indicators. It never indicates air quality. These two vocabularies must never collide.

## Typography

**Display / Body Font:** System UI stack (`system-ui, -apple-system, 'Segoe UI', sans-serif`) — the platform's own typeface at every weight, variable-weight-capable.
**Mono Font:** Platform monospace (`ui-monospace, 'Cascadia Code', 'Fira Code', monospace`) — used for all readings, timestamps, distances, and categorical labels.

**Character:** Undecorated precision. The system makes no typographic statement — it defers entirely to the numbers. The system-ui stack is intentional: on AMOLED screens in dark mode, native platform fonts render with subpixel clarity that no web font can match. Monospace carries the semantic weight that says *measurement, not story*.

### Hierarchy
- **Display** (black/900, ~`clamp(2.5rem, 8vw, 4rem)`, leading 1, tracking `-0.04em`): The API numeral at the center of the radial gauge. Single use. The entire interface exists to make this number legible.
- **Headline** (extrabold/800, `1.25rem`, leading 1.2, tracking `-0.02em`): Station name in the card header. Section titles in the HazeHotspot widget. Used sparingly.
- **Title** (bold/700, `0.875rem`, leading 1.4, tracking `-0.01em`): Card header titles, modal headings, widget titles in uppercase monospace.
- **Body** (regular/400, `0.75rem`, leading 1.6): Guidance text, description paragraphs, station list secondary info.
- **Label** (bold/700 monospace, `0.625rem`, leading 1.2, tracking `+0.08em`, ALL CAPS): Status badges, "LIVE / CACHED" indicators, pollutant names, distance readouts. The voice of measurement.

### Named Rules
**The Number-First Rule.** The API integer is the visual center of every dashboard view. Typography hierarchy arranges itself around making that number read fastest. Section headings are structurally useful but visually subordinate.

**The Mono-as-Measurement Rule.** Monospace is never used as a "techy aesthetic." It appears only where the value is a measurement: readings, timestamps, distance in km, pollutant concentrations, and monitoring station IDs. Copy and labels use system-ui.

## Layout

UdaraMY uses a two-tab shell (Dashboard / Map) with a persistent sticky header and a mobile-only bottom navigation bar. The main content body is width-constrained to `max-w-5xl` on the dashboard and `max-w-7xl` on the map view.

**Dashboard grid:** A single-column layout on mobile; a 12-column CSS grid at `lg` breakpoints split into two equal `lg:col-span-6` columns — left for the live card stack (AtmosphericCard + HealthAdvicePanel), right for the telemetry stack (TrendChart + HazeHotspotWidget + PollutantBars). The seasonality calendar occupies full width below.

**Spacing rhythm:** `gap-5` (1.25rem) between major sections, `gap-3` to `gap-3.5` within card interiors, `p-5 sm:p-6` card internal padding on the primary cards.

**Responsive changes:**
- Mobile: single-column, bottom nav bar, compact padding (`p-3`), vertically stacked cards.
- Tablet/Desktop: `md+` hides the bottom nav; the sticky header shows the desktop nav pill; cards sit side-by-side.
- Map view expands to `max-w-7xl` and a `lg:grid-cols-12` split (col 7/8 map, col 5/4 station list).

**Safe-area awareness:** Bottom nav uses `pb-[max(0.75rem,env(safe-area-inset-bottom))]`; main content uses `pb-[calc(5.5rem+env(safe-area-inset-bottom))]` on mobile.

## Elevation & Depth

The system combines three depth strategies: flat void surfaces, deep ambient shadow on the hero card, and status glow as the primary state signal.

**Flat-by-default:** All secondary cards, modals, list items, and nav bars sit on `#000000` with no shadow. Depth between surfaces is communicated through `border-white/10` edges and the step from `#000000` to `#0a0a0a` for elevated insets (search inputs, stat bars).

**Hero ambient weight:** The AtmosphericCard uses `shadow-2xl` (`0 25px 50px -12px rgba(0,0,0,0.9)`) to give the gauge panel perceptual mass — a sense that it occupies a different physical plane than the page beneath it. This shadow is too dark to read as conventional elevation; it works as a presence weight.

**Status glow:** Active states and data-reactive alerts produce colored glow effects — not shadows in the design-system sense, but SVG `feDropShadow` on the gauge arc, `ring-1 ring-cyan-500/40 shadow-md shadow-cyan-500/20` on active persona cards, and `shadow-md shadow-indigo-950/50` on selected station items. These are status signals, not depth tokens.

### Shadow Vocabulary
- **Hero Weight** (`box-shadow: 0 25px 50px -12px rgba(0,0,0,0.9)`): The AtmosphericCard and map container only. Grounds the primary instrument.
- **Gauge Glow** (SVG `feDropShadow`, `stdDeviation=3`, flood-color = current category color, `flood-opacity=0.5`): The active arc of the radial gauge. Status-reactive; changes color with API level.
- **Active Ring Glow** (`ring-1 ring-{status}/40 shadow-md shadow-{status}/20`): Selected persona cards, active watchlist pills, focused station items.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. No shadow appears on a card, modal, or list item at rest. Elevation enters only in two forms: the hero card's ambient weight (which gives the gauge physical presence) and status glow (which signals interaction or urgency).

## Shapes

The form language is consistently rounded, never sharp, never decorative.

**Primary radius — `rounded-3xl` (1.5rem):** The outermost shape of every primary card (AtmosphericCard, HealthAdvicePanel, TrendChart, HazeHotspotWidget, HazeCalendarGrid) and the map container. This is the dominant surface radius.

**Secondary radius — `rounded-2xl` (1rem):** Station list items, search inputs, modal inner sections, watchlist pills with content, filter chip groups. One step inward from primary.

**Tertiary radius — `rounded-xl` (0.875rem–0.75rem):** Buttons (primary and ghost), sort toggle chips, header action buttons. Tight enough to read as controls rather than surfaces.

**Full pill — `rounded-full`:** Distance badges, "LIVE" status pills, category signal badges, watchlist station pills. Indicates a label/tag object, not a container.

**Borders:** Always `border-white/10` (1px, rgba(255,255,255,0.10)) for card edges and modal borders. Hover states lift to `border-white/20` or `border-white/25`. Internal dividers use `border-white/[0.06]`.

### Named Rules
**The No-Sharp-Corner Rule.** No element in the system uses `rounded-none` or `rounded-sm` unless it is an SVG internal path. All interactive and container elements are at minimum `rounded-xl`.

**The Single-Pixel Border Rule.** Borders are always 1px, always rgba(white, 0.10–0.25). Never a 2px border. Never a colored solid border except in status contexts (`border-cyan-400`, `border-indigo-500/70`) where the border IS the signal.

## Components

### Buttons

*Decisive and compact — controls that don't demand attention.*

- **Shape:** Tightly rounded (`rounded-xl`, 0.75rem), small padding, never pill-shaped.
- **Primary (Indigo fill):** `bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-4 py-2.5 font-bold text-xs`. Used only for primary CTA — native share action in the share modal.
- **Ghost (Standard):** `bg-black border border-white/10 text-neutral-300 hover:text-white hover:border-white/25 hover:bg-neutral-950 rounded-xl`. Universal secondary control: header action buttons, sort toggles, reset controls.
- **Icon-only Ghost:** Same ghost treatment, fixed `p-2` padding, icon at `w-4 h-4`.
- **Hover / Focus:** `hover:bg-neutral-950` (slightly lifted void), `hover:border-white/25` (brighter edge). Active state adds `active:scale-95`.
- **Disabled:** Opacity reduced implicitly; the `cursor-not-allowed` is the primary signal.

### Chips / Filter Pills

*Horizontal selector rows — region filters, layer toggles, sort buttons.*

- **Container:** `bg-black border border-white/10 rounded-2xl p-1` — a dark pill tray.
- **Inactive chip:** `text-neutral-400 hover:text-white`, no background fill, full-rounded or `rounded-xl`.
- **Active chip:** `bg-indigo-600 text-white shadow-sm rounded-xl` — indigo fill, same height as tray padding.
- **Watchlist pill (station):** `bg-black border-white/10 text-slate-300 rounded-2xl` inactive; `bg-black border-indigo-500 ring-1 ring-indigo-500/50 text-white` active.

### Cards / Containers

*The void with a border — not a material, a delineation.*

- **Corner Style:** `rounded-3xl` (1.5rem) — primary; `rounded-2xl` (1rem) — secondary/inner.
- **Background:** `bg-black` (#000000) always. Never `bg-neutral-900` or any gray at the card level.
- **Shadow:** `shadow-2xl` on the hero AtmosphericCard only. All other cards are shadowless.
- **Border:** `border border-white/[0.12]` on primary cards, `border border-white/10` on secondary cards.
- **Internal Padding:** `p-5 sm:p-6` (primary), `p-3.5` (secondary), `p-3` (compact widgets).
- **Internal Sections:** Separated by `border-t border-white/[0.06]`.

### Radial Gauge (Signature Component)

*The product's identity object. Everything else is context for this.*

The gauge lives inside a 224–256px (sm: 256px) square. Its anatomy:
1. **Outer tick ring:** SVG circle, `stroke="rgba(255,255,255,0.05)"`, `stroke-dasharray="2 6"` — subtle reference ticks at `r=54`.
2. **Inactive track:** `stroke="rgba(255,255,255,0.08)"`, `stroke-width=8`, 270° arc — the unfilled background.
3. **Active arc:** `stroke="url(#gaugeGradient)"`, `stroke-width=8.5`, fills proportionally with API value. Animated `transition-all duration-700 ease-out`. Carries an SVG `feDropShadow` glow in the current category color.
4. **Center readout:** The API integer in display-weight type (900, tracking `-0.04em`), colored to `categoryColor`. Below it: the category label (small-caps, tracking `0.2em`, muted). The value is the anchor; the label is the footnote.
5. **Particle float:** Four radial haze particles (`animate-particle`, 7s linear infinite) orbit the gauge perimeter, colored at the current status hue with 60% opacity.

### Inputs / Fields

- **Style:** `bg-neutral-950 border border-white/10 rounded-2xl` — one step above the void, clearly an interactive surface.
- **Focus:** `focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500`.
- **Placeholder:** `placeholder-neutral-500`.
- **Icon prefix:** Search/GPS icon at `w-4 h-4 text-neutral-500 absolute left-3 pointer-events-none`.

### Navigation

**Top header (sticky):** `bg-black/90 backdrop-blur-xl border-b border-white/[0.08]` — near-opaque black with heavy backdrop blur. The blur applies only here.
- Desktop nav pill: `bg-black border border-white/10 rounded-2xl p-1` tray with `rounded-xl` chips. Active: `bg-indigo-600`. Inactive: `text-slate-400 hover:text-white hover:bg-neutral-900`.

**Bottom nav (mobile, fixed):** `bg-black/95 backdrop-blur-2xl border-t border-white/[0.08]`. Four vertical icon+label buttons. Active icon: `text-indigo-400`. Inactive: `text-slate-400 hover:text-slate-200`.

### Status Badges / Pills

*The semantic layer — always small, always monospace.*

- **Live indicator dot:** `w-2 h-2 rounded-full bg-emerald-400 animate-pulse` when live; `bg-neutral-600` when cached.
- **Category badge:** `px-2 py-0.5 rounded-full font-mono text-[10px] font-bold` with `background: {categoryColor}20`, `color: {categoryColor}`, `border: 1px solid {categoryColor}44` — tinted background + full-opacity text + semi-transparent border.
- **Distance badge:** `px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 font-mono border border-white/10`.
- **Alert badge (school closure, simulation):** `bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse`.

## Do's and Don'ts

### Do:
- **Do** keep every surface `bg-black` (`#000000`). The void is the design. `bg-neutral-950` is permitted only for interactive inset elements (search inputs, inner stat surfaces) — never for card backgrounds.
- **Do** use `border-white/10` (1px, rgba white 10%) as the universal separator everywhere. Never a gray solid border at rest.
- **Do** express data status exclusively through the five API status colors (Cyan, Emerald, Amber, Red, Crimson). Indigo is navigation-only and must never overlap with data status.
- **Do** use monospace font stack for any numeral that represents a measurement — API values, distances in km, timestamps, pollutant concentrations.
- **Do** apply `rounded-3xl` to all primary card surfaces and `rounded-xl` to all button controls. The radius vocabulary must stay consistent.
- **Do** let color opacity do the work: status colors appear at 20–30% opacity for surface tints, full opacity only for text and icon fills.

### Don't:
- **Don't** use `bg-neutral-900`, `bg-slate-900`, or any gray/slate value as a card or modal background. The only permitted departure from `#000000` is `#0a0a0a` (`bg-neutral-950`) for inset elements.
- **Don't** apply the radial gauge glow pattern to any non-gauge element. The SVG `feDropShadow` status glow is the gauge's identity; reusing it on cards or buttons dilutes the instrument read.
- **Don't** use gradient text on any typographic element. Status comes from the UI layer (badge, gauge arc, border tint), not from CSS `background-clip: text`.
- **Don't** add decorative `border-left` or `border-right` accent stripes to cards, list items, or callouts. The system uses full-perimeter `border-white/10` borders only.
- **Don't** use emoji as the icon system for any interactive control. Emoji are permitted in data-display (watchlist station icons, persona labels) but Lucide SVG icons govern all interactive affordances.
- **Don't** place a backdrop blur on anything except the sticky header and bottom nav bar. Blur is used exactly twice in the system: once to freeze the header above scroll, once to frost the mobile bottom bar. Everywhere else is transparent.
