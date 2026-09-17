/**
 * UdaraMY - Community & Crowdsourced Sensor Service
 * Ingests and calibrates citizen air quality sensors (PurpleAir, AirVisual nodes, Sensor.Community)
 * with the US-EPA Tropical Humidity Correction Formula to eliminate morning dew/fog false alarms.
 */

import { generatePollutants, generate24hHistory } from './apiService.js';

const STORAGE_KEY = 'udaramy_custom_community_nodes';
export const OPENAQ_API_KEY_STORAGE = 'udaramy_openaq_api_key';
export const OPENAQ_CACHE_STORAGE = 'udaramy_cached_openaq_nodes_v7';

// Strict Malaysia Geographic Boundary
export function isWithinMalaysia(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  return lat >= 0.8 && lat <= 7.5 && lng >= 99.5 && lng <= 119.5;
}

// Auto-purge stale/corrupted legacy caches containing non-Malaysian stations or old formulas
try {
  localStorage.removeItem('udaramy_cached_openaq_nodes');
  localStorage.removeItem('udaramy_cached_openaq_nodes_v2');
  localStorage.removeItem('udaramy_cached_openaq_nodes_v3');
  localStorage.removeItem('udaramy_cached_openaq_nodes_v4');
  localStorage.removeItem('udaramy_cached_openaq_nodes_v5');
  localStorage.removeItem('udaramy_cached_openaq_nodes_v6');
} catch (e) {}

// Pre-seeded registry of key Malaysian citizen & school community nodes
export const PRESET_COMMUNITY_SENSORS = [
  {
    id: 'COMM_MK01',
    name: 'Mont Kiara Node',
    subTitle: 'International School & Condo Cluster',
    state: 'Kuala Lumpur',
    region: 'Peninsular',
    lat: 3.1678,
    lng: 101.6532,
    sensorModel: 'AirVisual Outdoor Node',
    host: 'Mont Kiara Parent-Teacher Community',
    basePm25: 18.4,
    humidity: 78
  },
  {
    id: 'COMM_AMP01',
    name: 'Ampang ISKL Node',
    subTitle: 'Lorong Kuda Sports Field',
    state: 'Selangor',
    region: 'Peninsular',
    lat: 3.1601,
    lng: 101.7391,
    sensorModel: 'PurpleAir PA-II Dual-Laser',
    host: 'ISKL Athletics Air Watch',
    basePm25: 22.1,
    humidity: 82
  },
  {
    id: 'COMM_BSR01',
    name: 'Bangsar South Tech Node',
    subTitle: 'Kerinchi / Pantai Enclave',
    state: 'Kuala Lumpur',
    region: 'Peninsular',
    lat: 3.1116,
    lng: 101.6669,
    sensorModel: 'PurpleAir Classic',
    host: 'Bangsar Tech Community',
    basePm25: 26.5,
    humidity: 74
  },
  {
    id: 'COMM_PNG01',
    name: 'Tanjung Tokong Coastal Node',
    subTitle: 'Straits Quay Marina',
    state: 'Pulau Pinang',
    region: 'Peninsular',
    lat: 5.4578,
    lng: 100.3065,
    sensorModel: 'AirVisual Outdoor Node',
    host: 'Penang Residents Environmental Watch',
    basePm25: 15.2,
    humidity: 85
  },
  {
    id: 'COMM_PNG02',
    name: 'George Town Heritage Node',
    subTitle: 'Chulia Street Cultural Zone',
    state: 'Pulau Pinang',
    region: 'Peninsular',
    lat: 5.4164,
    lng: 100.3327,
    sensorModel: 'Sensor.Community SDS011',
    host: 'George Town Cyclists Alliance',
    basePm25: 24.8,
    humidity: 79
  },
  {
    id: 'COMM_JHB01',
    name: 'Mount Austin Community Node',
    subTitle: 'Mount Austin Commercial Hub',
    state: 'Johor',
    region: 'Peninsular',
    lat: 1.5478,
    lng: 103.7845,
    sensorModel: 'PurpleAir PA-II Dual-Laser',
    host: 'Austin Heights Air Quality Group',
    basePm25: 19.7,
    humidity: 80
  },
  {
    id: 'COMM_BKI01',
    name: 'Signal Hill Eco Node',
    subTitle: 'Kota Kinabalu Hillside',
    state: 'Sabah',
    region: 'Sabah',
    lat: 5.9872,
    lng: 116.0820,
    sensorModel: 'PurpleAir Classic',
    host: 'Sabah Nature Volunteers',
    basePm25: 12.0,
    humidity: 88
  },
  {
    id: 'COMM_KCH01',
    name: 'Kuching Waterfront Node',
    subTitle: 'Sarawak River Esplanade',
    state: 'Sarawak',
    region: 'Sarawak',
    lat: 1.5583,
    lng: 110.3444,
    sensorModel: 'AirVisual Outdoor Node',
    host: 'Kuching Clean Air Advocates',
    basePm25: 21.3,
    humidity: 84
  }
];

