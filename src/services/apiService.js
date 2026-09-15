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
 * Calculates pollutant concentrations estimated from official API value
 */
function generatePollutants(api) {
  const pm25Val = +(api * 0.42).toFixed(1);
  const pm10Val = +(api * 0.31).toFixed(1);
  const o3Val = +(0.015 + (api / 300) * 0.035).toFixed(3);
  const coVal = +(0.3 + (api / 300) * 0.9).toFixed(1);
  const no2Val = +(0.008 + (api / 300) * 0.02).toFixed(3);
  const so2Val = +(0.002 + (api / 300) * 0.008).toFixed(3);

  return {
    pm25: { value: pm25Val, unit: 'µg/m³', ratio: Math.min(100, Math.round((pm25Val / 75) * 100)) },
    pm10: { value: pm10Val, unit: 'µg/m³', ratio: Math.min(100, Math.round((pm10Val / 100) * 100)) },
    o3: { value: o3Val, unit: 'ppm', ratio: Math.min(100, Math.round((o3Val / 0.06) * 100)) },
    co: { value: coVal, unit: 'ppm', ratio: Math.min(100, Math.round((coVal / 2.5) * 100)) },
    no2: { value: no2Val, unit: 'ppm', ratio: Math.min(100, Math.round((no2Val / 0.04) * 100)) },
    so2: { value: so2Val, unit: 'ppm', ratio: Math.min(100, Math.round((so2Val / 0.02) * 100)) }
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

  try {
    const res = await fetch('/api3/publicportalapims/apitablehourly', {
      headers: {
        'Accept': 'application/json, text/plain, */*'
      }
    });

    if (res.ok) {
      liveJson = await res.json();
    } else {
      console.warn('Live APIMS fetch returned status:', res.status);
    }
  } catch (err) {
    console.warn('Live APIMS fetch failed, checking local cache:', err.message);
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
        pollutants: generatePollutants(api),
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
      pollutants: generatePollutants(api),
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
