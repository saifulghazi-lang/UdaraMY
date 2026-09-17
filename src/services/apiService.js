import { STATIONS, getCategoryFromApi } from '../data/stations.js';

const CACHE_KEY = 'udaramy_air_data_live';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Parses the symbol to pollutant name
 * ** = PM2.5, * = PM10, a = SO2, b = NO2, c = O3, d = CO
 */
function parseDominantPollutant(symbol) {
  if (!symbol) return 'PM2.5';
  if (symbol.includes('**')) return 'PM2.5';
  if (symbol.includes('*')) return 'PM10';
  if (symbol.includes('c')) return 'O₃ (Ozone)';
  if (symbol.includes('d')) return 'CO';
  if (symbol.includes('b')) return 'NO₂';
  if (symbol.includes('a')) return 'SO₂';
  return 'PM2.5';
}

/**
 * Official Malaysian JAS APIMS Piecewise conversion for PM2.5 from API
 */
export function calculatePm25FromApi(api) {
  if (api <= 0) return 0;
  if (api <= 50) {
    // API 0-50 -> PM2.5 0-35 µg/m³
    return +(api * (35 / 50)).toFixed(1);
  } else if (api <= 100) {
    // API 51-100 -> PM2.5 36-75 µg/m³
    return +(35 + (api - 50) * (40 / 50)).toFixed(1);
  } else if (api <= 200) {
    // API 101-200 -> PM2.5 76-150 µg/m³
    return +(75 + (api - 100) * (75 / 100)).toFixed(1);
  } else if (api <= 300) {
    // API 201-300 -> PM2.5 151-250 µg/m³
    return +(150 + (api - 200) * (100 / 100)).toFixed(1);
  } else {
    // API > 300 -> PM2.5 251-500 µg/m³
    return +(250 + (api - 300) * (250 / 200)).toFixed(1);
  }
}

/**
 * Regional & environmental pollutant signatures across Malaysian states
 */
export const STATE_PROFILES = {
  // Heavy traffic & dense urban centers (High NO2 from traffic, elevated daytime O3)
  'W.P. Kuala Lumpur': { no2: 1.50, o3: 1.30, so2: 0.90, co: 1.40, pm10: 1.45 },
  'W.P. Putrajaya':    { no2: 1.30, o3: 1.35, so2: 0.70, co: 1.10, pm10: 1.40 },
  'Selangor':          { no2: 1.40, o3: 1.25, so2: 1.30, co: 1.30, pm10: 1.50 }, // Industrial + port + heavy traffic
  'Pulau Pinang':      { no2: 1.30, o3: 1.20, so2: 1.10, co: 1.20, pm10: 1.45 }, // Dense urban island + industrial Prai

  // Heavy petrochemical, shipping port & industrial states (Elevated SO2 and PM10)
  'Johor':             { no2: 1.20, o3: 1.10, so2: 1.65, co: 1.20, pm10: 1.55 }, // Pasir Gudang, Pengerang refineries
  'Terengganu':        { no2: 0.70, o3: 0.80, so2: 1.50, co: 0.80, pm10: 1.40 }, // Kemaman & Kerteh petrochemical hubs
  'Melaka':            { no2: 1.10, o3: 1.10, so2: 1.25, co: 1.00, pm10: 1.45 }, // Sungai Udang refinery

  // Forested & maritime states (Borneo & East Coast) - lower background NO2/SO2, peat smoke during haze
  'Sarawak':           { no2: 0.60, o3: 0.70, so2: 1.20, co: 1.35, pm10: 1.35 }, // Peatland haze + Bintulu LNG/heavy industry
  'Sabah':             { no2: 0.50, o3: 0.70, so2: 0.60, co: 0.70, pm10: 1.30 }, // Pristine maritime background
  'W.P. Labuan':       { no2: 0.60, o3: 0.70, so2: 1.00, co: 0.70, pm10: 1.30 }, // Offshore base

  // Agricultural & northern states (higher PM10 from soil/paddy straw burning)
  'Kedah':             { no2: 0.80, o3: 0.90, so2: 0.60, co: 0.90, pm10: 1.65 },
  'Perlis':            { no2: 0.60, o3: 0.80, so2: 0.50, co: 0.80, pm10: 1.60 },
  'Perak':             { no2: 0.90, o3: 1.00, so2: 0.90, co: 0.90, pm10: 1.55 }, // Mining, quarrying & highways
  'Negeri Sembilan':   { no2: 1.00, o3: 1.10, so2: 1.00, co: 1.00, pm10: 1.48 },
  'Pahang':            { no2: 0.60, o3: 0.80, so2: 0.80, co: 0.90, pm10: 1.40 },
  'Kelantan':          { no2: 0.60, o3: 0.80, so2: 0.50, co: 0.80, pm10: 1.40 }
};

