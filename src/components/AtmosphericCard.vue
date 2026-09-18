<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { 
  MapPin, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  Building2
} from 'lucide-vue-next';
import { getCategoryFromApi } from '../data/stations.js';

const props = defineProps({
  station: {
    type: Object,
    required: true
  },
  lastUpdated: {
    type: String,
    default: ''
  },
  isLive: {
    type: Boolean,
    default: true
  },
  distanceKm: {
    type: [Number, null],
    default: null
  },
  isNearest: {
    type: Boolean,
    default: false
  },
  isSimulating: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'openStationSelector', 
  'clearSimulation'
]);

const { t } = useI18n();

const isForecastOpen = ref(false);

const displayApi = computed(() => {
  if (props.station.nowCast && typeof props.station.nowCast.nowCastApi === 'number') {
    return props.station.nowCast.nowCastApi;
  }
  return props.station.api;
});

const api = computed(() => displayApi.value);
const category = computed(() => getCategoryFromApi(displayApi.value));

const velocity = computed(() => props.station.velocity3h || null);

const velocityIcon = computed(() => {
  if (!velocity.value) return Minus;
  if (velocity.value.isSurging || velocity.value.velocityTrend === 'rising' || velocity.value.velocityTrend === 'rising_fast') {
    return TrendingUp;
  }
  if (velocity.value.isClearing || velocity.value.velocityTrend === 'falling' || velocity.value.velocityTrend === 'falling_fast') {
    return TrendingDown;
  }
  return Minus;
});

const velocityText = computed(() => {
  if (!velocity.value) return t('predictive.steady');
  const delta = velocity.value.delta3h;
  const sign = delta > 0 ? `+${delta}` : `${delta}`;
  return `${sign} pts/3h (${velocity.value.velocityLabel})`;
});

const velocityClass = computed(() => {
  if (!velocity.value) return 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400';
  if (velocity.value.isSurging) {
    return 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-400';
  }
  if (velocity.value.delta3h > 0) {
    return 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400';
  }
  if (velocity.value.isClearing) {
    return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400';
  }
  return 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400';
});

function getPredictionTrendIcon(trendDirection) {
  if (trendDirection === 'rising') return TrendingUp;
  if (trendDirection === 'clearing') return TrendingDown;
  return Minus;
}

function getPredictionTrendColor(trendDirection) {
  if (trendDirection === 'rising') return 'text-rose-500 dark:text-rose-400';
  if (trendDirection === 'clearing') return 'text-emerald-500 dark:text-emerald-400';
  return 'text-slate-400 dark:text-slate-500';
}

function getPredictionCategoryLabel(val) {
  const cat = getCategoryFromApi(val);
  return t(`categories.${cat}`);
}

