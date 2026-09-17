<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAirQualityStore } from '../stores/airQuality.js';
import { 
  Flame, 
  Compass, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  HelpCircle, 
  X, 
  Shirt, 
  Activity, 
  ShieldAlert, 
  School, 
  Satellite,
  Wind,
  Lightbulb
} from 'lucide-vue-next';

const props = defineProps({
  hotspots: {
    type: Object,
    required: true
  },
  trendAnalysis: {
    type: Object,
    default: () => ({ delta: 0, status: 'stable' })
  }
});

const { t } = useI18n();
const isGuideModalOpen = ref(false);
const store = useAirQualityStore();

const totalHotspots = computed(() => {
  return (props.hotspots.sumatra || 0) + (props.hotspots.kalimantan || 0) + (props.hotspots.malaysia || 0);
});

// Determine dynamic practical advice based on hotspot count and wind direction
const practicalTip = computed(() => {
  if (props.hotspots.kalimantan > 150) {
    return `🔥 High fire activity in Kalimantan (${props.hotspots.kalimantan} satellite hotspots). Southern Sarawak & Borneo face elevated smoke drift. Keep N95 masks ready.`;
  } else if (totalHotspots.value > 100) {
    return t('hotspots.practicalTipElevated');
  } else if (totalHotspots.value >= 50) {
    return t('hotspots.practicalTipModerate');
  } else {
    return t('hotspots.practicalTipLow');
  }
});
</script>