/**
 * Calculates pollutant concentrations correlated to official API, state profile, and dominant pollutant
 */
function generatePollutants(api, dominant = 'PM2.5', state = '', stationName = '') {
  const p = STATE_PROFILES[state] || { no2: 1.0, o3: 1.0, so2: 1.0, co: 1.0, pm10: 1.45 };
  
  // Specific industrial hotspots in Malaysia receive additional localized SO2 boost
  const isIndustrial = /pasir gudang|kemaman|kerteh|bintulu|port klang|tanjung langsat|samalaju|prai/i.test(stationName);
  const so2Multiplier = isIndustrial ? p.so2 * 1.5 : p.so2;

  const pm25 = calculatePm25FromApi(api);
  const pm10 = +(pm25 * p.pm10).toFixed(1);
  const o3 = +((30 + (api / 300) * 45) * p.o3).toFixed(1);
  const no2 = +((12 + (api / 300) * 30) * p.no2).toFixed(1);
  const so2 = +((4 + (api / 300) * 16) * so2Multiplier).toFixed(1);
  const co = +((320 + (api / 300) * 800) * p.co).toFixed(0);

  // Standardize ratios against Malaysian National Ambient Air Quality Standards
  let pm25Ratio = Math.min(100, Math.round((pm25 / 75) * 100));
  let pm10Ratio = Math.min(100, Math.round((pm10 / 150) * 100));
  let o3Ratio = Math.min(100, Math.round((o3 / 120) * 100));
  let no2Ratio = Math.min(100, Math.round((no2 / 100) * 100));
  let so2Ratio = Math.min(100, Math.round((so2 / 80) * 100));
  let coRatio = Math.min(100, Math.round((co / 2000) * 100));

  // If APIMS indicates a specific dominant pollutant, ensure its ratio appropriately aligns
  const dom = (dominant || '').toLowerCase();
  if (dom.includes('pm10') && pm10Ratio < pm25Ratio) {
    pm10Ratio = Math.min(100, pm25Ratio + 4);
  } else if ((dom.includes('o3') || dom.includes('ozone')) && o3Ratio < pm25Ratio) {
    o3Ratio = Math.min(100, pm25Ratio + 4);
  } else if (dom.includes('so2') && so2Ratio < pm25Ratio) {
    so2Ratio = Math.min(100, pm25Ratio + 4);
  }

  return {
    pm25: { value: pm25, unit: 'µg/m³', ratio: pm25Ratio },
    pm10: { value: pm10, unit: 'µg/m³', ratio: pm10Ratio },
    o3: { value: o3, unit: 'µg/m³', ratio: o3Ratio },
    no2: { value: no2, unit: 'µg/m³', ratio: no2Ratio },
    so2: { value: so2, unit: 'µg/m³', ratio: so2Ratio },
    co: { value: co, unit: 'µg/m³', ratio: coRatio }
  };
}

/**
 * Synthetic fallback for 24h history if station rows are incomplete
 */
