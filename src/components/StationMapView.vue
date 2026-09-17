<script setup>
import { onMounted, ref, watch, computed, onBeforeUnmount, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import L from 'leaflet';
import { Search, Flame, ArrowUpDown, ExternalLink, Layers, Eye, LocateFixed } from 'lucide-vue-next';
import { getCategoryColor } from '../data/stations.js';
import { calculateDistanceKm } from '../services/locationService.js';

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

const mapContainer = ref(null);
const currentFilter = ref('All');
const networkFilter = ref('all'); // 'all' | 'official' | 'community'
const searchQuery = ref('');
const sortBy = ref('api_desc'); // 'api_desc' | 'distance_asc' | 'name_asc'
const mapViewMode = ref('both'); // 'both' | 'heatmap' | 'pins'
const isMapInteracting = ref(false);
const isFilterDrawerOpen = ref(false);

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
const markerMap = {};

function hexToRgba(hex, alpha) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Combined stations based on network filter and community toggle
const combinedStations = computed(() => {
  const isMalaysia = (s) => typeof s.lat === 'number' && typeof s.lng === 'number' && s.lat >= 0.8 && s.lat <= 7.5 && s.lng >= 99.5 && s.lng <= 119.5;
  const official = props.stations.filter(isMalaysia).map(s => ({ ...s, isCommunity: false }));
  const allCommunity = (props.communitySensors || []).filter(isMalaysia).map(s => ({ ...s, isCommunity: true }));
  
  if (networkFilter.value === 'official') return official;
  if (networkFilter.value === 'community') return allCommunity;
  // In 'all' view, only include community if the toggle is enabled
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
    const matchesRegion = currentFilter.value === 'All' || st.region === currentFilter.value;
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

  if (mapViewMode.value === 'pins') {
    heatCanvas.style.display = 'none';
    return;
  }
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

  const showPins = mapViewMode.value !== 'heatmap';

  if (showPins) {
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

      const popupHtml = `
        <div class="ud-popup">
          ${communityHeaderHtml}
          <div class="ud-popup-state">${safeState}${safeDistStr}</div>
          <div class="ud-popup-name">${safeName}</div>
          ${safeSubTitle ? `<div class="ud-popup-subtitle">${safeSubTitle}</div>` : ''}
          ${communityMetricsHtml}
          <div class="ud-popup-footer">
            <span class="ud-popup-category">${st.isCommunity ? t('community.equivApi') : st.category}</span>
            <span class="ud-popup-api" style="color: ${getCategoryColor(st.category)};">API ${Number(st.api) || 0}</span>
          </div>
          <div class="ud-popup-actions">
            <button id="btn-select-${safeElementId}" class="ud-popup-btn-select">
              ${t('map.select')}
            </button>
            <button id="btn-dash-${safeElementId}" class="ud-popup-btn-dash">
              ${t('map.dashboard')}
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { closeOnClick: false, autoPan: true });

      marker.on('popupopen', () => {
        const btnSelect = document.getElementById(`btn-select-${safeElementId}`);
        if (btnSelect) {
          btnSelect.onclick = () => {
            onStationClick(st.id, false);
          };
        }
        const btnDash = document.getElementById(`btn-dash-${safeElementId}`);
        if (btnDash) {
          btnDash.onclick = () => {
            emit('selectStation', st.id);
            emit('viewDashboard');
          };
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
  }

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

function setViewMode(mode) {
  mapViewMode.value = mode;
  renderMarkers();
  drawHeatmap();
}

function zoomToRegion(region) {
  currentFilter.value = region;
  if (!map) return;

  if (region === 'Peninsular') {
    map.flyTo([4.2105, 101.9758], 7);
  } else if (region === 'Sabah' || region === 'Sarawak') {
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

function getDrawerButtonClass(isOpen) {
  return isOpen
    ? 'bg-indigo-50 border-indigo-500/40 text-indigo-700 dark:bg-indigo-950/80 dark:border-indigo-500/60 dark:text-indigo-200'
    : 'bg-white dark:bg-black border-slate-200 dark:border-white/10 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white';
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
  if (map) {
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
            {{ combinedStations.length }} stesen
          </span>
          <span v-if="communitySensors.length > 0" class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
            👥 +{{ communitySensors.length }} komuniti
          </span>
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ t('map.sub') }}</p>
      </div>

      <!-- Controls: Consolidated Primary Segmented Control & Filter Drawer Toggle -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Primary Segmented Network Selector (<= 4 options) -->
        <div class="flex items-center gap-1 bg-slate-100 dark:bg-black border border-slate-200 dark:border-white/10 rounded-full p-1 text-xs">
          <button
            @click="networkFilter = 'all'"
            :class="['px-3 py-1.5 rounded-full font-medium transition flex items-center gap-1', getFilterPillClass(networkFilter === 'all')]"
            title="Papar semua stesen rasmi JAS dan sensor komuniti"
          >
            <span>Semua</span>
          </button>
          <button
            @click="networkFilter = 'official'"
            :class="['px-3 py-1.5 rounded-full font-medium transition flex items-center gap-1', getFilterPillClass(networkFilter === 'official')]"
            title="Hanya stesen rasmi JAS APIMS"
          >
            <span>🏛️ JAS ({{ stations.length }})</span>
          </button>
          <button
            @click="networkFilter = 'community'"
            :class="['px-3 py-1.5 rounded-full font-medium transition flex items-center gap-1', getFilterPillClass(networkFilter === 'community')]"
            title="Sensor komuniti warga (PurpleAir / AirVisual)"
          >
            <span>👥 Komuniti ({{ communitySensors.length }})</span>
          </button>
          <button
            @click="isFilterDrawerOpen = !isFilterDrawerOpen"
            :class="['px-3 py-1.5 rounded-full font-medium transition flex items-center gap-1.5 border', getDrawerButtonClass(isFilterDrawerOpen)]"
          >
            <Layers class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>{{ isFilterDrawerOpen ? 'Tutup Penapis' : 'Lapisan & Wilayah' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Secondary Collapsible Filter Drawer (View Mode & Region) -->
    <div v-if="isFilterDrawerOpen" class="p-3 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-wrap items-center gap-4 text-xs transition-all">
      <!-- Heatmap / Layer Mode Selector -->
      <div class="flex items-center gap-1.5">
        <span class="text-[10px] uppercase font-mono text-slate-500 dark:text-neutral-400 font-bold">Lapisan:</span>
        <div class="flex items-center gap-1 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-full p-0.5">
          <button
            @click="setViewMode('both')"
            :class="['px-2.5 py-1 rounded-full text-[10px] font-medium transition', getFilterPillClass(mapViewMode === 'both')]"
          >
            🌫️ Haze + Pins
          </button>
          <button
            @click="setViewMode('heatmap')"
            :class="['px-2.5 py-1 rounded-full text-[10px] font-medium transition', getFilterPillClass(mapViewMode === 'heatmap')]"
          >
            ☁️ Heatmap
          </button>
          <button
            @click="setViewMode('pins')"
            :class="['px-2.5 py-1 rounded-full text-[10px] font-medium transition', getFilterPillClass(mapViewMode === 'pins')]"
          >
            📍 Pins
          </button>
        </div>
      </div>

      <!-- Region Filter Tabs -->
      <div class="flex items-center gap-1.5">
        <span class="text-[10px] uppercase font-mono text-slate-500 dark:text-neutral-400 font-bold">Wilayah:</span>
        <div class="flex items-center gap-1 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-full p-0.5">
          <button
            @click="zoomToRegion('All')"
            :class="['px-2.5 py-1 rounded-full text-[10px] font-medium transition', getFilterPillClass(currentFilter === 'All')]"
          >
            {{ t('map.filterAll') }}
          </button>
          <button
            @click="zoomToRegion('Peninsular')"
            :class="['px-2.5 py-1 rounded-full text-[10px] font-medium transition', getFilterPillClass(currentFilter === 'Peninsular')]"
          >
            {{ t('map.filterPeninsular') }}
          </button>
          <button
            @click="zoomToRegion('Sabah')"
            :class="['px-2.5 py-1 rounded-full text-[10px] font-medium transition', getFilterPillClass(currentFilter === 'Sabah')]"
          >
            {{ t('map.filterSabah') }}
          </button>
          <button
            @click="zoomToRegion('Sarawak')"
            :class="['px-2.5 py-1 rounded-full text-[10px] font-medium transition', getFilterPillClass(currentFilter === 'Sarawak')]"
          >
            {{ t('map.filterSarawak') }}
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

        <!-- Mobile Tap-to-Interact Prompt Overlay Button -->
        <button
          v-if="!isMapInteracting"
          @click="enableMapInteraction"
          class="lg:hidden absolute top-3 right-3 z-[1000] px-3.5 py-2 rounded-full bg-white/95 dark:bg-black/90 hover:bg-slate-100 dark:hover:bg-neutral-950 backdrop-blur-md border border-indigo-500/40 text-indigo-600 dark:text-indigo-300 shadow-xl transition flex items-center gap-1.5 text-xs font-bold focus:outline-none"
        >
          <span>👆 {{ t('guidance.tapToInteractMap') }}</span>
        </button>

        <!-- Floating Legend on Map (Design Token Aligned) -->
        <div class="absolute bottom-3 inset-x-3 z-30 bg-white/95 dark:bg-black/90 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-full px-4 py-2 shadow-xl flex items-center justify-between sm:justify-around text-[10px] font-bold text-slate-700 dark:text-neutral-200 select-none overflow-x-auto gap-2">
          <span class="flex items-center gap-1.5 shrink-0"><span class="w-2.5 h-2.5 rounded-full bg-[#00d2ff] shadow-sm shadow-cyan-500/50"></span> 0-50 Baik</span>
          <span class="flex items-center gap-1.5 shrink-0"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span> 51-100 Sederhana</span>
          <span class="flex items-center gap-1.5 shrink-0"><span class="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span> 101-200 Tidak Sihat</span>
          <span class="flex items-center gap-1.5 shrink-0"><span class="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span> 201-300 Sangat T.Sihat</span>
          <span class="flex items-center gap-1.5 shrink-0"><span class="w-2.5 h-2.5 rounded-full bg-[#881337] shadow-sm shadow-rose-900/50"></span> 301+ Berbahaya</span>
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
              {{ displayedStations.length }} stesen
            </span>

            <!-- Sort Toggle Dropdown / Buttons -->
            <div class="flex items-center gap-1">
              <button
                v-if="userLocation"
                @click="sortBy = 'distance_asc'"
                :class="['px-2.5 py-1 rounded-full text-[10px] font-medium transition', getSortPillClass(sortBy === 'distance_asc')]"
              >
                📍 Terdekat
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
            <p>Tiada stesen dijumpai untuk carian "{{ searchQuery }}"</p>
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
