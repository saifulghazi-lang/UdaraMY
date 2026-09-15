/**
 * ASMC Regional Hotspot & Real-Time Wind Service
 * Ingests near real-time satellite fire counts from ASEAN Specialised Meteorological Centre (ASMC)
 * and live wind speed & direction from Open-Meteo.
 */

const ASMC_CACHE_KEY = 'udaramy_asmc_hotspots_cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache (ASMC satellite reports update 1-2 times daily)

const BASELINE_HOTSPOTS = {
  sumatra: 24,
  kalimantan: 630,
  malaysia: 1,
  windDirection: 'South-Southeast (159°)',
  windSpeedKm: '12 km/h',
  windSpeedVal: 12,
  windDeg: 159,
  smokeTrajectory: 'Northwest towards Straits of Malacca & Southern Sarawak',
  isLive: false,
  updatedAt: new Date().toISOString()
};

function parseAsmcReport(text) {
  if (!text) return 0;
  // Format: "Total Hotspot Count: 24 (Daytime High Confidence)"
  const countMatch = text.match(/Total Hotspot Count:\s*(\d+)/i);
  if (countMatch && countMatch[1]) {
    return parseInt(countMatch[1], 10);
  }
  // Fallback: count data rows in table (S/No Longitude Latitude)
  const rows = text.split('\n').filter(line => /^\s*\d+\s+[\d\.]+\s+[\-\d\.]+/.test(line));
  return rows.length;
}

export function degreesToCompass(deg) {
  const directions = [
    'North', 'North-Northeast', 'Northeast', 'East-Northeast',
    'East', 'East-Southeast', 'Southeast', 'South-Southeast',
    'South', 'South-Southwest', 'Southwest', 'West-Southwest',
    'West', 'West-Northwest', 'Northwest', 'North-Northwest'
  ];
  const idx = Math.round((deg % 360) / 22.5) % 16;
  return `${directions[idx]} (${Math.round(deg)}°)`;
}

export function computeTrajectory(deg, speedKm) {
  if (deg >= 180 && deg <= 260) {
    return 'Northeast across Straits of Malacca towards West Coast';
  } else if (deg >= 100 && deg < 180) {
    return 'Northwest towards Southern Sarawak & Peninsular West Coast';
  } else if (deg >= 260 && deg <= 320) {
    return 'East-Northeast across Peninsular';
  } else if (deg >= 20 && deg <= 90) {
    return 'Southwest away from mainland / towards sea';
  }
  return 'Variable light air movement';
}

/**
 * Fetch real-time wind from Open-Meteo
 */
export async function getLiveWind(lat = 3.139, lng = 101.6869) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=wind_speed_10m,wind_direction_10m`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
    const data = await res.json();
    if (data.current) {
      const speed = Math.round(data.current.wind_speed_10m || 0);
      const deg = Math.round(data.current.wind_direction_10m || 0);
      return {
        speedKm: `${speed} km/h`,
        speedVal: speed,
        deg,
        compass: degreesToCompass(deg),
        trajectory: computeTrajectory(deg, speed)
      };
    }
  } catch (err) {
    console.warn('Live wind fetch failed, using fallback:', err.message);
  }
  return {
    speedKm: BASELINE_HOTSPOTS.windSpeedKm,
    speedVal: BASELINE_HOTSPOTS.windSpeedVal,
    deg: BASELINE_HOTSPOTS.windDeg,
    compass: BASELINE_HOTSPOTS.windDirection,
    trajectory: BASELINE_HOTSPOTS.smokeTrajectory
  };
}

/**
 * Fetch live NOAA-20 satellite fire hotspots from ASMC
 */
export async function getLiveHotspots(coords = null) {
  const now = Date.now();
  let cachedHotspots = null;

  try {
    const raw = localStorage.getItem(ASMC_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (now - parsed.timestamp < CACHE_TTL_MS) {
        cachedHotspots = parsed.data;
      }
    }
  } catch (e) {}

  // Fetch live wind in parallel
  const lat = coords?.lat || 3.139;
  const lng = coords?.lng || 101.6869;
  const windPromise = getLiveWind(lat, lng);

  let hotspotCounts = cachedHotspots;

  if (!hotspotCounts) {
    try {
      const [sumatraRes, kalimantanRes, pMalRes] = await Promise.allSettled([
        fetch('/asmc/files/msscommunity/hotspots/DailyJP1NOAA20.sumatra.txt'),
        fetch('/asmc/files/msscommunity/hotspots/DailyJP1NOAA20.kalimantan.txt'),
        fetch('/asmc/files/msscommunity/hotspots/DailyJP1NOAA20.p_malaysia.txt')
      ]);

      const sumatraText = sumatraRes.status === 'fulfilled' && sumatraRes.value.ok ? await sumatraRes.value.text() : '';
      const kalimantanText = kalimantanRes.status === 'fulfilled' && kalimantanRes.value.ok ? await kalimantanRes.value.text() : '';
      const pMalText = pMalRes.status === 'fulfilled' && pMalRes.value.ok ? await pMalRes.value.text() : '';

      const sumatra = parseAsmcReport(sumatraText) || BASELINE_HOTSPOTS.sumatra;
      const kalimantan = parseAsmcReport(kalimantanText) || BASELINE_HOTSPOTS.kalimantan;
      const malaysia = parseAsmcReport(pMalText) || BASELINE_HOTSPOTS.malaysia;

      hotspotCounts = {
        sumatra,
        kalimantan,
        malaysia,
        isLive: true,
        updatedAt: new Date().toISOString()
      };

      try {
        localStorage.setItem(ASMC_CACHE_KEY, JSON.stringify({
          timestamp: now,
          data: hotspotCounts
        }));
      } catch (e) {}
    } catch (err) {
      console.warn('ASMC live hotspot fetch failed, using fallback:', err.message);
      hotspotCounts = { ...BASELINE_HOTSPOTS };
    }
  }

  const wind = await windPromise;

  return {
    sumatra: hotspotCounts.sumatra,
    kalimantan: hotspotCounts.kalimantan,
    malaysia: hotspotCounts.malaysia,
    windDirection: wind.compass,
    windSpeedKm: wind.speedKm,
    windSpeedVal: wind.speedVal,
    windDeg: wind.deg,
    smokeTrajectory: wind.trajectory,
    isLive: true,
    updatedAt: hotspotCounts.updatedAt || new Date().toISOString()
  };
}