function generate24hHistoryFallback(currentApi) {
  const history = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600 * 1000);
    const variance = Math.sin(i / 3) * (currentApi * 0.1) - (i * 0.5);
    const value = Math.max(10, Math.round(currentApi + variance));
    history.push({
      hour: time.getHours(),
      timeLabel: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      api: i === 0 ? currentApi : value
    });
  }
  return history;
}

/**
 * Format hourly rows from APIMS into chart-ready 24-hour sequence (oldest -> newest)
 */
function processHourlyRows(rows, currentApi) {
  if (!rows || rows.length === 0) {
    return generate24hHistoryFallback(currentApi);
  }

  // Rows from APIMS are newest first; reverse to display oldest to newest
  const sorted = [...rows].reverse();
  return sorted.map(r => {
    const d = new Date(r.DATETIME);
    return {
      hour: isNaN(d.getTime()) ? 0 : d.getHours(),
      timeLabel: isNaN(d.getTime())
        ? 'N/A'
        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      api: typeof r.API === 'number' ? r.API : currentApi
    };
  });
}

/**
 * Fetches real, live data from DOE APIMS endpoint
 */
export async function getAirQualityData(forceRefresh = false) {
  if (forceRefresh) {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (e) {}
  }

  let liveJson = null;
  const endpoints = [
    '/api/apims', // Vercel Serverless Function proxy
    '/api3/publicportalapims/apitablehourly' // Vite dev server proxy / Netlify proxy
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json, text/plain, */*'
        },
        signal: AbortSignal.timeout(12000)
      });

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.api_table_hourly) && json.api_table_hourly.length > 0) {
          liveJson = json;
          break; // successfully retrieved live data
        }
      }
    } catch (err) {
      // try next endpoint candidate
    }
  }

  // If live data successfully received, process all 68 stations
  if (liveJson && Array.isArray(liveJson.api_table_hourly) && liveJson.api_table_hourly.length > 0) {
    const rawRows = liveJson.api_table_hourly;

    // Group rows by STATION_ID
    const stationRowsMap = {};
    rawRows.forEach(r => {
      if (!stationRowsMap[r.STATION_ID]) {
        stationRowsMap[r.STATION_ID] = [];
      }
      stationRowsMap[r.STATION_ID].push(r);
    });

    const stations = STATIONS.map(st => {
      const stationRows = stationRowsMap[st.id] || [];
      const latestRow = stationRows[0]; // newest reading is at index 0

      const api = latestRow && typeof latestRow.API === 'number' ? latestRow.API : st.baseApi;
      const category = getCategoryFromApi(api);
      const dominantPollutant = parseDominantPollutant(latestRow?.PARAM_SYMBOL);

      return {
        ...st,
        api,
        category,
        dominantPollutant,
        pollutants: generatePollutants(api, dominantPollutant, st.state, st.name),
        history24h: processHourlyRows(stationRows, api)
      };
    });

    const payload = {
      isLive: true,
      updatedAt: rawRows[0]?.DATETIME || new Date().toISOString(),
      stations
    };

    // Save to local cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: payload
      }));
    } catch (e) {
      console.warn('LocalStorage error writing cache', e);
    }

    return payload;
  }

  // Fallback 1: Read from localStorage cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      console.info('Serving air quality from local cache');
      return { ...parsed.data, isLive: false, fromCache: true };
    }
  } catch (e) {
    console.warn('LocalStorage cache read failed', e);
  }

  // Fallback 2: Generate baseline from static station list
  console.info('Serving baseline station data');
  const stations = STATIONS.map(st => {
    const api = st.baseApi;
    return {
      ...st,
      api,
      category: getCategoryFromApi(api),
      dominantPollutant: 'PM2.5',
      pollutants: generatePollutants(api, 'PM2.5', st.state, st.name),
      history24h: generate24hHistoryFallback(api)
    };
  });

  return {
    isLive: false,
    updatedAt: new Date().toISOString(),
    stations
  };
}

export { generate24hHistoryFallback as generate24hHistory, generatePollutants };
