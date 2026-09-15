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

let map = null;
let markersLayer = null;
let userLocationLayer = null;
let heatCanvas = null;
let heatCtx = null;
const markerMap = {};

function hexToRgba(hex, alpha) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Combined stations based on network filter and community toggle
const combinedStations = computed(() => {
  const official = props.stations.map(s => ({ ...s, isCommunity: false }));
  const community = (props.showCommunity ? props.communitySensors : []).map(s => ({ ...s, isCommunity: true }));
  
  if (networkFilter.value === 'official') return official;
  if (networkFilter.value === 'community') return community;
  return [...official, ...community];
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

  if (station.isCommunity) {
    const html = `
      <div style="
        background-color: #000000;
        color: ${color};
        font-weight: 900;
        font-size: 10px;
        font-family: monospace;
        width: ${isSelected ? '36px' : '28px'};
        height: ${isSelected ? '36px' : '28px'};
        border-radius: 9999px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 ${isSelected ? '16px' : '8px'} ${color}99;
        border: ${isSelected ? '2.5px solid #ffffff' : `2px dashed ${color}`};
        transform: translate(-50%, -50%);
        transition: all 0.2s ease;
        cursor: pointer;
      ">
        <span style="font-size: 7px; line-height: 1; margin-top: -1px;">👥</span>
        <span style="line-height: 1;">${station.api}</span>
      </div>
    `;
    return L.divIcon({
      html,
      className: 'custom-community-pin',
      iconSize: [28, 28]
    });
  }

  const html = `
    <div style="
      background-color: ${color};
      color: #090d16;
      font-weight: 800;
      font-size: 11px;
      font-family: monospace;
      width: ${isSelected ? '36px' : '28px'};
      height: ${isSelected ? '36px' : '28px'};
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 ${isSelected ? '16px' : '8px'} ${color};
      border: ${isSelected ? '3px solid #ffffff' : '2px solid rgba(255,255,255,0.85)'};
      transform: translate(-50%, -50%);
      transition: all 0.2s ease;
      cursor: pointer;
    ">
      ${station.api}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-station-pin',
    iconSize: [28, 28]
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
  map.on('zoom', drawHeatmap);
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
  const mapPos = map.containerPointToLayerPoint([0, 0]);
  L.DomUtil.setPosition(heatCanvas, mapPos);

  heatCanvas.width = size.x;
  heatCanvas.height = size.y;
  heatCtx.clearRect(0, 0, size.x, size.y);

  // Radius scales smoothly with map zoom level
  const zoom = map.getZoom();
  const baseRadius = Math.max(32, Math.min(110, (zoom - 4) * 16 + 32));

  props.stations.forEach(st => {
    const pt = map.latLngToContainerPoint([st.lat, st.lng]);
    if (
      pt.x < -baseRadius * 1.5 ||
      pt.y < -baseRadius * 1.5 ||
      pt.x > size.x + baseRadius * 1.5 ||
      pt.y > size.y + baseRadius * 1.5
    ) {
      return;
    }

    const radius = Math.round(baseRadius * (0.75 + (st.api / 220) * 0.5));
    const hexColor = getCategoryColor(st.category);

    const grad = heatCtx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
    grad.addColorStop(0, hexToRgba(hexColor, 0.55));
    grad.addColorStop(0.35, hexToRgba(hexColor, 0.35));
    grad.addColorStop(0.70, hexToRgba(hexColor, 0.12));
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

  // Blue pulsing dot for user GPS position
  const userIcon = L.divIcon({
    html: `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background: #3b82f6; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <span style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 0 12px rgba(37,99,235,0.9);"></span>
      </div>
    `,
    className: 'user-gps-marker',
    iconSize: [24, 24]
  });

  const marker = L.marker([lat, lng], { icon: userIcon });
  marker.bindPopup(`
    <div style="font-family: system-ui, sans-serif; font-size: 12px; font-weight: 700; color: #f8fafc; padding: 2px;">
      📍 ${t('location.nearest') || 'Your Location'}
    </div>
  `);
  userLocationLayer.addLayer(marker);

  if (accuracy && accuracy < 8000) {
    const halo = L.circle([lat, lng], {
      radius: accuracy,
      color: '#3b82f6',
      weight: 1,
      fillColor: '#3b82f6',
      fillOpacity: 0.12
    });
    userLocationLayer.addLayer(halo);
  }
}

function renderMarkers() {
  if (!map || !markersLayer) return;
  markersLayer.clearLayers();

  const showPins = mapViewMode.value !== 'heatmap';

  if (showPins) {
    combinedStations.value.forEach(st => {
      const icon = createMarkerIcon(st);
      const marker = L.marker([st.lat, st.lng], { icon });

      const distStr = st.distanceKm !== undefined && st.distanceKm !== null ? t('map.distanceAway', { km: st.distanceKm }) : '';

      const communityHeaderHtml = st.isCommunity ? `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 4px;">
          <span style="font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 9999px; background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); text-transform: uppercase;">
            👥 ${t('community.badge')} (${t('community.unvalidated')})
          </span>
          <span style="font-size: 8px; color: #94a3b8; font-family: monospace;">${st.sensorModel?.split(' ')[0] || 'Sensor'}</span>
        </div>
      ` : '';

      const communityMetricsHtml = st.isCommunity ? `
        <div style="background: #0a0a0a; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 6px 8px; margin-top: 6px; font-size: 10px; color: #cbd5e1;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">${t('community.rawPm25')}:</span>
            <span style="font-weight: 700; font-family: monospace;">${st.rawPm25} µg/m³</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span style="color: #38bdf8;">${t('community.calibratedPm25')} (RH ${st.humidity}%):</span>
            <span style="font-weight: 700; color: #38bdf8; font-family: monospace;">${st.calibratedPm25} µg/m³</span>
          </div>
        </div>
      ` : '';

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 180px;">
          ${communityHeaderHtml}
          <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">${st.state}${distStr}</div>
          <div style="font-size: 13px; font-weight: 800; color: #f8fafc; margin-top: 2px;">${st.name}</div>
          ${st.subTitle ? `<div style="font-size: 9px; color: #94a3b8; margin-top: 1px;">${st.subTitle}</div>` : ''}
          ${communityMetricsHtml}
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">
            <span style="font-size: 11px; color: #cbd5e1; text-transform: capitalize;">${st.isCommunity ? t('community.equivApi') : st.category}</span>
            <span style="font-size: 16px; font-weight: 900; color: ${getCategoryColor(st.category)}; font-family: monospace;">API ${st.api}</span>
          </div>
          <div style="display: flex; gap: 6px; margin-top: 10px;">
            <button id="btn-select-${st.id}" style="
              flex: 1;
              background: #0284c7;
              color: white;
              border: none;
              padding: 6px 8px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
            ">
              ${t('map.select')}
            </button>
            <button id="btn-dash-${st.id}" style="
              background: rgba(255,255,255,0.1);
              color: #cbd5e1;
              border: 1px solid rgba(255,255,255,0.2);
              padding: 6px 8px;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
            ">
              ${t('map.dashboard')}
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btnSelect = document.getElementById(`btn-select-${st.id}`);
        if (btnSelect) {
          btnSelect.onclick = () => {
            onStationClick(st.id, false);
          };
        }
        const btnDash = document.getElementById(`btn-dash-${st.id}`);
        if (btnDash) {
          btnDash.onclick = () => {
            emit('selectStation', st.id);
            emit('viewDashboard');
          };
        }
      });

      marker.on('click', () => {
        onStationClick(st.id, false);
      });

      markersLayer.addLayer(marker);
      markerMap[st.id] = marker;
    });
  }

  drawHeatmap();
  renderUserLocation();
}

function onStationClick(id, shouldOpenPopup = true) {
  emit('selectStation', id);
  const st = combinedStations.value.find(s => s.id === id);
  if (st && map) {
    map.flyTo([st.lat, st.lng], 9, { duration: 0.8 });
    if (shouldOpenPopup && markerMap[id]) {
      markerMap[id].openPopup();
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

onMounted(() => {
  if (!mapContainer.value) return;

  map = L.map(mapContainer.value, {
    center: [4.2105, 108.5],
    zoom: 6,
    minZoom: 5,
    maxZoom: 14,
    zoomControl: false
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

watch(() => props.selectedStationId, () => {
  renderMarkers();
});

watch(() => props.userLocation, () => {
  renderUserLocation();
  if (props.userLocation && map) {
    map.flyTo([props.userLocation.lat, props.userLocation.lng], 9);
  }
}, { deep: true });

onBeforeUnmount(() => {
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
        <h2 class="text-base font-extrabold text-slate-100 flex items-center gap-2">
          <span>{{ t('map.title') }}</span>
          <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            {{ combinedStations.length }} stesen
          </span>
          <span v-if="communitySensors.length > 0" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            👥 +{{ communitySensors.length }} komuniti
          </span>
        </h2>
        <p class="text-xs text-slate-400 mt-0.5">{{ t('map.sub') }}</p>
      </div>

      <!-- Controls: Source Network, Heatmap Mode & Region Filter -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Source Network Selector (All, Official JAS, Community) -->
        <div class="flex items-center gap-1 bg-black border border-white/10 rounded-2xl p-1 text-xs">
          <button
            @click="networkFilter = 'all'"
            :class="['px-2.5 py-1 rounded-xl font-medium transition flex items-center gap-1', networkFilter === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-neutral-400 hover:text-white']"
            title="Papar semua stesen rasmi JAS dan sensor komuniti"
          >
            <span>Semua</span>
          </button>
          <button
            @click="networkFilter = 'official'"
            :class="['px-2.5 py-1 rounded-xl font-medium transition flex items-center gap-1', networkFilter === 'official' ? 'bg-indigo-600 text-white shadow' : 'text-neutral-400 hover:text-white']"
            title="Hanya stesen rasmi JAS APIMS"
          >
            <span>🏛️ JAS ({{ stations.length }})</span>
          </button>
          <button
            @click="networkFilter = 'community'"
            :class="['px-2.5 py-1 rounded-xl font-medium transition flex items-center gap-1', networkFilter === 'community' ? 'bg-purple-600 text-white shadow' : 'text-neutral-400 hover:text-white']"
            title="Sensor komuniti warga (PurpleAir / AirVisual)"
          >
            <span>👥 Komuniti ({{ communitySensors.length }})</span>
          </button>
        </div>

        <!-- Heatmap / Layer Mode Selector -->
        <div class="flex items-center gap-1 bg-black border border-white/10 rounded-2xl p-1 text-xs">
          <button
            @click="setViewMode('both')"
            :class="['px-2.5 py-1 rounded-xl font-medium transition flex items-center gap-1.5', mapViewMode === 'both' ? 'bg-indigo-600 text-white shadow' : 'text-neutral-400 hover:text-white']"
            title="Show both heatmap haze plumes and station pins"
          >
            <span>🌫️ Heatmap + Pins</span>
          </button>
          <button
            @click="setViewMode('heatmap')"
            :class="['px-2.5 py-1 rounded-xl font-medium transition flex items-center gap-1.5', mapViewMode === 'heatmap' ? 'bg-indigo-600 text-white shadow' : 'text-neutral-400 hover:text-white']"
            title="Show only the haze heatmap plumes"
          >
            <span>☁️ Heatmap Only</span>
          </button>
          <button
            @click="setViewMode('pins')"
            :class="['px-2.5 py-1 rounded-xl font-medium transition flex items-center gap-1.5', mapViewMode === 'pins' ? 'bg-indigo-600 text-white shadow' : 'text-neutral-400 hover:text-white']"
            title="Show only station markers"
          >
            <span>📍 Pins Only</span>
          </button>
        </div>

        <!-- Region Filter Tabs -->
        <div class="flex items-center gap-1 bg-black border border-white/10 rounded-2xl p-1 text-xs shrink-0">
          <button
            @click="zoomToRegion('All')"
            :class="['px-2.5 py-1 rounded-xl font-medium transition', currentFilter === 'All' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white']"
          >
            {{ t('map.filterAll') }}
          </button>
          <button
            @click="zoomToRegion('Peninsular')"
            :class="['px-2.5 py-1 rounded-xl font-medium transition', currentFilter === 'Peninsular' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white']"
          >
            {{ t('map.filterPeninsular') }}
          </button>
          <button
            @click="zoomToRegion('Sabah')"
            :class="['px-2.5 py-1 rounded-xl font-medium transition', currentFilter === 'Sabah' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white']"
          >
            {{ t('map.filterSabah') }}
          </button>
          <button
            @click="zoomToRegion('Sarawak')"
            :class="['px-2.5 py-1 rounded-xl font-medium transition', currentFilter === 'Sarawak' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white']"
          >
            {{ t('map.filterSarawak') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Split Layout: Interactive Map + Side Station List -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
      
      <!-- Left: Interactive Leaflet Map (Col 7 / 8) -->
      <div class="lg:col-span-7 xl:col-span-8 relative w-full h-[400px] lg:h-[640px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl isolate bg-black">
        <div ref="mapContainer" class="w-full h-full z-0"></div>

        <!-- Locate Me Floating GPS Button on Map -->
        <button
          @click="emit('locateMe')"
          :class="[
            'absolute top-3 left-3 z-[1000] px-3 py-2 rounded-2xl bg-black/90 hover:bg-neutral-900 backdrop-blur-md border border-white/10 shadow-xl transition flex items-center gap-2 text-xs font-semibold focus:outline-none',
            isLocating ? 'text-amber-300 ring-2 ring-amber-400/50' : 'text-white'
          ]"
          :title="isLocating ? t('location.locating') : t('location.locateMe')"
        >
          <LocateFixed :class="['w-4 h-4 text-indigo-400', isLocating ? 'animate-spin text-amber-300' : '']" />
          <span>{{ isLocating ? t('location.locating') : t('location.locateMe') }}</span>
        </button>

        <!-- Floating Legend on Map -->
        <div class="absolute bottom-3 inset-x-3 z-30 bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl px-3 py-2 shadow-xl flex items-center justify-between sm:justify-around text-[10px] font-bold text-neutral-200 select-none overflow-x-auto gap-2">
          <span class="flex items-center gap-1.5 shrink-0"><span class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span> 0-50 Baik</span>
          <span class="flex items-center gap-1.5 shrink-0"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span> 51-100 Sederhana</span>
          <span class="flex items-center gap-1.5 shrink-0"><span class="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span> 101-200 Tidak Sihat</span>
          <span class="flex items-center gap-1.5 shrink-0"><span class="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span> 201-300 Sangat T.Sihat</span>
          <span class="flex items-center gap-1.5 shrink-0"><span class="w-2.5 h-2.5 rounded-full bg-purple-600 shadow-sm shadow-purple-600/50"></span> 301+ Berbahaya</span>
        </div>
      </div>

      <!-- Right: Station List (Col 5 / 4) - Does NOT close the map! -->
      <div class="lg:col-span-5 xl:col-span-4 bg-black border border-white/10 rounded-3xl p-3.5 flex flex-col h-[420px] lg:h-[640px] shadow-2xl">
        
        <!-- Search & Sort Controls -->
        <div class="space-y-2 pb-3 border-b border-white/10">
          <div class="relative flex items-center">
            <Search class="w-4 h-4 text-neutral-500 absolute left-3 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('app.searchStation')"
              class="w-full bg-neutral-950 border border-white/10 rounded-2xl py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          <div class="flex items-center justify-between text-[11px] px-1 gap-2 flex-wrap">
            <span class="text-neutral-400 font-medium">
              {{ displayedStations.length }} stations
            </span>

            <!-- Sort Toggle Dropdown / Buttons -->
            <div class="flex items-center gap-1">
              <button
                v-if="userLocation"
                @click="sortBy = 'distance_asc'"
                :class="['px-2 py-1 rounded-lg text-[10px] font-medium transition', sortBy === 'distance_asc' ? 'bg-indigo-600 text-white' : 'bg-neutral-900 border border-white/5 text-neutral-300 hover:text-white']"
              >
                📍 Terdekat
              </button>
              <button
                @click="sortBy = 'api_desc'"
                :class="['px-2 py-1 rounded-lg text-[10px] font-medium transition', sortBy === 'api_desc' ? 'bg-indigo-600 text-white' : 'bg-neutral-900 border border-white/5 text-neutral-300 hover:text-white']"
              >
                🔥 Haze Watch
              </button>
              <button
                @click="sortBy = 'name_asc'"
                :class="['px-2 py-1 rounded-lg text-[10px] font-medium transition', sortBy === 'name_asc' ? 'bg-indigo-600 text-white' : 'bg-neutral-900 border border-white/5 text-neutral-300 hover:text-white']"
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
                ? 'bg-indigo-950/60 border-indigo-500/70 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500/40'
                : 'bg-neutral-950/60 border-white/5 hover:bg-neutral-900 hover:border-white/15'
            ]"
          >
            <!-- Left Info -->
            <div class="min-w-0 pr-2">
              <div class="font-bold text-white text-xs truncate flex items-center gap-1.5 flex-wrap">
                <span class="truncate">{{ st.name }}</span>
                <span
                  v-if="st.isCommunity"
                  class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 border border-purple-500/40 shrink-0"
                >
                  👥 Komuniti
                </span>
                <span
                  v-if="st.id === selectedStationId"
                  class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 shrink-0"
                >
                  Active
                </span>
                <span
                  v-if="st.distanceKm !== null"
                  class="text-[9px] px-1.5 py-0.2 rounded-full bg-neutral-900 border border-white/5 text-neutral-300 font-mono shrink-0"
                >
                  {{ st.distanceKm }} km
                </span>
              </div>
              <div class="text-[10px] text-neutral-400 mt-0.5 truncate">
                <span v-if="st.isCommunity" class="text-purple-400/90 font-medium">{{ st.sensorModel }} • </span>
                {{ st.state }} • {{ st.region }}
              </div>
            </div>

            <!-- Right: API Badge & Dashboard Link -->
            <div class="flex items-center gap-2 shrink-0">
              <!-- API Pill -->
              <span
                class="px-2.5 py-1 rounded-xl font-mono text-xs font-black"
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
                class="p-1.5 rounded-xl bg-neutral-900 hover:bg-indigo-600 text-neutral-400 hover:text-white transition opacity-80 group-hover:opacity-100 border border-white/5"
                title="View full dashboard for this station"
              >
                <ExternalLink class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div v-if="displayedStations.length === 0" class="py-12 text-center text-neutral-500 text-xs">
            Tiada stesen dijumpai untuk carian "{{ searchQuery }}"
          </div>
        </div>

      </div>

    </div>
  </div>
</template>