function getPredictionBadgeClass(val) {
  const cat = getCategoryFromApi(val);
  switch (cat) {
    case 'good': return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20';
    case 'moderate': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
    case 'unhealthy': return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
    case 'veryUnhealthy': return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
    case 'hazardous': return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

// Color palette definitions per category
const categoryColor = computed(() => {
  switch (category.value) {
    case 'good': return '#00d2ff';
    case 'moderate': return '#10b981';
    case 'unhealthy': return '#f59e0b';
    case 'veryUnhealthy': return '#ef4444';
    case 'hazardous': return '#881337';
    default: return '#3b82f6';
  }
});

const categorySecondaryColor = computed(() => {
  switch (category.value) {
    case 'good': return '#0284c7';
    case 'moderate': return '#059669';
    case 'unhealthy': return '#d97706';
    case 'veryUnhealthy': return '#b91c1c';
    case 'hazardous': return '#4c0519';
    default: return '#1d4ed8';
  }
});

const statusBadgeDot = computed(() => {
  switch (category.value) {
    case 'good': return 'bg-cyan-400';
    case 'moderate': return 'bg-emerald-400';
    case 'unhealthy': return 'bg-amber-400';
    case 'veryUnhealthy': return 'bg-rose-400';
    case 'hazardous': return 'bg-purple-400';
    default: return 'bg-neutral-400';
  }
});

// Radial Gauge Math
const gaugeCircumference = 301.59;
const gaugeMaxArc = 226.2;
const gaugeDashArray = computed(() => {
  const normalized = Math.max(0, Math.min(350, api.value));
  const activeArc = (normalized / 350) * gaugeMaxArc;
  return `${activeArc.toFixed(1)} ${gaugeCircumference}`;
});

const formattedTime = computed(() => {
  if (!props.lastUpdated) return t('app.live');
  const d = new Date(props.lastUpdated);
  if (isNaN(d.getTime())) return t('app.live');
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
});

const statusIcon = computed(() => {
  switch (category.value) {
    case 'good': return '🌤️';
    case 'moderate': return '🌿';
    case 'unhealthy': return '😷';
    case 'veryUnhealthy': return '🚨';
    case 'hazardous': return '☠️';
    default: return '🌫️';
  }
});
</script>

<template>
  <div
    class="relative rounded-3xl p-5 sm:p-7 text-slate-800 dark:text-white overflow-hidden shadow-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 transition-all duration-300"
  >
    <!-- Header: Station Information & Status -->
    <div class="flex items-start justify-between relative z-10 gap-3">
      <!-- Station Information & Quick Switcher -->
      <button
        @click="emit('openStationSelector')"
        class="text-left group focus:outline-none flex-1 transition"
      >
        <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider flex-wrap">
          <MapPin class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>{{ station.state }}</span>
          <span
            v-if="distanceKm !== null"
            class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-mono border border-slate-200 dark:border-white/10"
          >
            {{ distanceKm }} km
          </span>
          <span
            v-if="isNearest"
            class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold"
          >
            📍 {{ t('location.nearest') }}
          </span>
        </div>
        <div class="flex items-center gap-1.5 mt-1">
          <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
            {{ station.name }}
          </h2>
          <ChevronRight class="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
        </div>
        <p v-if="station.subTitle" class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          {{ station.subTitle }}
        </p>
      </button>

      <!-- Active Simulation Reset Pill -->
      <button
        v-if="isSimulating"
        @click="emit('clearSimulation')"
        class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-xs font-mono font-bold hover:bg-amber-500/30 transition shadow-sm active:scale-95 cursor-pointer"
        :title="t('app.resetSimulator')"
      >
        <RotateCcw class="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
        <span>SIMULATION</span>
      </button>
    </div>

    <!-- Timestamp & Data Source Indicator -->
    <div class="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200 dark:border-white/[0.08] text-xs text-slate-500 dark:text-neutral-400 relative z-10">
      <span class="inline-flex items-center gap-1.5 font-mono">
        <span :class="['w-2 h-2 rounded-full', isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-neutral-600']"></span>
        <span class="text-slate-700 dark:text-neutral-300 font-semibold uppercase tracking-wider text-[10px]">{{ isLive ? t('app.live') : 'CACHED' }}</span>
        <span class="text-slate-400 dark:text-neutral-500">•</span>
        <span>{{ t('app.updatedAt', { time: formattedTime }) }}</span>
      </span>

      <span class="text-[10px] text-slate-500 font-mono hidden sm:inline">
        {{ t('app.dataSource') }}
      </span>
    </div>

    <!-- Center Hero: Modern Radial Tachometer Gauge -->
    <div class="my-6 flex flex-col items-center justify-center relative z-10">
      <div class="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
        <!-- SVG Radial Gauge -->
        <svg class="w-full h-full" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" :stop-color="categoryColor" />
              <stop offset="100%" :stop-color="categorySecondaryColor" />
            </linearGradient>
          </defs>

          <!-- Outer Reference Ticks Ring -->
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            class="text-slate-200 dark:text-white/5"
            stroke-width="1"
            stroke-dasharray="2 6"
          />

          <!-- Background Inactive Track -->
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="none"
            stroke="currentColor"
            class="text-slate-100 dark:text-white/10"
            stroke-width="8"
            stroke-dasharray="226.2 75.4"
            stroke-linecap="round"
            transform="rotate(135 60 60)"
          />

          <!-- Active Luminous Value Arc -->
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="none"
            stroke="url(#gaugeGradient)"
            stroke-width="8.5"
            :stroke-dasharray="gaugeDashArray"
            stroke-linecap="round"
            class="transition-all duration-700 ease-out"
            transform="rotate(135 60 60)"
          />
        </svg>

        <!-- Center Readout with high-contrast tabular figures -->
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <!-- Semantic Health Indicator Header -->
          <div class="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-0.5 flex items-center gap-1.5">
            <Sparkles class="w-3 h-3 text-cyan-500 shrink-0" />
            <span>{{ t('predictive.healthIndicator') }}</span>
          </div>

          <div class="text-6xl sm:text-7xl font-black tracking-tighter text-slate-900 dark:text-white font-mono tabular-nums">
            {{ api }}
          </div>
          
          <!-- Category Status Pill -->
          <div
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm mt-1 transition-colors"
            :style="{ borderColor: categoryColor, color: categoryColor }"
          >
            <span :class="['w-2 h-2 rounded-full animate-pulse', statusBadgeDot]"></span>
            <span>{{ t(`categories.${category}`) }}</span>
          </div>

          <!-- Dominant Pollutant -->
          <div 
            class="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 inline-flex items-center gap-1 pointer-events-auto"
          >
            <span class="text-slate-500">Pollutant:</span>
            <span class="font-bold text-slate-900 dark:text-white">{{ station.dominantPollutant || 'PM2.5' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 3-Hour Velocity Trajectory Pill -->
    <div v-if="velocity && !station.isStale" class="flex justify-center -mt-2 mb-4 relative z-10">
      <div 
        :class="[
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border transition-colors shadow-sm',
          velocityClass
        ]"
      >
        <component :is="velocityIcon" class="w-3.5 h-3.5 shrink-0" />
        <span>{{ velocityText }}</span>
      </div>
    </div>

    <!-- Health Advice Context Banner -->
    <div class="bg-slate-50 dark:bg-neutral-900/80 rounded-2xl p-4 border border-slate-200 dark:border-white/10 text-xs flex items-center gap-3 relative z-10 shadow-sm mb-3">
      <span class="text-2xl select-none shrink-0" role="img">{{ statusIcon }}</span>
      <p class="text-slate-700 dark:text-slate-200 leading-relaxed font-medium flex-1">
        {{ t(`advice.${category}`) }}
      </p>
    </div>

    <!-- Physically Separated Statutory / KPM Official Status Card -->
    <div class="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-3.5 border border-slate-200/80 dark:border-white/10 text-xs flex items-center justify-between gap-3 relative z-10 shadow-sm mb-3">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="p-2 rounded-xl bg-slate-200/60 dark:bg-white/10 text-slate-700 dark:text-slate-200 shrink-0">
          <Building2 class="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        </div>
        <div class="min-w-0">
          <div class="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold truncate">
            {{ t('predictive.officialStatusTitle') }}
          </div>
          <div class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate flex items-center gap-1.5">
            <span v-if="station.api > 200" class="text-rose-600 dark:text-rose-400">{{ t('predictive.schoolClosure') }}</span>
            <span v-else-if="station.api > 100" class="text-amber-600 dark:text-amber-400">{{ t('predictive.schoolCaution') }}</span>
            <span v-else class="text-emerald-600 dark:text-emerald-400">{{ t('predictive.schoolNormal') }}</span>
          </div>
        </div>
      </div>
      <div class="text-right shrink-0 font-mono">
        <div class="text-base font-black tabular-nums text-slate-900 dark:text-white">{{ station.api }}</div>
        <div class="text-[9px] text-slate-400 uppercase tracking-wider">APIMS 24j</div>
      </div>
    </div>

    <!-- Progressive Disclosure Toggle for Forecast & Chemical Pollutants -->
    <button
      @click="isForecastOpen = !isForecastOpen"
      class="w-full py-2.5 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 text-xs font-semibold flex items-center justify-between text-slate-700 dark:text-slate-300 transition relative z-10 cursor-pointer"
      :aria-expanded="isForecastOpen"
    >
      <div class="flex items-center gap-2">
        <Clock class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
        <span>{{ isForecastOpen ? t('predictive.hideForecastAndPollutants') : t('predictive.forecastAndPollutants') }}</span>
      </div>
      <ChevronDown :class="['w-4 h-4 transition-transform duration-200 text-slate-400', isForecastOpen ? 'rotate-180 text-indigo-500' : '']" />
    </button>

    <!-- Progressive Disclosure Container (v-if strictly skips mounting until requested) -->
    <div v-if="isForecastOpen" class="space-y-4 pt-3 relative z-10">
      <!-- Stale / Offline Alert if telemetry is > 60 mins old -->
      <div v-if="station.isStale" class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
        <Clock class="w-4 h-4 shrink-0 text-amber-500" />
        <span>{{ t('predictive.offlineForecastPaused') }}</span>
      </div>

      <!-- 6-Hour Predictive Horizon Strip -->
      <div v-else-if="station.predictions6h && station.predictions6h.length" class="space-y-2">
        <div class="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          <span class="flex items-center gap-1.5">
            <Clock class="w-3.5 h-3.5 text-indigo-500" />
            <span>{{ t('predictive.title') }}</span>
          </span>
          <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500">{{ t('predictive.subtitle') }}</span>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="pred in station.predictions6h"
            :key="pred.hourOffset"
            class="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 hover:border-indigo-500/30 transition-all text-center"
          >
            <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">{{ pred.timeLabel }}</span>
            <div class="flex items-center gap-1 my-1">
              <span class="text-base sm:text-lg font-black font-mono tabular-nums text-slate-900 dark:text-white">{{ pred.projectedApi }}</span>
              <component
                :is="getPredictionTrendIcon(pred.trendDirection)"
                :class="['w-3.5 h-3.5', getPredictionTrendColor(pred.trendDirection)]"
              />
            </div>
            <span
              :class="[
                'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border',
                getPredictionBadgeClass(pred.projectedApi)
              ]"
            >
              {{ getPredictionCategoryLabel(pred.projectedApi) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 4-Cell Primary Pollutants Telemetry Grid -->
      <div v-if="station.pollutants" class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div
          v-for="(val, polKey) in station.pollutants"
          :key="polKey"
          class="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 text-center"
        >
          <span class="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            {{ polKey }}
          </span>
          <span class="text-base font-black font-mono tabular-nums text-slate-900 dark:text-white mt-0.5 block">
            {{ val?.value ?? val }}
          </span>
          <span class="text-[9px] text-slate-400 font-mono block">
            {{ val?.unit || (polKey.startsWith('pm') ? 'µg/m³' : 'ppm') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
