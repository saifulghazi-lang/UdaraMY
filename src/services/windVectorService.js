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
