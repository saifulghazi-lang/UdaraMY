<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { 
  HeartPulse, 
  School, 
  Wind, 
  ShieldCheck, 
  Activity, 
  Sparkles
} from 'lucide-vue-next';
import { useAirQualityStore } from '../stores/airQuality.js';

const props = defineProps({
  category: {
    type: String,
    required: true
  },
  api: {
    type: Number,
    required: true
  }
});

const store = useAirQualityStore();
const { t } = useI18n();

const isSchoolClosureTriggered = computed(() => props.api > 200);

const personas = computed(() => [
  { id: 'general', icon: '🏃', label: t('personas.general.label'), sub: t('personas.general.sub') },
  { id: 'toddler', icon: '👶', label: t('personas.toddler.label'), sub: t('personas.toddler.sub') },
  { id: 'asthma', icon: '🫁', label: t('personas.asthma.label'), sub: t('personas.asthma.sub') },
  { id: 'elderly', icon: '👵', label: t('personas.elderly.label'), sub: t('personas.elderly.sub') }
]);

const activePersona = computed(() => store.activeProfile || 'general');

function selectPersona(id) {
  store.setProfile(id);
}

// Persona specific dynamic advice from locale dictionary
const personaGuidance = computed(() => {
  const p = activePersona.value;
  const api = props.api;

  let level = 'good';
  if (p === 'asthma') {
    if (api > 200) level = 'danger';
    else if (api > 100) level = 'warning';
    else level = 'good';
  } else if (p === 'toddler') {
    if (api > 200) level = 'danger';
    else if (api > 100) level = 'warning';
    else level = 'good';
  } else if (p === 'elderly') {
    if (api > 100) level = 'warning';
    else level = 'good';
  } else {
    // general
    if (api > 150) level = 'danger';
    else if (api > 100) level = 'warning';
    else level = 'good';
  }

  return {
    level,
    badge: t(`personaAdvice.${p}.${level}.badge`),
    title: t(`personaAdvice.${p}.${level}.title`),
    text: t(`personaAdvice.${p}.${level}.text`)
  };
});
</script>

<template>
  <div class="rounded-3xl p-5 sm:p-6 bg-white dark:bg-black border border-slate-200 dark:border-white/[0.12] shadow-xl dark:shadow-2xl space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <HeartPulse class="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
        <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
          {{ t('guidance.title') }}
        </h3>
      </div>

      <!-- School status trigger pill -->
      <span
        v-if="isSchoolClosureTriggered"
        class="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 animate-pulse shadow-sm"
      >
        <School class="w-3.5 h-3.5" />
        <span>{{ t('guidance.schoolsClosedAlert') }}</span>
      </span>
      <span
        v-else-if="props.api > 100"
        class="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 shadow-sm"
      >
        <School class="w-3.5 h-3.5" />
        <span>{{ t('guidance.schoolsOutdoorSuspended') }}</span>
      </span>
      <span v-else class="inline-flex items-center gap-1.5 text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>{{ t('guidance.schoolsOpenNormal') }}</span>
      </span>
    </div>

    <!-- Interactive Persona Selector Tabs -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <button
        v-for="p in personas"
        :key="p.id"
        @click="selectPersona(p.id)"
        :class="[
          'p-2.5 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between select-none focus:outline-none',
          activePersona === p.id 
            ? 'bg-cyan-50/70 dark:bg-neutral-900 border-cyan-500 dark:border-cyan-400 text-slate-900 dark:text-white shadow-sm ring-1 ring-cyan-500/30' 
            : 'bg-slate-50 dark:bg-black border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-950 hover:border-slate-300 dark:hover:border-white/20'
        ]"
      >
        <div class="flex items-center justify-between">
          <span class="text-lg">{{ p.icon }}</span>
          <span
            v-if="activePersona === p.id"
            class="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400"
          ></span>
        </div>
        <div class="mt-1">
          <div class="font-bold text-xs leading-tight">{{ p.label }}</div>
          <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{{ p.sub }}</div>
        </div>
      </button>
    </div>

    <!-- Active Persona Context Card -->
    <div
      :class="[
        'p-3.5 rounded-2xl border transition-all text-xs flex items-start gap-3',
        personaGuidance.level === 'danger' 
          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-500/40 text-rose-900 dark:text-rose-200' 
          : personaGuidance.level === 'warning'
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-500/40 text-amber-900 dark:text-amber-200'
            : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
      ]"
    >
      <Sparkles class="w-4 h-4 shrink-0 mt-0.5 text-cyan-600 dark:text-cyan-400" />
      <div class="space-y-1 flex-1">
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-slate-900 dark:text-white text-xs">{{ personaGuidance.title }}</h4>
          <span class="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 shadow-sm">
            {{ personaGuidance.badge }}
          </span>
        </div>
        <p class="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
          {{ personaGuidance.text }}
        </p>
      </div>
    </div>

    <!-- 3 Action Pillars (Sports, Mask, Windows) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
      <!-- 1. Outdoor Sports -->
      <div class="p-3 rounded-2xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition">
        <div class="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
          <Activity class="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
          <span>{{ t('guidance.outdoorSports') }}</span>
        </div>
        <div class="font-bold text-slate-900 dark:text-white mt-1 text-xs">
          {{ t(`guidance.sports.${category}`) }}
        </div>
      </div>

      <!-- 2. Mask Protection -->
      <div class="p-3 rounded-2xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition">
        <div class="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
          <ShieldCheck class="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>{{ t('guidance.maskProtection') }}</span>
        </div>
        <div class="font-bold text-slate-900 dark:text-white mt-1 text-xs">
          {{ t(`guidance.mask.${category}`) }}
        </div>
      </div>

      <!-- 3. Indoor Air / Windows -->
      <div class="p-3 rounded-2xl bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition">
        <div class="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
          <Wind class="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>{{ t('guidance.indoorAir') }}</span>
        </div>
        <div class="font-bold text-slate-900 dark:text-white mt-1 text-xs">
          {{ t(`guidance.windows.${category}`) }}
        </div>
      </div>
    </div>
  </div>
</template>