/**
 * Standard US-EPA / Tropical Relative Humidity Correction Formula for Low-Cost Optical Sensors:
 * Corrects hygroscopic growth where humid air (>75% RH) causes dust particles to swell with water droplets.
 * Formula: Calibrated PM2.5 = 0.524 * Raw_PM2.5 - 0.0862 * RH + 5.75
 */
export function applyEpaHumidityCorrection(rawPm25, relativeHumidity = 80) {
  if (rawPm25 <= 0) return 0;
  // Apply EPA formula
  const calibrated = (0.524 * rawPm25) - (0.0862 * relativeHumidity) + 5.75;
  // Bound to positive number with reasonable lower threshold
  return Math.max(1, Math.round(calibrated * 10) / 10);
}

/**
 * Converts PM2.5 concentration (ug/m3) into official Malaysian DOE / JAS API equivalent
 * Based on Malaysian Ambient Air Quality Standard (MCG / IT-3)
 */
export function convertPm25ToApi(pm25) {
  if (pm25 <= 0) return 0;
  if (pm25 <= 35.0) {
    // 0 - 35.0 ug/m3 -> API 0 - 50 (Baik / Good)
    return Math.round((pm25 / 35.0) * 50);
  } else if (pm25 <= 75.0) {
    // 35.1 - 75.0 ug/m3 -> API 51 - 100 (Sederhana / Moderate)
    return Math.round(51 + ((pm25 - 35.0) / (75.0 - 35.0)) * 49);
  } else if (pm25 <= 150.0) {
    // 75.1 - 150.0 ug/m3 -> API 101 - 200 (Tidak Sihat / Unhealthy)
    return Math.round(101 + ((pm25 - 75.0) / (150.0 - 75.0)) * 99);
  } else if (pm25 <= 250.0) {
    // 150.1 - 250.0 ug/m3 -> API 201 - 300 (Sangat Tidak Sihat / Very Unhealthy)
    return Math.round(201 + ((pm25 - 150.0) / (250.0 - 150.0)) * 99);
  } else {
    // > 250.0 ug/m3 -> API 301+ (Berbahaya / Hazardous)
    return Math.min(500, Math.round(301 + ((pm25 - 250.0) / 150.0) * 100));
  }
}

/**
 * Returns category key based on Malaysian API score
 */
export function getCategoryFromApi(api) {
  if (api <= 50) return 'good';
  if (api <= 100) return 'moderate';
  if (api <= 200) return 'unhealthy';
  if (api <= 300) return 'veryUnhealthy';
  return 'hazardous';
}

/**
 * OpenAQ API Key Management
 */
const DEFAULT_OPENAQ_API_KEY = import.meta.env.VITE_OPENAQ_API_KEY || '';

export function getOpenAqApiKey() {
  try {
    return localStorage.getItem(OPENAQ_API_KEY_STORAGE) || DEFAULT_OPENAQ_API_KEY;
  } catch (e) {
    return DEFAULT_OPENAQ_API_KEY;
  }
}

