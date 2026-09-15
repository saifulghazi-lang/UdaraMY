<script setup>
import { computed, ref, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { 
  TrendingUp, 
  TrendingDown, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles,
  Clock
} from 'lucide-vue-next';

const props = defineProps({
  history: {
    type: Array,
    required: true
  },
  currentApi: {
    type: Number,
    required: true
  },
  forecast: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['previewApi']);

const { t } = useI18n();
const chartTab = ref('history'); // 'history' | 'forecast'
const hoveredIdx = ref(null);
const isPlaying = ref(false);
let playInterval = null;

const maxVal = 350;
const height = 120;
const width = 360;

const activeList = computed(() => {
  if (chartTab.value === 'forecast' && props.forecast?.hourly?.length) {
    return props.forecast.hourly;
  }
  return props.history || [];
});

const points = computed(() => {
  const list = activeList.value;
  if (!list || list.length === 0) return [];
  const step = width / Math.max(1, list.length - 1);
  return list.map((pt, idx) => {
    const x = +(idx * step).toFixed(1);
    const normalizedY = Math.max(0, Math.min(maxVal, pt.api));
    const y = +(height - (normalizedY / maxVal) * (height - 20) - 8).toFixed(1);

    let timeLabel = pt.timeLabel;
    if (!timeLabel && pt.time) {
      const d = new Date(pt.time);
      const isToday = d.toDateString() === new Date().toDateString();
      timeLabel = `${isToday ? 'Hari Ini' : pt.dayName || 'Esok'} ${d.toLocaleTimeString([], { hour: 'numeric', hour12: true })}`;
    }

    return { ...pt, x, y, idx, timeLabel: timeLabel || 'Sekarang' };
  });
});

// Calculate smooth Catmull-Rom / Bezier cubic spline curve
const smoothPath = computed(() => {
  const pts = points.value;
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;

  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i != pts.length - 2 ? pts[i + 2] : p2;

    const cp1x = +(p1.x + (p2.x - p0.x) / 6).toFixed(1);
    const cp1y = +(p1.y + (p2.y - p0.y) / 6).toFixed(1);
    const cp2x = +(p2.x - (p3.x - p1.x) / 6).toFixed(1);
    const cp2y = +(p2.y - (p3.y - p1.y) / 6).toFixed(1);

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
});

const areaString = computed(() => {
  if (points.value.length === 0) return '';
  const first = points.value[0];
  const last = points.value[points.value.length - 1];
  return `${smoothPath.value} L ${last.x},${height} L ${first.x},${height} Z`;
});

const activePoint = computed(() => {
  if (hoveredIdx.value !== null && points.value[hoveredIdx.value]) {
    return points.value[hoveredIdx.value];
  }
  return points.value.length > 0 ? points.value[points.value.length - 1] : null;
});

const change24h = computed(() => {
  if (points.value.length < 2) return 0;
  const oldest = points.value[0].api;
  const newest = props.currentApi;
  return newest - oldest;
});

const lineColor = computed(() => {
  const val = activePoint.value?.api ?? props.currentApi;
  if (val <= 50) return '#00d2ff';
  if (val <= 100) return '#10b981';
  if (val <= 200) return '#f59e0b';
  if (val <= 300) return '#ef4444';
  return '#881337';
});

// Handle interactive scrub over chart
function handleMouseMove(e) {
  const svg = e.currentTarget;
  const rect = svg.getBoundingClientRect();
  const relX = (e.clientX - rect.left) / rect.width;
  const targetIdx = Math.round(relX * (points.value.length - 1));
  hoveredIdx.value = Math.max(0, Math.min(points.value.length - 1, targetIdx));
}

function handleTouchMove(e) {
  if (!e.touches || e.touches.length === 0) return;
  const touch = e.touches[0];
  const svg = e.currentTarget;
  const rect = svg.getBoundingClientRect();
  const relX = (touch.clientX - rect.left) / rect.width;
  const targetIdx = Math.round(relX * (points.value.length - 1));
  hoveredIdx.value = Math.max(0, Math.min(points.value.length - 1, targetIdx));
}

function handleMouseLeave() {
  if (!isPlaying.value) {
    hoveredIdx.value = null;
  }
}

// 24h Timelapse Animation Loop
function toggleTimelapse() {
  if (isPlaying.value) {
    stopTimelapse();
  } else {
    startTimelapse();
  }
}

function startTimelapse() {
  isPlaying.value = true;
  hoveredIdx.value = 0;
  clearInterval(playInterval);

  playInterval = setInterval(() => {
    if (hoveredIdx.value >= points.value.length - 1) {
      stopTimelapse();
      return;
    }
    hoveredIdx.value++;
  }, 350);
}

function stopTimelapse() {
  isPlaying.value = false;
  clearInterval(playInterval);
}

onUnmounted(() => {
  clearInterval(playInterval);
});
</script>

<template>
  <div class="rounded-3xl p-5 sm:p-6 bg-black border border-white/[0.12] shadow-2xl space-y-3">
    <!-- Header & 24h Delta / Forecast Tabs -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <div>
        <div class="flex items-center gap-2">
          <Clock class="w-3.5 h-3.5 text-cyan-400" />
          <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
            {{ chartTab === 'forecast' ? '48-Hour Haze Outlook (CAMS)' : t('trends.title') }}
          </h3>
        </div>
        <p class="text-[11px] text-slate-400 mt-0.5">
          {{ chartTab === 'forecast' ? 'Projeksi ramalan setiap jam model Copernicus ECMWF' : t('trends.subtitle') }}
        </p>
      </div>

      <!-- Controls: History / Forecast Switcher & Player -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Dual Tab Switcher -->
        <div class="flex items-center gap-1 bg-black border border-white/10 rounded-2xl p-0.5 text-xs font-mono">
          <button
            @click="chartTab = 'history'"
            :class="[
              'px-2.5 py-1 rounded-xl font-semibold transition text-[10px]',
              chartTab === 'history' ? 'bg-indigo-600 text-white shadow' : 'text-neutral-400 hover:text-white'
            ]"
          >
            24j Lalu (JAS)
          </button>
          <button
            @click="chartTab = 'forecast'"
            :class="[
              'px-2.5 py-1 rounded-xl font-semibold transition text-[10px] flex items-center gap-1',
              chartTab === 'forecast' ? 'bg-cyan-600 text-white shadow' : 'text-neutral-400 hover:text-white'
            ]"
          >
            <span>48j Ramalan</span>
            <span v-if="forecast?.trend === 'deteriorating'" class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          </button>
        </div>

        <!-- Interactive Timelapse Player Button (History only) -->
        <button
          v-if="chartTab === 'history'"
          @click="toggleTimelapse"
          :class="[
            'flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold font-mono transition shadow-sm active:scale-95 focus:outline-none',
            isPlaying 
              ? 'bg-cyan-500 text-black font-bold' 
              : 'bg-black hover:bg-neutral-900 text-slate-300 hover:text-white border border-white/10'
          ]"
          :title="isPlaying ? t('app.pauseTimelapse') : t('app.playTimelapse')"
        >
          <component :is="isPlaying ? Pause : Play" class="w-3 h-3" />
          <span>{{ isPlaying ? t('app.pauseTimelapse') : t('app.timelapse') }}</span>
        </button>

        <!-- 24h Delta or Forecast Trend Badge -->
        <div 
          v-if="chartTab === 'history'"
          class="flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-black border border-white/10"
          :class="change24h >= 0 ? 'text-amber-400' : 'text-emerald-400'"
        >
          <component :is="change24h >= 0 ? TrendingUp : TrendingDown" class="w-3 h-3" />
          <span>{{ change24h >= 0 ? `+${change24h}` : change24h }} pts</span>
        </div>
        <div
          v-else-if="forecast"
          class="flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black border border-white/10"
          :class="forecast.trend === 'improving' ? 'text-emerald-400' : forecast.trend === 'deteriorating' ? 'text-amber-400' : 'text-slate-300'"
        >
          <span>{{ forecast.trend === 'improving' ? '📉 Bertambah Baik' : forecast.trend === 'deteriorating' ? '⚠️ Jangka Meningkat' : '➡️ Stabil' }}</span>
        </div>
      </div>
    </div>

    <!-- Active Scrubber Readout Bar -->
    <div class="flex items-center justify-between p-2.5 rounded-xl bg-black border border-white/10 text-xs font-mono">
      <div class="flex items-center gap-2">
        <span class="text-slate-400">{{ chartTab === 'forecast' ? 'Waktu:' : 'Scrub Time:' }}</span>
        <span class="text-white font-bold">{{ activePoint?.timeLabel || 'Sekarang' }}</span>
      </div>
      <div class="flex items-center gap-3">
        <span v-if="chartTab === 'forecast' && activePoint?.pm25" class="text-[11px] text-cyan-300 hidden sm:inline">
          {{ activePoint.pm25 }} µg/m³ PM2.5
        </span>
        <div class="flex items-center gap-1.5">
          <span class="text-slate-400">API:</span>
          <span class="text-base font-black" :style="{ color: lineColor }">
            {{ activePoint?.api ?? currentApi }}
          </span>
        </div>
      </div>
    </div>

    <!-- Chart Canvas / SVG Container -->
    <div 
      class="relative w-full overflow-hidden pt-2 cursor-crosshair select-none"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
      @touchmove="handleTouchMove"
      @touchend="handleMouseLeave"
    >
      <!-- Horizontal Reference Threshold Grid -->
      <div class="absolute inset-0 pointer-events-none flex flex-col justify-between text-[8px] font-mono text-slate-600 opacity-60">
        <div class="border-b border-purple-500/20 w-full flex justify-between pr-1"><span>300 HAZARDOUS</span></div>
        <div class="border-b border-rose-500/20 w-full flex justify-between pr-1"><span>200 V. UNHEALTHY</span></div>
        <div class="border-b border-amber-500/20 w-full flex justify-between pr-1"><span>100 UNHEALTHY</span></div>
        <div class="border-b border-emerald-500/20 w-full flex justify-between pr-1"><span>50 MODERATE</span></div>
      </div>

      <!-- SVG Graph -->
      <svg class="w-full h-32 overflow-visible" :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" :stop-color="lineColor" stop-opacity="0.45" />
            <stop offset="60%" :stop-color="lineColor" stop-opacity="0.1" />
            <stop offset="100%" :stop-color="lineColor" stop-opacity="0.0" />
          </linearGradient>
          <filter id="lineGlowFilter" x="-10%" y="-20%" width="120%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" :flood-color="lineColor" flood-opacity="0.6"/>
          </filter>
        </defs>

        <!-- Area fill -->
        <path :d="areaString" fill="url(#areaGlow)" class="transition-colors duration-500" />

        <!-- Spline Line stroke -->
        <path
          :d="smoothPath"
          fill="none"
          :stroke="lineColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          filter="url(#lineGlowFilter)"
          class="transition-colors duration-500"
        />

        <!-- Hover Cursor Line -->
        <line
          v-if="activePoint"
          :x1="activePoint.x"
          :y1="0"
          :x2="activePoint.x"
          :y2="height"
          stroke="rgba(255, 255, 255, 0.25)"
          stroke-width="1.5"
          stroke-dasharray="3 3"
        />

        <!-- Active Scrubber Beacon Dot -->
        <g v-if="activePoint">
          <circle
            :cx="activePoint.x"
            :cy="activePoint.y"
            r="6"
            :fill="lineColor"
            class="animate-ping opacity-60"
          />
          <circle
            :cx="activePoint.x"
            :cy="activePoint.y"
            r="5"
            :fill="lineColor"
            stroke="#070b12"
            stroke-width="2.5"
          />
        </g>
      </svg>
    </div>

    <!-- Time Labels -->
    <div class="flex justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-white/[0.04]">
      <span>24h ago</span>
      <span>18h</span>
      <span>12h</span>
      <span>6h</span>
      <span class="font-bold text-cyan-400">Live Now</span>
    </div>
  </div>
</template>