<template>
  <div class="rounded-3xl p-5 sm:p-6 bg-white dark:bg-black border border-slate-200 dark:border-white/[0.12] shadow-xl space-y-3.5 relative">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Flame class="w-4 h-4 text-amber-500 animate-pulse" />
          <span>{{ t('hotspots.title') }}</span>
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ t('hotspots.subtitle') }}</p>
      </div>

      <div class="flex items-center gap-1.5">
        <!-- Live Satellite Badge -->
        <span
          v-if="hotspots.isLive"
          class="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono uppercase"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>LIVE ASMC</span>
        </span>

        <!-- Explanatory "How it works" Info Button -->
        <button
          @click="isGuideModalOpen = true"
          class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-black hover:bg-slate-100 dark:hover:bg-neutral-950 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-indigo-500/40 text-xs font-semibold transition"
          :title="t('hotspots.howItWorks')"
        >
          <HelpCircle class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>{{ t('hotspots.howItWorks') }}</span>
        </button>

        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 font-mono">
          {{ totalHotspots }}
        </span>
      </div>
    </div>

    <!-- Hotspots Grid with Target Impact Subtitles -->
    <div class="grid grid-cols-3 gap-2 text-center text-xs">
      <!-- Sumatra Tile -->
      <div class="bg-slate-50 dark:bg-black border border-slate-200/80 dark:border-white/10 rounded-2xl p-2.5 flex flex-col justify-between">
        <div>
          <div class="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">{{ t('hotspots.sumatra') }}</div>
          <div class="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">{{ hotspots.sumatra }}</div>
        </div>
        <div class="text-[10px] text-amber-700/90 dark:text-amber-300/80 font-medium leading-tight mt-1 pt-1 border-t border-slate-200/80 dark:border-white/[0.08]">
          {{ t('hotspots.sumatraImpact') }}
        </div>
      </div>

      <!-- Kalimantan Tile -->
      <div class="bg-slate-50 dark:bg-black border border-slate-200/80 dark:border-white/10 rounded-2xl p-2.5 flex flex-col justify-between">
        <div>
          <div class="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">{{ t('hotspots.kalimantan') }}</div>
          <div class="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">{{ hotspots.kalimantan }}</div>
        </div>
        <div class="text-[10px] text-amber-700/90 dark:text-amber-300/80 font-medium leading-tight mt-1 pt-1 border-t border-slate-200/80 dark:border-white/[0.08]">
          {{ t('hotspots.kalimantanImpact') }}
        </div>
      </div>

      <!-- Malaysia Tile -->
      <div class="bg-slate-50 dark:bg-black border border-slate-200/80 dark:border-white/10 rounded-2xl p-2.5 flex flex-col justify-between">
        <div>
          <div class="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">{{ t('hotspots.malaysia') }}</div>
          <div class="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{{ hotspots.malaysia }}</div>
        </div>
        <div class="text-[10px] text-emerald-700/90 dark:text-emerald-400/80 font-medium leading-tight mt-1 pt-1 border-t border-slate-200/80 dark:border-white/[0.08]">
          {{ t('hotspots.malaysiaImpact') }}
        </div>
      </div>
    </div>

    <!-- Monsoon Wind & Trajectory Status -->
    <div class="bg-slate-50 dark:bg-black border border-slate-200/80 dark:border-white/10 rounded-2xl p-3 space-y-2 text-xs">
      <!-- Wind info -->
      <div class="flex items-center justify-between flex-wrap gap-1">
        <div class="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <Compass class="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 rotate-45" />
          <span class="font-medium text-xs">{{ t('hotspots.wind') }}:</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30 font-mono font-bold uppercase">LIVE MET</span>
        </div>
        <span class="font-mono text-xs text-sky-600 dark:text-sky-300 font-bold">
          {{ hotspots.windDirection }} • {{ hotspots.windSpeedKm }}
        </span>
      </div>

      <!-- Smoke trajectory line -->
      <div v-if="hotspots.smokeTrajectory" class="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 px-0.5">
        <span class="text-sky-500 dark:text-sky-400">💨</span>
        <span class="truncate">{{ hotspots.smokeTrajectory }}</span>
      </div>

      <!-- 📍 View Drift on Map cross-link -->
      <button
        @click="store.toggleWindOverlay(true)"
        :class="[
          'w-full mt-1 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition border',
          store.showWindOverlay
            ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-700 dark:text-cyan-300'
            : store.isPlumeThreatActive
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 animate-pulse'
              : 'bg-slate-100 dark:bg-neutral-950 border-slate-200 dark:border-white/10 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white'
        ]"
      >
        <span>{{ t('windOverlay.viewDriftOnMap') }}</span>
        <span v-if="store.isPlumeThreatActive && !store.showWindOverlay" class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
      </button>

      <!-- Trend Warning / Status -->

      <div
        :class="[
          'p-2 rounded-xl flex items-center gap-2 font-medium text-xs',
          trendAnalysis.status === 'deteriorating'
            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
            : trendAnalysis.status === 'improving'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              : 'bg-slate-100 dark:bg-neutral-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10'
        ]"
      >
        <component
          :is="trendAnalysis.status === 'deteriorating' ? AlertTriangle : trendAnalysis.status === 'improving' ? TrendingDown : TrendingUp"
          class="w-3.5 h-3.5 shrink-0"
        />
        <span>
          {{
            trendAnalysis.status === 'deteriorating'
              ? t('hotspots.trendWarning')
              : trendAnalysis.status === 'improving'
                ? t('hotspots.trendImproving')
                : t('hotspots.trendStable')
          }}
          ({{ trendAnalysis.delta >= 0 ? `+${trendAnalysis.delta}` : trendAnalysis.delta }} pts in 3h)
        </span>
      </div>
    </div>

    <!-- Dynamic Practical Action Callout Banner -->
    <div class="bg-indigo-50/70 dark:bg-black border border-indigo-200 dark:border-indigo-500/40 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-indigo-950 dark:text-indigo-200">
      <div class="p-1 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 shrink-0 mt-0.5">
        <Lightbulb class="w-3.5 h-3.5" />
      </div>
      <div>
        <div class="font-bold text-[10px] uppercase tracking-wider text-indigo-700 dark:text-indigo-300">{{ t('hotspots.practicalTipTitle') }}</div>
        <p class="text-xs text-indigo-900 dark:text-indigo-100 font-medium leading-relaxed mt-0.5">
          {{ practicalTip }}
        </p>
      </div>
    </div>

    <!-- Deep-Dive Educational Guide Modal -->
    <Teleport to="body">
      <div
        v-if="isGuideModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity"
      >
        <div class="w-full max-w-lg bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <!-- Modal Header -->
          <div class="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="p-1.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Flame class="w-4 h-4" />
              </div>
              <div>
                <h3 class="font-bold text-slate-900 dark:text-slate-100 text-sm">{{ t('hotspots.guideTitle') }}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('hotspots.guideSubtitle') }}</p>
              </div>
            </div>
            <button
              @click="isGuideModalOpen = false"
              class="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-950 transition"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Modal Scrollable Content -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
            <!-- Card 1: What is ASMC & Hotspots? -->
            <div class="bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 space-y-1.5">
              <div class="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-bold text-xs uppercase tracking-wide">
                <Satellite class="w-4 h-4" />
                <span>{{ t('hotspots.whatIsAsmc') }}</span>
              </div>
              <p class="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                {{ t('hotspots.whatIsAsmcDesc') }}
              </p>
            </div>

            <!-- Card 2: Hotspot Threat Scale -->
            <div class="bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 space-y-2">
              <div class="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wide">
                <Flame class="w-4 h-4" />
                <span>{{ t('hotspots.hotspotScaleTitle') }}</span>
              </div>
              <div class="space-y-1.5 text-xs">
                <div class="flex items-center gap-2 p-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span class="font-medium">{{ t('hotspots.scaleLow') }}</span>
                </div>
                <div class="flex items-center gap-2 p-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 text-amber-700 dark:text-amber-300">
                  <span class="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                  <span class="font-medium">{{ t('hotspots.scaleMod') }}</span>
                </div>
                <div class="flex items-center gap-2 p-1.5 rounded-xl bg-red-500/10 dark:bg-red-950/40 border border-red-500/30 text-red-700 dark:text-red-300">
                  <span class="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                  <span class="font-medium">{{ t('hotspots.scaleHigh') }}</span>
                </div>
              </div>
            </div>

            <!-- Card 3: Why Monsoon Wind Matters -->
            <div class="bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 space-y-1.5">
              <div class="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wide">
                <Wind class="w-4 h-4" />
                <span>{{ t('hotspots.whyWindMatters') }}</span>
              </div>
              <p class="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                {{ t('hotspots.whyWindMattersDesc') }}
              </p>
            </div>

            <!-- Card 4: What This Means For Your Day -->
            <div class="bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 space-y-3">
              <div class="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wide">
                <Lightbulb class="w-4 h-4 text-amber-500" />
                <span>{{ t('hotspots.decisionsTitle') }}</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <!-- Laundry -->
                <div class="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-white/10 rounded-xl p-2.5">
                  <div class="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-200 mb-1">
                    <Shirt class="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
                    <span>{{ t('hotspots.decisionLaundry') }}</span>
                  </div>
                  <p class="text-slate-500 dark:text-slate-400 leading-snug">{{ t('hotspots.decisionLaundryDesc') }}</p>
                </div>

                <!-- Outdoor Sports -->
                <div class="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-white/10 rounded-xl p-2.5">
                  <div class="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-200 mb-1">
                    <Activity class="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                    <span>{{ t('hotspots.decisionSports') }}</span>
                  </div>
                  <p class="text-slate-500 dark:text-slate-400 leading-snug">{{ t('hotspots.decisionSportsDesc') }}</p>
                </div>

                <!-- Buying N95 Masks -->
                <div class="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-white/10 rounded-xl p-2.5">
                  <div class="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-200 mb-1">
                    <ShieldAlert class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                    <span>{{ t('hotspots.decisionMasks') }}</span>
                  </div>
                  <p class="text-slate-500 dark:text-slate-400 leading-snug">{{ t('hotspots.decisionMasksDesc') }}</p>
                </div>

                <!-- Schools & Kids -->
                <div class="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-white/10 rounded-xl p-2.5">
                  <div class="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-200 mb-1">
                    <School class="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <span>{{ t('hotspots.decisionSchools') }}</span>
                  </div>
                  <p class="text-slate-500 dark:text-slate-400 leading-snug">{{ t('hotspots.decisionSchoolsDesc') }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="p-3.5 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-black flex justify-end">
            <button
              @click="isGuideModalOpen = false"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md"
            >
              Faham / Got It
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