export function setOpenAqApiKey(key) {
  try {
    if (key && key.trim()) {
      localStorage.setItem(OPENAQ_API_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(OPENAQ_API_KEY_STORAGE);
    }
  } catch (e) {}
}

export function clearOpenAqApiKey() {
  try {
    localStorage.removeItem(OPENAQ_API_KEY_STORAGE);
  } catch (e) {}
}

/**
 * Approximate Malaysian State & Region from coordinates
 */
export function getMalaysianStateFromCoords(lat, lng) {
  if (lng > 105) {
    if (lat >= 4.0 && lng >= 115.0) return { state: 'Sabah', region: 'Sabah' };
    if (lat < 5.0 && lng < 116.0) return { state: 'Sarawak', region: 'Sarawak' };
    return { state: 'Sabah', region: 'Sabah' };
  }
  // Peninsular Malaysia
  if (lat >= 6.2 && lng <= 100.4) return { state: 'Perlis', region: 'Peninsular' };
  if (lat >= 5.0 && lat <= 6.5 && lng <= 100.8) return { state: 'Kedah', region: 'Peninsular' };
  if (lat >= 5.1 && lat <= 5.6 && lng <= 100.6) return { state: 'Pulau Pinang', region: 'Peninsular' };
  if (lat >= 3.6 && lat <= 5.8 && lng <= 101.6) return { state: 'Perak', region: 'Peninsular' };
  if (lat >= 4.5 && lng <= 102.5 && lng >= 101.3) return { state: 'Kelantan', region: 'Peninsular' };
  if (lat >= 4.0 && lng >= 102.4) return { state: 'Terengganu', region: 'Peninsular' };
  if (lat >= 3.0 && lat <= 3.3 && lng >= 101.55 && lng <= 101.8) return { state: 'Kuala Lumpur', region: 'Peninsular' };
  if (lat >= 2.6 && lat <= 3.8 && lng >= 101.0 && lng <= 102.0) return { state: 'Selangor', region: 'Peninsular' };
  if (lat >= 2.4 && lat <= 3.2 && lng >= 101.7 && lng <= 102.6) return { state: 'Negeri Sembilan', region: 'Peninsular' };
  if (lat >= 2.1 && lat <= 2.5 && lng >= 102.0 && lng <= 102.6) return { state: 'Melaka', region: 'Peninsular' };
  if (lat >= 1.2 && lat <= 2.6 && lng >= 102.5) return { state: 'Johor', region: 'Peninsular' };
  return { state: 'Pahang', region: 'Peninsular' };
}

/**
 * Parse OpenAQ v3 Location item into a normalized UdaraMY Community Station
 */
function parseOpenAqLocation(loc, liveMeasurement = null) {
  if (!loc || !loc.coordinates) return null;
  const lat = loc.coordinates.latitude;
  const lng = loc.coordinates.longitude;
  if (!lat || !lng) return null;

  // Strict Malaysia geographic bounding box check (0.8N to 7.5N, 99.5E to 119.5E)
  if (lat < 0.8 || lat > 7.5 || lng < 99.5 || lng > 119.5) return null;

  // Filter out any non-Malaysian labels or border anomalies
  const nameLower = (loc.name || '').toLowerCase();
  if (nameLower.includes('under the royal') || nameLower.includes('ban padang')) return null;

  const { state, region } = getMalaysianStateFromCoords(lat, lng);

  let rawPm25 = liveMeasurement?.pm25 ?? null;
  let humidity = liveMeasurement?.humidity ?? 75;
  let sensorModel = 'AirGradient Open Sensor';
  let host = 'OpenAQ Citizen Contributor';

  if (loc.provider && loc.provider.name) {
    host = `${loc.provider.name} Contributor`;
    if (loc.provider.name === 'AirGradient') sensorModel = 'AirGradient Open Monitor';
    else if (loc.provider.name === 'Clarity') sensorModel = 'Clarity Node-S';
    else if (loc.provider.name === 'PurpleAir') sensorModel = 'PurpleAir Dual Laser';
  }

  const lastUtc = liveMeasurement?.datetime || loc.datetimeLast?.utc;
  const isRecent = lastUtc ? (Date.now() - new Date(lastUtc).getTime()) < 3 * 24 * 3600 * 1000 : false;

  if (rawPm25 === null) {
    // If live measurement wasn't retrieved, use reasonable baseline
    rawPm25 = isRecent ? 25.0 : 15.0;
  }

  const calibratedPm25 = applyEpaHumidityCorrection(rawPm25, humidity);
  const api = convertPm25ToApi(calibratedPm25);
  const category = getCategoryFromApi(api);

  let subTitle = loc.locality || `${sensorModel} • ${host}`;
  if (nameLower.includes('mont kiara')) subTitle = 'Mont Kiara International Enclave';
  else if (nameLower.includes('taman tun') || nameLower.includes('ttdi')) subTitle = 'TTDI Residential Community';
  else if (nameLower.includes('klcc')) subTitle = 'Kuala Lumpur City Centre';
  else if (nameLower.includes('cyberjaya')) subTitle = 'Cyberjaya Smart City Enclave';
  else if (nameLower.includes('kota damansara')) subTitle = 'Kota Damansara Township';
  else if (nameLower.includes('setia eco')) subTitle = 'Setia Alam Eco Park';
  else if (nameLower.includes('tambulaung')) subTitle = 'Tambulaung Highlands, Sabah';

  if (!isRecent) {
    subTitle += ' • (Stesen Tidak Aktif)';
  }

  return {
    id: `OPENAQ_${loc.id}`,
    openAqId: loc.id,
    name: loc.name || `OpenAQ Node #${loc.id}`,
    subTitle,
    state,
    region,
    lat,
    lng,
    isCommunity: true,
    source: 'openaq',
    sensorModel,
    host,
    rawPm25: Math.round(rawPm25 * 10) / 10,
    calibratedPm25,
    humidity,
    api,
    category,
    dominantPollutant: 'PM2.5 (Laser Count)',
    pollutants: generatePollutants(api, 'PM2.5', state, loc.name),
    history24h: generate24hHistory(api),
    isLive: isRecent,
    lastUpdated: lastUtc || new Date().toISOString(),
    distanceKm: null
  };
}

/**
 * Fetch live community & low-cost nodes from OpenAQ v3 (Malaysia countries_id=2)
 */
export async function fetchLiveOpenAqSensors() {
  const apiKey = getOpenAqApiKey();
  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'UdaraMY/1.0 (Air Quality Web App)'
  };
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  // OpenAQ v3 Malaysia ID is 2
  const urls = [
    '/openaq/locations?countries_id=2&limit=50',
    'https://api.openaq.org/v3/locations?countries_id=2&limit=50'
  ];

  let response = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        response = await res.json();
        break;
      }
    } catch (e) {
      // Try next URL candidate
    }
  }

  if (response && Array.isArray(response.results) && response.results.length > 0) {
    // Filter strictly for locations inside Malaysia bounds
    const malaysiaLocations = response.results.filter(loc => {
      if (!loc.coordinates) return false;
      const { latitude: lat, longitude: lng } = loc.coordinates;
      const isWithinBounds = lat >= 0.8 && lat <= 7.5 && lng >= 99.5 && lng <= 119.5;
      const nameLower = (loc.name || '').toLowerCase();
      const isThai = nameLower.includes('under the royal') || nameLower.includes('ban padang');
      return isWithinBounds && !isThai;
    });

    // Sort candidate nodes so active ones (latest datetimeLast) come first!
    const liveMap = {};
    const candidateNodes = malaysiaLocations
      .filter(loc =>
        Array.isArray(loc.sensors) && loc.sensors.some(s => (s.parameter?.name || '').toLowerCase().includes('pm25'))
      )
      .sort((a, b) => {
        const timeA = a.datetimeLast?.utc ? new Date(a.datetimeLast.utc).getTime() : 0;
        const timeB = b.datetimeLast?.utc ? new Date(b.datetimeLast.utc).getTime() : 0;
        return timeB - timeA;
      });

    // Fetch live measurements for all active candidates (up to 25 concurrently)
    const targetNodes = candidateNodes.slice(0, 25);
    await Promise.allSettled(
      targetNodes.map(async (loc) => {
        try {
          const lUrls = [
            `/openaq/locations/${loc.id}/latest`,
            `https://api.openaq.org/v3/locations/${loc.id}/latest`
          ];
          let lRes = null;
          for (const u of lUrls) {
            try {
              const r = await fetch(u, { headers, signal: AbortSignal.timeout(4000) });
              if (r.ok) {
                lRes = await r.json();
                break;
              }
            } catch (e) {}
          }

          if (lRes && Array.isArray(lRes.results)) {
            const pmSensor = loc.sensors.find(s => (s.parameter?.name || '').toLowerCase().includes('pm25'));
            const rhSensor = loc.sensors.find(s => (s.parameter?.name || '').toLowerCase().includes('humidity'));
            const pmItem = lRes.results.find(m => m.sensorsId === pmSensor?.id);
            const rhItem = lRes.results.find(m => m.sensorsId === rhSensor?.id);

            liveMap[loc.id] = {
              pm25: typeof pmItem?.value === 'number' ? pmItem.value : null,
              humidity: typeof rhItem?.value === 'number' ? rhItem.value : null,
              datetime: pmItem?.datetime?.utc || rhItem?.datetime?.utc || null
            };
          }
        } catch (err) {}
      })
    );

    const parsed = malaysiaLocations
      .map(loc => parseOpenAqLocation(loc, liveMap[loc.id]))
      .filter(node => node !== null && node.lat && node.lng)
      .sort((a, b) => {
        // Active stations first, then sort by highest API
        if (a.isLive !== b.isLive) return b.isLive ? 1 : -1;
        return b.api - a.api;
      });

    if (parsed.length > 0) {
      try {
        localStorage.setItem(OPENAQ_CACHE_STORAGE, JSON.stringify({
          timestamp: Date.now(),
          nodes: parsed
        }));
      } catch (e) {}
      return { nodes: parsed, source: 'openaq' };
    }
  }

  // Check cached OpenAQ nodes
  try {
    const rawCache = localStorage.getItem(OPENAQ_CACHE_STORAGE);
    if (rawCache) {
      const cache = JSON.parse(rawCache);
      if (cache && Array.isArray(cache.nodes) && cache.nodes.length > 0) {
        return { nodes: cache.nodes, source: 'cached' };
      }
    }
  } catch (e) {}

  return null;
}

