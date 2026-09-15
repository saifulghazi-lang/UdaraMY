# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Vue 3 (Composition API), Vite, Tailwind CSS, Leaflet, Lucide Icons, Vite-plugin-PWA (Workbox).

## Users
- **Primary:** Everyday Malaysians, parents, schools, caregivers, and outdoor workers checking daily air quality to make actionable health and lifestyle decisions (e.g. sending kids to school, drying laundry, wearing N95 masks, scheduling outdoor sports).
- **Secondary:** Vulnerable individuals with respiratory conditions (asthma) and elderly seniors susceptible to smoke inhalation and cardiovascular stress.

## Product Purpose
UdaraMY provides instantaneous, hyper-localized, and transboundary air quality insights specifically tailored for Malaysia. It bridges raw Department of Environment (DOE / JAS APIMS) sensor telemetry and ASMC satellite fire tracking with direct, plain-language health actions, actionable haze trajectories, and social awareness tools.

## Positioning
Unlike generic worldwide weather apps that show delayed, model-interpolated AQI or paid overseas services, UdaraMY directly ingests 100% official, real-time Malaysian DOE APIMS station data and ASEAN ASMC satellite fire tracking without paywalls, accounts, or tracking. It translates raw numbers into immediate Malaysian life decisions ("Dry laundry indoors", "Keep N95 ready", "Postpone school recess").

## Operating Context
- **Usage environments:** Fast mobile morning checks before school/work commutes, midday checks during active haze seasons (Southwest Monsoon August–October), social sharing to family WhatsApp groups and Instagram stories during pollution spikes.
- **Devices:** Mobile smartphones (PWA installable, iOS & Android browsers), tablets, and desktop workstations.

## Capabilities and Constraints
- **Capabilities:**
  - Real-time hourly API readings across all 68 DOE APIMS monitoring stations in Peninsular Malaysia, Sabah, and Sarawak.
  - Automatic geolocation with Haversine nearest-station matching and distance calculation.
  - Interactive Leaflet national map with live Canvas radial thermal heatmap plumes.
  - Multi-station Family Watchlist with persistent pinned locations (`localStorage`).
  - ASMC daily satellite hotspot tracking (Sumatra, Kalimantan, Malaysia) paired with Open-Meteo live wind telemetry and transboundary smoke trajectory forecasting.
  - Sensitive health vulnerability profiles (Toddler/Kids, Asthma, Elderly, Outdoor Worker).
  - 365-day annual haze seasonality heatmap grid.
  - In-browser Instagram Story (9:16) and WhatsApp Square (1:1) share card generation.
  - True AMOLED pure black (`#000000`) theme with neon atmospheric glow.
  - Full bilingual localization in Bahasa Melayu and English.
- **Constraints:**
  - Exclusively Malaysia-focused; relies only on free public data sources (DOE APIMS, ASMC, Open-Meteo).
  - Zero paid API keys, zero user logins or backend databases required; fully client-side PWA.

## Brand Commitments
- **Name:** UdaraMY
- **Voice:** Clear, calm, protective, authoritative, and citizen-friendly. Translates technical environmental terms into direct practical advice.
- **Visual Language:** True AMOLED pure black (`#000000`) canvas accented by luminous atmospheric status neons (Cyan, Emerald, Amber, Crimson, Violet) and subtle `border-white/10` borders.

## Evidence on Hand
- Live DOE APIMS feed: `https://eqms.doe.gov.my/api3/publicportalapims/apitablehourly` (proxied via Vite `/api3`).
- Official ASMC satellite hotspot feed: `https://asmc.asean.org/files/msscommunity/hotspots/DailyJP1NOAA20.*.txt` (proxied via Vite `/asmc`).
- Open-Meteo free wind API (`https://api.open-meteo.com/v1/forecast`).
- App icon and manifest assets: `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/apple-touch-icon.png`.

## Product Principles
1. **Real Data Over Estimates:** Always source official ground-truth DOE and ASMC sensors rather than smoothed global weather models.
2. **Actionable Health Over Raw Numbers:** Numbers like "API 112" mean little to a parent without immediate practical context (masks, school recess, laundry, ventilation).
3. **Zero Friction & Offline First:** Load instantly without signups, cookies, or ads. Cache latest readings for reliable offline access.
4. **Inclusive & Localized:** Speak both Bahasa Melayu and English naturally to serve the whole Malaysian community.

## Accessibility & Inclusion
- High-contrast AMOLED pure black theme with legible typography and crisp borders.
- Bilingual interface (BM/EN) accessible to all Malaysians.
- Multi-persona health guidance serving kids, asthma sufferers, elderly, and gig/outdoor workers.
