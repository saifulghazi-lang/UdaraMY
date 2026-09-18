<script setup>
import { onMounted, ref, watch, computed, onBeforeUnmount, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import L from 'leaflet';
import { Search, ExternalLink, LocateFixed } from 'lucide-vue-next';
import { getCategoryColor } from '../data/stations.js';
import { calculateDistanceKm } from '../services/locationService.js';
import { useAirQualityStore } from '../stores/airQuality.js';

const props = defineProps({
  stations: {
    type: Array,
    required: true
  },
  communitySensors: {
    type: Array,
    default: () => []
  },
  showCommunity: {
    type: Boolean,
    default: true
  },
  selectedStationId: {
    type: String,
    default: ''
  },
  userLocation: {
    type: [Object, null],
    default: null
  },
  isLocating: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['selectStation', 'viewDashboard', 'locateMe', 'toggleCommunity']);
const { t } = useI18n();
const store = useAirQualityStore();

const mapContainer = ref(null);
const currentFilter = ref('All');
const networkFilter = ref('all'); // 'all' | 'official' | 'community'
const searchQuery = ref('');
const sortBy = ref('api_desc'); // 'api_desc' | 'distance_asc' | 'name_asc'
const isMapInteracting = ref(false);

function enableMapInteraction() {
  if (map && !map.dragging.enabled()) {
    map.dragging.enable();
    isMapInteracting.value = true;
  }
}

let map = null;
let markersLayer = null;
let userLocationLayer = null;
let heatCanvas = null;
let heatCtx = null;
let resizeObserver = null;
let markerMap = {};

// Wind & Smoke Plume overlay
let windCanvas = null;
let windCtx = null;
let windAnimFrame = null;
let windParticles = [];
const WIND_PARTICLE_COUNT_DESKTOP = 110;
const WIND_PARTICLE_COUNT_MOBILE = 55;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function hexToRgba(hex, alpha = 1) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Combined dataset for search and markers
const combinedStations = computed(() => {
  const official = props.stations || [];
  const allCommunity = props.communitySensors || [];

  if (networkFilter.value === 'official') return official;
  if (networkFilter.value === 'community') return allCommunity;
  return props.showCommunity ? [...official, ...allCommunity] : official;
});

// Filter & Sort stations for the side list
const displayedStations = computed(() => {
  let list = combinedStations.value.map(st => {
    const distanceKm = props.userLocation
      ? calculateDistanceKm(props.userLocation.lat, props.userLocation.lng, st.lat, st.lng)
      : null;
    return { ...st, distanceKm };
  }).filter(st => {
    const matchesRegion = currentFilter.value === 'All'
      || (currentFilter.value === 'EastMalaysia'
          ? (st.region === 'Sabah' || st.region === 'Sarawak' || st.region === 'Sabah & Sarawak' || st.region === 'Borneo')
          : st.region === currentFilter.value);
    const q = searchQuery.value.toLowerCase().trim();
    const matchesQuery = !q || 
      st.name.toLowerCase().includes(q) || 
      st.state.toLowerCase().includes(q) ||
      (st.subTitle && st.subTitle.toLowerCase().includes(q));
    return matchesRegion && matchesQuery;
  });

  if (sortBy.value === 'api_desc') {
    return [...list].sort((a, b) => b.api - a.api);
  } else if (sortBy.value === 'distance_asc') {
    return [...list].sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  } else {
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }
});

function createMarkerIcon(station) {
  const color = getCategoryColor(station.category);
  const isSelected = station.id === props.selectedStationId;
  const zoom = map ? map.getZoom() : 6;

  // Zoom-adaptive sizing:
  // National zoom (zoom <= 6.5): compact 20px dot to eliminate overcrowding
  // Regional zoom (7 - 8.5): 25px refined pin
  // Local zoom (>= 9): 32px full detailed pin
  let pinSize = 20;
  let fontSize = 9;
  let borderWidth = 1.5;

  if (zoom >= 9) {
    pinSize = isSelected ? 38 : 32;
    fontSize = isSelected ? 12 : 11;
    borderWidth = 2.5;
  } else if (zoom >= 7) {
    pinSize = isSelected ? 30 : 25;
    fontSize = isSelected ? 11 : 10;
    borderWidth = 2;
  } else {
    pinSize = isSelected ? 26 : 20;
    fontSize = isSelected ? 10 : 9;
    borderWidth = 1.5;
  }

  if (station.isCommunity) {
    const html = `
      <div style="
        background-color: #000000;
        color: ${color};
        font-weight: 900;
        font-size: ${fontSize}px;
        font-family: ui-monospace, monospace;
        width: ${pinSize}px;
        height: ${pinSize}px;
        border-radius: 9999px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 4px rgba(0,0,0,0.5), 0 0 ${isSelected ? '12px' : '4px'} ${color}99;
        border: ${isSelected ? '2.5px solid #ffffff' : `${borderWidth}px dashed ${color}`};
        transform: translate(-50%, -50%);
        transition: all 0.15s ease;
        cursor: pointer;
      ">
        ${zoom >= 7 ? '<span style="font-size: 10px; line-height: 1; transform: scale(0.8); margin-top: -1px;">👥</span>' : ''}
        <span style="line-height: 1;">${station.api}</span>
      </div>
    `;
    return L.divIcon({
      html,
      className: 'custom-community-pin',
      iconSize: [pinSize, pinSize]
    });
  }

  const html = `
    <div style="
      background-color: ${color};
      color: #0f172a;
      font-weight: 800;
      font-size: ${fontSize}px;
      font-family: monospace;
      width: ${pinSize}px;
      height: ${pinSize}px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4), 0 0 ${isSelected ? '12px' : '4px'} ${color};
      border: ${isSelected ? '2.5px solid #ffffff' : `${borderWidth}px solid rgba(255,255,255,0.9)`};
      transform: translate(-50%, -50%);
      transition: all 0.15s ease;
      cursor: pointer;
    ">
      ${station.api}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-station-pin',
    iconSize: [pinSize, pinSize]
  });
}

function initHeatmapCanvas() {
  if (!map) return;
  const pane = map.getPane('overlayPane');
  if (!pane) return;

  heatCanvas = document.createElement('canvas');
  heatCanvas.className = 'leaflet-haze-canvas';
  heatCanvas.style.position = 'absolute';
  heatCanvas.style.pointerEvents = 'none';
  heatCanvas.style.zIndex = '350';
  pane.appendChild(heatCanvas);
  heatCtx = heatCanvas.getContext('2d');

  map.on('move', drawHeatmap);
  map.on('moveend', drawHeatmap);
  map.on('zoom', drawHeatmap);
  map.on('zoomend', () => {
    drawHeatmap();
    renderMarkers(); // dynamically re-adjust pin sizes on zoom!
  });
  map.on('resize', drawHeatmap);
  map.on('viewreset', drawHeatmap);

  drawHeatmap();
}

function drawHeatmap() {
  if (!heatCanvas || !heatCtx || !map) return;
  heatCanvas.style.display = 'block';

  const size = map.getSize();
  if (size.x <= 0 || size.y <= 0) return;

  const mapPos = map.containerPointToLayerPoint([0, 0]);
  L.DomUtil.setPosition(heatCanvas, mapPos);

  if (heatCanvas.width !== size.x || heatCanvas.height !== size.y) {
    heatCanvas.width = size.x;
    heatCanvas.height = size.y;
    heatCanvas.style.width = `${size.x}px`;
    heatCanvas.style.height = `${size.y}px`;
  }
  heatCtx.clearRect(0, 0, size.x, size.y);

  // Radius scales smoothly with map zoom level
  const zoom = map.getZoom();
  const baseRadius = Math.max(32, Math.min(130, (zoom - 4) * 18 + 36));

  props.stations.forEach(st => {
    const pt = map.latLngToContainerPoint([st.lat, st.lng]);
    const radius = Math.round(baseRadius * (0.8 + (st.api / 200) * 0.6));
    
    // Generous bounding check with radius buffer to prevent edge clipping
    if (
      pt.x < -radius * 2 ||
      pt.y < -radius * 2 ||
      pt.x > size.x + radius * 2 ||
      pt.y > size.y + radius * 2
    ) {
      return;
    }

    const hexColor = getCategoryColor(st.category);

    const grad = heatCtx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
    grad.addColorStop(0, hexToRgba(hexColor, 0.50));
    grad.addColorStop(0.35, hexToRgba(hexColor, 0.30));
    grad.addColorStop(0.70, hexToRgba(hexColor, 0.10));
    grad.addColorStop(1, hexToRgba(hexColor, 0.0));

    heatCtx.fillStyle = grad;
    heatCtx.beginPath();
    heatCtx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    heatCtx.fill();
  });
}

// ─── Wind & Smoke Plume Canvas Overlay ────────────────────────────────────────

function isMobileViewport() {
  return typeof window !== 'undefined' && (window.innerWidth < 1024 || L.Browser.mobile);
}

function initWindCanvas() {
  if (!map) return;
  if (windCanvas) return; // already initialised

  const pane = map.getPane('overlayPane');
  if (!pane) return;

  windCanvas = document.createElement('canvas');
  windCanvas.className = 'leaflet-wind-canvas';
  windCanvas.style.cssText = 'position:absolute;pointer-events:none;z-index:400;';
  pane.appendChild(windCanvas);
  windCtx = windCanvas.getContext('2d');

  resizeWindCanvas();
  spawnParticles();
  scheduleWindFrame();

  // keep canvas in sync with map movements
  map.on('move moveend zoom zoomend viewreset resize', resizeWindCanvas);
}

function resizeWindCanvas() {
  if (!windCanvas || !map) return;
  const size = map.getSize();
  if (size.x <= 0 || size.y <= 0) return;

  const mapPos = map.containerPointToLayerPoint([0, 0]);
  L.DomUtil.setPosition(windCanvas, mapPos);

  if (windCanvas.width !== size.x || windCanvas.height !== size.y) {
    windCanvas.width = size.x;
    windCanvas.height = size.y;
    windCanvas.style.width = `${size.x}px`;
    windCanvas.style.height = `${size.y}px`;
    // re-spawn particles so they fit the new viewport
    spawnParticles();
  }
}

function spawnParticles() {
  if (!windCanvas || !map) return;
  const count = isMobileViewport() ? WIND_PARTICLE_COUNT_MOBILE : WIND_PARTICLE_COUNT_DESKTOP;
  const w = windCanvas.width;
  const h = windCanvas.height;

  windParticles = Array.from({ length: count }, () => spawnOneParticle(w, h));
}

function spawnOneParticle(w, h) {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    age: 0,
    life: 40 + Math.floor(Math.random() * 50), // 40–90 ticks
    alpha: 0.15 + Math.random() * 0.35,
    trail: [] // position history for fading tail
  };
}

function getWindAtPixel(px, py) {
  if (!map) return { u: 5, v: -7 };
  try {
    const latlng = map.containerPointToLatLng([px, py]);
    const grid = store.windFieldGrid;
    if (!grid || grid.length === 0) return { u: 5, v: -7 };

    let totalW = 0, wu = 0, wv = 0;
    for (const node of grid) {
      const dLat = latlng.lat - node.lat;
      const dLng = latlng.lng - node.lng;
      const distSq = dLat * dLat + dLng * dLng;
      const w = 1 / (distSq + 0.05);
      totalW += w;
      wu += node.u * w;
      wv += node.v * w;
    }
    return { u: wu / totalW, v: wv / totalW };
  } catch {
    return { u: 5, v: -7 };
  }
}

const PARTICLE_SCALE = 0.25; // pixels per km/h unit per tick
const TRAIL_LENGTH = 8;      // historic positions kept per particle

function drawWindFrame() {
  if (!windCtx || !windCanvas || !map || !store.showWindOverlay) return;

  const w = windCanvas.width;
  const h = windCanvas.height;

  // Clear the canvas each frame — keeps map tiles visible underneath
  windCtx.clearRect(0, 0, w, h);

  for (let i = 0; i < windParticles.length; i++) {
    const p = windParticles[i];
    const wind = getWindAtPixel(p.x, p.y);

    // Advance particle in wind direction (u = east, v = north → screen −y)
    const dx = wind.u * PARTICLE_SCALE;
    const dy = -wind.v * PARTICLE_SCALE;

    const nx = p.x + dx;
    const ny = p.y + dy;

    // Record current position in trail before moving
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > TRAIL_LENGTH) p.trail.shift();

    // Draw fading polyline trail — oldest segment is most transparent
    if (p.trail.length >= 2) {
      const speed = Math.sqrt(wind.u * wind.u + wind.v * wind.v);
      const hue = speed < 10 ? 180 : speed < 20 ? 38 : 0; // teal → amber → red
      for (let t = 1; t < p.trail.length; t++) {
        const segAlpha = p.alpha * (t / p.trail.length);
        windCtx.strokeStyle = `hsla(${hue}, 90%, 68%, ${segAlpha})`;
        windCtx.lineWidth = 1.2;
        windCtx.beginPath();
        windCtx.moveTo(p.trail[t - 1].x, p.trail[t - 1].y);
        windCtx.lineTo(p.trail[t].x, p.trail[t].y);
        windCtx.stroke();
      }
    }

    p.x = nx;
    p.y = ny;
    p.age++;

    // Respawn if out of bounds or aged out
    if (p.age >= p.life || nx < -4 || ny < -4 || nx > w + 4 || ny > h + 4) {
      windParticles[i] = spawnOneParticle(w, h);
    }
  }

  // Draw smoke plume threat cones
  drawPlumeCones();
}

function drawPlumeCones() {
  const plumes = store.activePlumes;
  if (!plumes || plumes.length === 0 || !windCtx || !map) return;

  for (const plume of plumes) {
    if (!plume || !plume.isPointingAtMalaysia) continue;

    // Project origin to screen pixel
    let originPt;
    try {
      originPt = map.latLngToContainerPoint([plume.originLat, plume.originLng]);
    } catch { continue; }

    // Project a point 300 km downwind to get cone head pixel
    const RAD = Math.PI / 180;
    const KM_PER_DEG = 111.32;
    const headingDeg = plume.headingDeg;
    const lengthKm = plume.lengthKm || 280;

    const dLat = (Math.cos(headingDeg * RAD) * lengthKm) / KM_PER_DEG;
    const dLng = (Math.sin(headingDeg * RAD) * lengthKm) / (KM_PER_DEG * Math.cos(plume.originLat * RAD));

    let headPt;
    try {
      headPt = map.latLngToContainerPoint([plume.originLat + dLat, plume.originLng + dLng]);
    } catch { continue; }

    const dx = headPt.x - originPt.x;
    const dy = headPt.y - originPt.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) continue;

    const angle = Math.atan2(dy, dx);
    const halfArc = (plume.arcDeg || 35) * RAD * 0.5;

    // Colour by threat level
    const isSevere = plume.threatLevel === 'severe';
    const isElevated = plume.threatLevel === 'elevated';
    const coneColor = isSevere ? '355, 90%, 60%' : isElevated ? '38, 95%, 58%' : '180, 80%, 55%';
    const coneAlpha = isSevere ? 0.18 : isElevated ? 0.13 : 0.08;

    // Draw cone as a filled arc sector
    windCtx.save();
    windCtx.beginPath();
    windCtx.moveTo(originPt.x, originPt.y);
    windCtx.arc(originPt.x, originPt.y, dist, angle - halfArc, angle + halfArc);
    windCtx.closePath();

    const grad = windCtx.createRadialGradient(originPt.x, originPt.y, 0, originPt.x, originPt.y, dist);
    grad.addColorStop(0, `hsla(${coneColor}, ${coneAlpha * 2})`);
    grad.addColorStop(0.5, `hsla(${coneColor}, ${coneAlpha})`);
    grad.addColorStop(1, `hsla(${coneColor}, 0)`);
    windCtx.fillStyle = grad;
    windCtx.fill();

    // Pulsing boundary edges
    windCtx.strokeStyle = `hsla(${coneColor}, 0.55)`;
    windCtx.lineWidth = isSevere ? 1.5 : 1;
    windCtx.setLineDash([5, 4]);
    windCtx.stroke();
    windCtx.setLineDash([]);
    windCtx.restore();

    // ETA label at ~70% along the cone axis
    const labelX = originPt.x + dx * 0.70;
    const labelY = originPt.y + dy * 0.70;
    const labelText = `🔥 ${plume.label}`;

    windCtx.save();
    windCtx.font = 'bold 10px ui-monospace, monospace';
    windCtx.textAlign = 'center';
    windCtx.textBaseline = 'middle';

    // Background pill
    const textW = windCtx.measureText(labelText).width;
    const pad = 5;
    windCtx.fillStyle = 'rgba(0,0,0,0.65)';
    windCtx.beginPath();
    windCtx.roundRect(labelX - textW / 2 - pad, labelY - 8, textW + pad * 2, 16, 4);
    windCtx.fill();

    windCtx.fillStyle = isSevere ? '#ff6b6b' : isElevated ? '#fbbf24' : '#2dd4bf';
    windCtx.fillText(labelText, labelX, labelY);
    windCtx.restore();
  }
}

let lastFrameTime = 0;
const TARGET_FPS = 35;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

function scheduleWindFrame() {
  if (!store.showWindOverlay) {
    // If overlay is off, ensure canvas is cleared and stop
    if (windCtx && windCanvas) {
      windCtx.clearRect(0, 0, windCanvas.width, windCanvas.height);
    }
    windAnimFrame = null;
    return;
  }

  windAnimFrame = requestAnimationFrame((timestamp) => {
    if (timestamp - lastFrameTime >= FRAME_INTERVAL) {
      lastFrameTime = timestamp;
      drawWindFrame();
    }
    scheduleWindFrame();
  });
}

function startWindOverlay() {
  if (!map) return;
  if (!windCanvas) initWindCanvas();
  if (windCanvas) windCanvas.style.display = 'block';
  resizeWindCanvas();
  spawnParticles();
  if (!windAnimFrame) scheduleWindFrame();
}

function stopWindOverlay() {
  if (windAnimFrame) {
    cancelAnimationFrame(windAnimFrame);
    windAnimFrame = null;
  }
  if (windCtx && windCanvas) {
    windCtx.clearRect(0, 0, windCanvas.width, windCanvas.height);
    windCanvas.style.display = 'none';
  }
}

function teardownWindCanvas() {
  stopWindOverlay();
  if (windCanvas && windCanvas.parentNode) {
    windCanvas.parentNode.removeChild(windCanvas);
    windCanvas = null;
    windCtx = null;
  }
}

// Watch store.showWindOverlay and toggle the canvas accordingly
watch(() => store.showWindOverlay, (active) => {
  if (active) startWindOverlay();
  else stopWindOverlay();
});

// Watch windFieldGrid changes so particles pick up fresh wind data
watch(() => store.windFieldGrid, () => {
  if (store.showWindOverlay && windParticles.length === 0) spawnParticles();
}, { deep: true });



function renderUserLocation() {
  if (!map) return;
  if (!userLocationLayer) {
    userLocationLayer = L.layerGroup().addTo(map);
  }
  userLocationLayer.clearLayers();


  if (!props.userLocation) return;

  const { lat, lng, accuracy } = props.userLocation;

  // Cyan pulsing dot for user GPS position (Cyan Pulse token)
  const userIcon = L.divIcon({
    html: `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background: #00d2ff; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <span style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background: #0284c7; border: 2.5px solid #ffffff; box-shadow: 0 0 12px rgba(0,210,255,0.9);"></span>
      </div>
    `,
    className: 'user-gps-marker',
    iconSize: [24, 24]
  });

  const marker = L.marker([lat, lng], { icon: userIcon });
  marker.bindPopup(`
    <div class="ud-popup text-xs font-bold text-slate-900 dark:text-white p-0.5">
      📍 ${t('location.nearest') || 'Lokasi Anda'}
    </div>
  `);
  userLocationLayer.addLayer(marker);

  if (accuracy && accuracy < 8000) {
    const halo = L.circle([lat, lng], {
      radius: accuracy,
      color: '#00d2ff',
      weight: 1,
      fillColor: '#00d2ff',
      fillOpacity: 0.12
    });
    userLocationLayer.addLayer(halo);
  }
}

function renderMarkers() {
  if (!map || !markersLayer) return;

  // Remember which popup was open before we clear
  let openPopupStationId = null;
  for (const [id, m] of Object.entries(markerMap)) {
    if (m.isPopupOpen && m.isPopupOpen()) {
      openPopupStationId = id;
      break;
    }
  }

  markersLayer.clearLayers();
  Object.keys(markerMap).forEach(k => delete markerMap[k]);

  combinedStations.value.forEach(st => {
      const isSelected = st.id === props.selectedStationId;
      const icon = createMarkerIcon(st);
      const marker = L.marker([st.lat, st.lng], { 
        icon,
        zIndexOffset: isSelected ? 10000 : (st.api || 0)
      });

      const distStr = st.distanceKm !== undefined && st.distanceKm !== null ? t('map.distanceAway', { km: st.distanceKm }) : '';
      const safeSensorModel = escapeHtml(st.sensorModel?.split(' ')[0] || 'Sensor');
      const safeState = escapeHtml(st.state);
      const safeDistStr = escapeHtml(distStr);
      const safeName = escapeHtml(st.name);
      const safeSubTitle = st.subTitle ? escapeHtml(st.subTitle) : '';
      const safeElementId = encodeURIComponent(st.id);

      const communityHeaderHtml = st.isCommunity ? `
        <div class="ud-popup-community-tag">
          <span class="ud-popup-badge-community">
            👥 ${t('community.badge')} (${t('community.unvalidated')})
          </span>
          <span class="ud-popup-sensor-model">${safeSensorModel}</span>
        </div>
      ` : '';

      const communityMetricsHtml = st.isCommunity ? `
        <div class="ud-popup-metrics">
          <div class="ud-popup-metric-row">
            <span class="text-slate-500 dark:text-neutral-400">${t('community.rawPm25')}:</span>
            <span class="font-bold font-mono">${Number(st.rawPm25) || 0} µg/m³</span>
          </div>
          <div class="ud-popup-metric-row">
            <span class="text-cyan-600 dark:text-cyan-400">${t('community.calibratedPm25')} (RH ${Number(st.humidity) || 0}%):</span>
            <span class="font-bold font-mono text-cyan-600 dark:text-cyan-400">${Number(st.calibratedPm25) || 0} µg/m³</span>
          </div>
        </div>
      ` : '';

      const isPinned = store.watchlist && store.watchlist.some(w => w.id === st.id);

      const popupHtml = `
        <div class="ud-popup">
          ${communityHeaderHtml}
          <div class="ud-popup-state">${safeState}${safeDistStr}</div>
          <div class="ud-popup-name">${safeName}</div>
          ${safeSubTitle ? `<div class="ud-popup-subtitle">${safeSubTitle}</div>` : ''}
          ${communityMetricsHtml}
          <div class="ud-popup-footer">
            <span class="ud-popup-category">${st.isCommunity ? t('community.equivApi') : (t(`categories.${st.category}`) || st.category)}</span>
            <span class="ud-popup-api" style="color: ${getCategoryColor(st.category)};">API ${Number(st.api) || 0}</span>
          </div>
          <div class="ud-popup-actions">
            <button id="btn-dash-${safeElementId}" class="ud-popup-btn-primary">
              ${t('map.viewFullDashboard') || 'Open Dashboard →'}
            </button>
            <button id="btn-pin-${safeElementId}" class="ud-popup-btn-secondary">
              ⭐ ${isPinned ? (t('watchlist.pinned') || 'Pinned') : (t('map.pinWatchlist') || 'Pin Watchlist')}
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { closeOnClick: false, autoPan: true });

      marker.on('popupopen', (e) => {
        const popupNode = e.popup?.getElement?.() || marker.getPopup()?.getElement();
        if (popupNode) {
          L.DomEvent.disableClickPropagation(popupNode);
          L.DomEvent.disableScrollPropagation(popupNode);
        }

        const btnDash = document.getElementById(`btn-dash-${safeElementId}`);
        if (btnDash) {
          L.DomEvent.on(btnDash, 'click', (ev) => {
            L.DomEvent.stopPropagation(ev);
            emit('selectStation', st.id);
            emit('viewDashboard');
          });
        }

        const btnPin = document.getElementById(`btn-pin-${safeElementId}`);
        if (btnPin) {
          L.DomEvent.on(btnPin, 'click', (ev) => {
            L.DomEvent.stopPropagation(ev);
            store.toggleWatchlist(st.id);
            renderMarkers();
          });
        }
      });

      marker.on('click', () => {
        emit('selectStation', st.id);
        nextTick(() => {
          const el = document.getElementById(`station-item-${st.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      });

      markersLayer.addLayer(marker);
      markerMap[st.id] = marker;
    });

  // Re-open the popup that was open before the re-render
  if (openPopupStationId && markerMap[openPopupStationId]) {
    nextTick(() => markerMap[openPopupStationId]?.openPopup());
  }

  drawHeatmap();
  renderUserLocation();
}

function onStationClick(id, shouldOpenPopup = true) {
  emit('selectStation', id);
  const st = combinedStations.value.find(s => s.id === id);
  if (st && map) {
    map.flyTo([st.lat, st.lng], 9, { duration: 0.6 });
    if (shouldOpenPopup && markerMap[id]) {
      setTimeout(() => {
        if (markerMap[id]) {
          markerMap[id].openPopup();
        }
      }, 200);
    }
  }

  nextTick(() => {
    const el = document.getElementById(`station-item-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

function zoomToRegion(region) {
  currentFilter.value = region;
  if (!map) return;

  if (region === 'Peninsular') {
    map.flyTo([4.2105, 101.9758], 7);
  } else if (region === 'EastMalaysia' || region === 'Sabah' || region === 'Sarawak') {
    map.flyTo([3.5, 114.5], 6.5);
  } else {
    map.flyTo([4.2105, 108.5], 6);
  }
}

function getFilterPillClass(isActive) {
  return isActive
    ? 'bg-indigo-600 text-white shadow-sm'
    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white';
}

function getSortPillClass(isActive) {
  return isActive
    ? 'bg-indigo-600 text-white shadow-sm'
    : 'bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white';
}

onMounted(() => {
  if (!mapContainer.value) return;

  const isMobile = typeof window !== 'undefined' && (window.innerWidth < 1024 || L.Browser.mobile);
  map = L.map(mapContainer.value, {
    center: [4.2105, 108.5],
    zoom: 6,
    minZoom: 5,
    maxZoom: 14,
    zoomControl: false,
    dragging: !isMobile,
    tap: !isMobile
  });

  L.control.zoom({ position: 'topright' }).addTo(map);

  // Standard OpenStreetMap with dark theme filter (100% open-source, no API key required)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    className: 'dark-osm-tiles'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  userLocationLayer = L.layerGroup().addTo(map);

  initHeatmapCanvas();
  renderMarkers();
  renderUserLocation();

  // Initialise wind overlay if the store already flagged it active (e.g. high hotspot auto-activation)
  if (store.showWindOverlay) {
    nextTick(() => startWindOverlay());
  }

  // If already a selected station, focus on it
  if (props.selectedStationId) {
    const selected = props.stations.find(s => s.id === props.selectedStationId);
    if (selected) {
      map.setView([selected.lat, selected.lng], 8);
    }
  }

  setTimeout(() => {
    if (map) {
      map.invalidateSize();
      drawHeatmap();
    }
  }, 250);

  if (typeof ResizeObserver !== 'undefined' && mapContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      if (map) {
        map.invalidateSize();
        drawHeatmap();
      }
    });
    resizeObserver.observe(mapContainer.value);
  }

  window.addEventListener('resize', () => {
    if (map) {
      map.invalidateSize();
      drawHeatmap();
    }
  });
});

watch(() => [props.stations, props.communitySensors, props.showCommunity, networkFilter.value], () => {
  renderMarkers();
  drawHeatmap();
}, { deep: true });

watch(() => props.selectedStationId, (newId, oldId) => {
  if (oldId && markerMap[oldId]) {
    const oldSt = combinedStations.value.find(s => s.id === oldId);
    if (oldSt) {
      markerMap[oldId].setIcon(createMarkerIcon(oldSt));
      markerMap[oldId].setZIndexOffset(oldSt.api || 0);
    }
  }
  if (newId && markerMap[newId]) {
    const newSt = combinedStations.value.find(s => s.id === newId);
    if (newSt) {
      // Check if this marker's popup is currently open before setIcon destroys it
      const wasPopupOpen = markerMap[newId].isPopupOpen();
      markerMap[newId].setIcon(createMarkerIcon(newSt));
      markerMap[newId].setZIndexOffset(10000);
      // setIcon() destroys the marker DOM and closes any open popup — re-open it
      if (wasPopupOpen) {
        nextTick(() => markerMap[newId]?.openPopup());
      }
    }
  }
});

watch(() => props.userLocation, () => {
  renderUserLocation();
  if (props.userLocation && map) {
    map.flyTo([props.userLocation.lat, props.userLocation.lng], 9);
  }
}, { deep: true });

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  teardownWindCanvas();
  if (map) {
    map.off('move moveend zoom zoomend viewreset resize', resizeWindCanvas);
    map.remove();
  }
});
</script>

<template>
  <div class="space-y-3">
    <!-- Header with Subtitle, Mode Switcher, Network Filter & Regional Filters -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
      <div>
        <h2 class="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>{{ t('map.title') }}</span>
          <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
            {{ combinedStations.length }} stations
          </span>
          <span v-if="communitySensors.length > 0" class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
            👥 +{{ communitySensors.length }} community
          </span>
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ t('map.sub') }}</p>
      </div>

      <!-- Controls: Consolidated Network & Region Selectors -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Network Selector (All / DOE / Community) -->
        <div class="flex items-center gap-1 bg-slate-100 dark:bg-black border border-slate-200 dark:border-white/10 rounded-full p-1 text-xs">
          <button
            @click="networkFilter = 'all'"
            :class="['px-3 py-1 rounded-full font-medium transition', getFilterPillClass(networkFilter === 'all')]"
            title="Show all official DOE stations and community sensors"
          >
            {{ t('map.filterAll') }}
          </button>
          <button
            @click="networkFilter = 'official'"
            :class="['px-3 py-1 rounded-full font-medium transition', getFilterPillClass(networkFilter === 'official')]"
            title="Official DOE APIMS stations only"
          >
            🏛️ DOE ({{ stations.length }})
          </button>
          <button
            @click="networkFilter = 'community'"
            :class="['px-3 py-1 rounded-full font-medium transition', getFilterPillClass(networkFilter === 'community')]"
            title="Citizen community sensors (PurpleAir / AirVisual)"
          >
            👥 Community ({{ communitySensors.length }})
          </button>
        </div>

        <!-- Region Quick Filter -->
        <div class="flex items-center gap-1 bg-slate-100 dark:bg-black border border-slate-200 dark:border-white/10 rounded-full p-1 text-xs">
          <button
            @click="zoomToRegion('All')"
            :class="['px-2.5 py-1 rounded-full text-[11px] font-medium transition', getFilterPillClass(currentFilter === 'All')]"
          >
            {{ t('map.filterAll') }}
          </button>
          <button
            @click="zoomToRegion('Peninsular')"
            :class="['px-2.5 py-1 rounded-full text-[11px] font-medium transition', getFilterPillClass(currentFilter === 'Peninsular')]"
          >
            {{ t('map.filterPeninsular') }}
          </button>
          <button
            @click="zoomToRegion('EastMalaysia')"
            :class="['px-2.5 py-1 rounded-full text-[11px] font-medium transition', getFilterPillClass(currentFilter === 'EastMalaysia')]"
          >
            {{ t('map.filterBorneo') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Split Layout: Interactive Map + Side Station List -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
      
      <!-- Left: Interactive Leaflet Map (Col 7 / 8) -->
      <div class="lg:col-span-7 xl:col-span-8 relative w-full h-[400px] lg:h-[640px] rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl isolate bg-slate-100 dark:bg-black">
        <div ref="mapContainer" class="w-full h-full z-0"></div>

        <!-- Locate Me Floating GPS Button on Map -->
        <button
          @click="emit('locateMe')"
          :class="[
            'absolute top-3 left-3 z-[1000] px-3.5 py-2 rounded-full bg-white/95 dark:bg-black/90 hover:bg-slate-100 dark:hover:bg-neutral-950 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xl transition flex items-center gap-2 text-xs font-semibold focus:outline-none',
            isLocating ? 'text-amber-500 dark:text-amber-300 ring-2 ring-amber-400/50' : 'text-slate-800 dark:text-white'
          ]"
          :title="isLocating ? t('location.locating') : t('location.locateMe')"
        >
          <LocateFixed :class="['w-4 h-4 text-indigo-500 dark:text-indigo-400', isLocating ? 'animate-spin text-amber-500 dark:text-amber-300' : '']" />
          <span>{{ isLocating ? t('location.locating') : t('location.locateMe') }}</span>
        </button>

        <!-- 💨 Wind & Smoke Plume Toggle Button -->
        <button
          @click="store.toggleWindOverlay()"
          :class="[
            'absolute top-14 left-3 z-[1000] px-3.5 py-2 rounded-full backdrop-blur-md border shadow-xl transition flex items-center gap-2 text-xs font-bold focus:outline-none',
            store.showWindOverlay
              ? store.isPlumeThreatActive
                ? 'bg-amber-500/90 dark:bg-amber-600/90 border-amber-400 text-white shadow-amber-500/40'
                : 'bg-cyan-500/20 dark:bg-cyan-500/25 border-cyan-500/60 text-cyan-700 dark:text-cyan-300'
              : 'bg-white/95 dark:bg-black/90 border-slate-200 dark:border-white/10 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white'
          ]"
          :title="store.showWindOverlay ? t('windOverlay.hideOverlay') : t('windOverlay.showOverlay')"
        >
          <span class="text-base leading-none" :class="store.showWindOverlay ? 'animate-pulse' : ''">💨</span>
          <span>{{ store.showWindOverlay ? t('windOverlay.active') : t('windOverlay.toggle') }}</span>
          <span
            v-if="store.isPlumeThreatActive && !store.showWindOverlay"
            class="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"
          ></span>
        </button>

        <!-- Mobile Tap-to-Interact Prompt Overlay Button -->
        <button
          v-if="!isMapInteracting"
          @click="enableMapInteraction"
          class="lg:hidden absolute top-3 right-3 z-[1000] px-3.5 py-2 rounded-full bg-white/95 dark:bg-black/90 hover:bg-slate-100 dark:hover:bg-neutral-950 backdrop-blur-md border border-indigo-500/40 text-indigo-600 dark:text-indigo-300 shadow-xl transition flex items-center gap-1.5 text-xs font-bold focus:outline-none"
        >
          <span>👆 {{ t('guidance.tapToInteractMap') }}</span>
        </button>


        <!-- Floating Discreet Color Scale Legend on Map -->
        <div class="absolute bottom-3 right-3 z-30 bg-white/90 dark:bg-black/90 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2 text-[10px] font-mono font-bold select-none">
          <span class="text-slate-500 dark:text-neutral-400 text-[9px] uppercase tracking-wider">AQI:</span>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-[#00d2ff]" title="0-50 Good"></span>
            <span class="w-2 h-2 rounded-full bg-emerald-500" title="51-100 Moderate"></span>
            <span class="w-2 h-2 rounded-full bg-amber-500" title="101-200 Unhealthy"></span>
            <span class="w-2 h-2 rounded-full bg-red-500" title="201-300 Very Unhealthy"></span>
            <span class="w-2 h-2 rounded-full bg-[#881337]" title="301+ Hazardous"></span>
          </div>
        </div>
      </div>

      <!-- Right: Station List (Col 5 / 4) - Does NOT close the map! -->
      <div class="lg:col-span-5 xl:col-span-4 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-3xl p-3.5 flex flex-col h-[420px] lg:h-[640px] shadow-2xl">
        
        <!-- Search & Sort Controls -->
        <div class="space-y-2 pb-3 border-b border-slate-200 dark:border-white/10">
          <div class="relative flex items-center">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('app.searchStation')"
              class="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 rounded-full py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          <div class="flex items-center justify-between text-xs px-1 gap-2 flex-wrap">
            <span class="text-slate-500 dark:text-neutral-400 font-medium">
              {{ displayedStations.length }} stations
            </span>

            <!-- Sort Toggle Dropdown / Buttons -->
            <div class="flex items-center gap-1">
              <button
                v-if="userLocation"
                @click="sortBy = 'distance_asc'"
                :class="['px-2.5 py-1 rounded-full text-[10px] font-medium transition', getSortPillClass(sortBy === 'distance_asc')]"
              >
                📍 Nearest
              </button>
              <button
                @click="sortBy = 'api_desc'"
                :class="['px-2.5 py-1 rounded-full text-[10px] font-medium transition', getSortPillClass(sortBy === 'api_desc')]"
              >
                🔥 Haze Watch
              </button>
              <button
                @click="sortBy = 'name_asc'"
                :class="['px-2.5 py-1 rounded-full text-[10px] font-medium transition', getSortPillClass(sortBy === 'name_asc')]"
              >
                A-Z
              </button>
            </div>
          </div>
        </div>

        <!-- Scrollable Stations List -->
        <div class="flex-1 overflow-y-auto pt-2 space-y-1.5 custom-scrollbar pr-0.5">
          <div
            v-for="st in displayedStations"
            :key="st.id"
            :id="`station-item-${st.id}`"
            @click="onStationClick(st.id, true)"
            :class="[
              'p-2.5 rounded-2xl border transition flex items-center justify-between cursor-pointer group',
              st.id === selectedStationId
                ? 'bg-indigo-50 border-indigo-500 text-indigo-900 dark:bg-indigo-950/60 dark:border-indigo-500/70 dark:text-white shadow-md ring-1 ring-indigo-500/40'
                : 'bg-slate-50 dark:bg-neutral-950/60 border-slate-200/80 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-neutral-900 hover:border-slate-300 dark:hover:border-white/15'
            ]"
          >
            <!-- Left Info -->
            <div class="min-w-0 pr-2">
              <div class="font-bold text-slate-900 dark:text-white text-xs truncate flex items-center gap-1.5 flex-wrap">
                <span class="truncate">{{ st.name }}</span>
                <span
                  v-if="st.isCommunity"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/30 text-purple-700 dark:text-purple-300 border border-purple-500/40 shrink-0"
                >
                  👥 Komuniti
                </span>
                <span
                  v-if="st.id === selectedStationId"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 shrink-0 border border-indigo-500/30"
                >
                  Active
                </span>
                <span
                  v-if="st.distanceKm !== null"
                  class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-neutral-300 font-mono shrink-0"
                >
                  {{ st.distanceKm }} km
                </span>
              </div>
              <div class="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5 truncate">
                <span v-if="st.isCommunity" class="text-purple-600 dark:text-purple-400 font-medium">{{ st.sensorModel }} • </span>
                {{ st.state }} • {{ st.region }}
              </div>
            </div>

            <!-- Right: API Badge & Dashboard Link -->
            <div class="flex items-center gap-2 shrink-0">
              <!-- API Pill -->
              <span
                class="px-2.5 py-0.5 rounded-full font-mono text-xs font-black"
                :style="{
                  backgroundColor: `${getCategoryColor(st.category)}22`,
                  color: getCategoryColor(st.category),
                  border: `1px solid ${getCategoryColor(st.category)}44`
                }"
              >
                {{ st.api }}
              </span>

              <!-- Quick Switch to Full Dashboard Button -->
              <button
                @click.stop="() => { emit('selectStation', st.id); emit('viewDashboard'); }"
                class="p-1.5 rounded-full bg-slate-100 dark:bg-neutral-950 hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition opacity-80 group-hover:opacity-100 border border-slate-200 dark:border-white/10"
                title="View full dashboard for this station"
              >
                <ExternalLink class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div v-if="displayedStations.length === 0" class="py-12 text-center text-neutral-400 text-xs flex flex-col items-center gap-3">
            <p>{{ t('map.noStationsFound', { query: searchQuery }) || `No stations found for "${searchQuery}"` }}</p>
            <button
              @click="searchQuery = ''; currentFilter = 'All'; networkFilter = 'all';"
              class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow"
            >
              {{ t('guidance.clearSearch') }}
            </button>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>