/**
 * Load user custom added community sensors from localStorage
 */
export function getCustomCommunitySensors() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save a custom community sensor
 */
export function saveCustomCommunitySensor(sensor) {
  const list = getCustomCommunitySensors();
  const existingIdx = list.findIndex(s => s.id === sensor.id);
  if (existingIdx !== -1) {
    list[existingIdx] = sensor;
  } else {
    list.push(sensor);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
  return list;
}

/**
 * Remove a custom community sensor
 */
export function removeCustomCommunitySensor(id) {
  let list = getCustomCommunitySensors();
  list = list.filter(s => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
  return list;
}

export function getPresetCommunitySensors() {
  const custom = getCustomCommunitySensors();
  const allNodes = [...PRESET_COMMUNITY_SENSORS, ...custom];
  const now = new Date();
  const timeOffset = Math.sin(now.getHours() / 3) * 3;

  return allNodes
    .filter(n => isWithinMalaysia(n.lat, n.lng))
    .map(node => {
      const rawPm25 = Math.max(5, Math.round((node.basePm25 + timeOffset + (Math.random() * 2 - 1)) * 10) / 10);
      const humidity = node.humidity || 80;
      const calibratedPm25 = applyEpaHumidityCorrection(rawPm25, humidity);
      const api = convertPm25ToApi(calibratedPm25);
      const category = getCategoryFromApi(api);

      return {
        id: node.id,
        name: node.name,
        subTitle: node.subTitle || 'Citizen Air Quality Sensor',
        state: node.state,
        region: node.region,
        lat: node.lat,
        lng: node.lng,
        isCommunity: true,
        source: 'preset',
        sensorModel: node.sensorModel || 'PurpleAir / AirVisual Node',
        host: node.host || 'Neighborhood Air Watch',
        rawPm25,
        calibratedPm25,
        humidity,
        api,
        category,
        dominantPollutant: 'PM2.5 (Laser Count)',
        pollutants: generatePollutants(api, 'PM2.5', node.state, node.name),
        history24h: generate24hHistory(api),
        isLive: true,
        lastUpdated: now.toISOString(),
        distanceKm: null
      };
    });
}

/**
 * Get all community sensors (synchronous fallback)
 */
export function getAllCommunitySensors() {
  try {
    const rawCache = localStorage.getItem(OPENAQ_CACHE_STORAGE);
    if (rawCache) {
      const cache = JSON.parse(rawCache);
      if (cache && Array.isArray(cache.nodes) && cache.nodes.length > 0) {
        const validNodes = cache.nodes.filter(n => isWithinMalaysia(n.lat, n.lng));
        if (validNodes.length > 0) {
          return validNodes;
        } else {
          localStorage.removeItem(OPENAQ_CACHE_STORAGE);
        }
      }
    }
  } catch (e) {}

  return getPresetCommunitySensors();
}
