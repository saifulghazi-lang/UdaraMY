<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { 
  MapPin, 
  ChevronRight, 
  RotateCcw,
  Sparkles
} from 'lucide-vue-next';

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

const category = computed(() => props.station.category);
const api = computed(() => props.station.api);

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

const ambientGlowClass = computed(() => {
  switch (category.value) {
    case 'good': return 'from-cyan-500/20 via-blue-500/10 to-transparent';
    case 'moderate': return 'from-emerald-500/20 via-teal-500/10 to-transparent';
    case 'unhealthy': return 'from-amber-500/25 via-orange-500/15 to-transparent';
    case 'veryUnhealthy': return 'from-red-500/30 via-rose-500/20 to-transparent';
    case 'hazardous': return 'from-purple-950/40 via-rose-950/30 to-transparent';
    default: return 'from-neutral-800/20 to-transparent';
  }
});

const badgeBgClass = computed(() => {
  switch (category.value) {
    case 'good': return 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300';
    case 'moderate': return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300';
    case 'unhealthy': return 'bg-amber-500/20 border-amber-500/40 text-amber-300';
    case 'veryUnhealthy': return 'bg-rose-500/20 border-rose-500/40 text-rose-300';
    case 'hazardous': return 'bg-purple-500/25 border-purple-500/40 text-purple-300';
    default: return 'bg-white/5 border-white/10 text-neutral-300';
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

// Particles based on API severity
const particles = computed(() => {
  const count = Math.min(35, Math.max(6, Math.round(api.value / 7)));
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.floor(Math.random() * 3) + 2,
    left: Math.floor(Math.random() * 95) + '%',
    bottom: '-10px',
    delay: (Math.random() * 5).toFixed(1) + 's',
    duration: (Math.random() * 4 + 4).toFixed(1) + 's'
  }));
});
</script>

<template>
  <div
    class="relative rounded-3xl p-5 sm:p-7 text-slate-800 dark:text-white overflow-hidden shadow-xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-black transition-all duration-700"
  >
    <!-- Dynamic Ambient Colored Backdrop Glow -->
    <div
      :class="[
        'absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-1000 bg-gradient-to-br opacity-40 dark:opacity-100',
        ambientGlowClass
      ]"
      aria-hidden="true"
    ></div>

    <!-- Background Atmospheric Particles -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div
        v-for="p in particles"
        :key="p.id"
        class="absolute rounded-full bg-slate-400/20 dark:bg-white/30 animate-particle pointer-events-none"
        :style="{
          width: p.size + 'px',
          height: p.size + 'px',
          left: p.left,
          bottom: p.bottom,
          animationDelay: p.delay,
          animationDuration: p.duration
        }"
      />
    </div>

    <!-- Header: Station Information & Status -->
    <div class="flex items-start justify-between relative z-10 gap-3">
      <!-- Station Information & Quick Switcher -->
      <button
        @click="emit('openStationSelector')"
        class="text-left group focus:outline-none flex-1 transition"
      >
        <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider flex-wrap">
          <MapPin class="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
          <span>{{ station.state }}</span>
          <span
            v-if="distanceKm !== null"
            class="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-mono border border-slate-200 dark:border-white/10"
          >
            {{ distanceKm }} km
          </span>
          <span
            v-if="isNearest"
            class="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold"
          >
            📍 {{ t('location.nearest') }}
          </span>
          <span
            v-if="station.isCommunity"
            class="text-[10px] px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 font-bold"
          >
            👥 {{ station.sensorModel || 'Community' }}
          </span>
        </div>
        <div class="flex items-center gap-1.5 mt-1">
          <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
            {{ station.name }}
          </h2>
          <ChevronRight class="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
        </div>
        <p v-if="station.subTitle" class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          {{ station.subTitle }}
        </p>
      </button>

      <!-- Active Simulation Reset Pill if simulation is running -->
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
        {{ station.isCommunity ? (station.host ? `OpenAQ • ${station.host}` : 'Citizen Sensor Network') : t('app.dataSource') }}
      </span>
    </div>

    <!-- Center Hero: Modern Radial Tachometer Gauge -->
    <div class="my-5 flex flex-col items-center justify-center relative z-10">
      <div class="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
        <!-- SVG Radial Gauge -->
        <svg class="w-full h-full" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" :stop-color="categoryColor" />
              <stop offset="100%" :stop-color="categorySecondaryColor" />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" :flood-color="categoryColor" flood-opacity="0.5"/>
            </filter>
          </defs>

          <!-- Outer Reference Ticks Ring -->
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            stroke-width="1"
            stroke-dasharray="2 6"
          />

          <!-- Background Inactive Track (270 degree arc) -->
          <circle
            cx="60"
            cy="60"
            r="48"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
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
            filter="url(#gaugeGlow)"
            class="transition-all duration-700 ease-out"
            transform="rotate(135 60 60)"
          />
        </svg>

        <!-- Center Readout -->
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <div class="text-6xl sm:text-7xl font-black tracking-tighter text-slate-900 dark:text-white font-mono drop-shadow-sm dark:drop-shadow-md">
            {{ api }}
          </div>
          
          <!-- Category Status Pill -->
          <div
            :class="[
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm mt-1 transition-colors',
              badgeBgClass
            ]"
          >
            <span :class="['w-2 h-2 rounded-full animate-pulse', statusBadgeDot]"></span>
            <span>{{ t(`categories.${category}`) }}</span>
          </div>

          <!-- Dominant Pollutant Micro-tag with explanation badge -->
          <div 
            class="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 inline-flex items-center gap-1 pointer-events-auto"
            title="Primary pollutant driving today's API"
          >
            <span class="text-slate-500">Pollutant:</span>
            <span class="text-cyan-600 dark:text-cyan-300 font-bold">{{ station.dominantPollutant || 'PM2.5' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Health Advice Context Banner -->
    <div class="bg-slate-50 dark:bg-black rounded-2xl p-4 border border-slate-200 dark:border-white/10 text-xs flex items-center gap-3 relative z-10 shadow-sm">
      <span class="text-2xl select-none shrink-0" role="img">{{ statusIcon }}</span>
      <p class="text-slate-700 dark:text-slate-200 leading-relaxed font-medium flex-1">
        {{ t(`advice.${category}`) }}
      </p>
    </div>
  </div>
</template>
