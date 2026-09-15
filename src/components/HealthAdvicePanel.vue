<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { 
  HeartPulse, 
  School, 
  Wind, 
  ShieldCheck, 
  Activity, 
  Eye, 
  Sparkles,
  Home,
  CheckCircle2,
  AlertTriangle,
  XCircle
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

const personas = [
  { id: 'general', icon: '🏃', label: 'Runner / Active', sub: 'Cardio & Outdoors' },
  { id: 'toddler', icon: '👶', label: 'School & Kids', sub: 'Recess & Rec' },
  { id: 'asthma', icon: '🫁', label: 'Sensitive / Asthma', sub: 'Airway Care' },
  { id: 'elderly', icon: '👵', label: 'Senior & Home', sub: 'Ventilation' }
];

const activePersona = computed(() => store.activeProfile || 'general');

function selectPersona(id) {
  store.setProfile(id);
}

// Persona specific dynamic advice
const personaGuidance = computed(() => {
  const p = activePersona.value;
  const api = props.api;

  if (p === 'asthma') {
    if (api > 200) {
      return {
        level: 'danger',
        badge: 'HIGH ALERT',
        title: 'Severe bronchospasm trigger',
        text: 'Keep rescue bronchodilator (reliever) in immediate reach. Run HEPA filtration indoors on high.'
      };
    }
    if (api > 100) {
      return {
        level: 'warning',
        badge: 'ELEVATED RISK',
        title: 'Micro-particles irritating airways',
        text: 'Avoid outdoor exercise. Pre-medicate with doctor-prescribed preventer if throat tightness develops.'
      };
    }
    return {
      level: 'good',
      badge: 'SAFE TO BREATHE',
      title: 'Minimal airway resistance',
      text: 'Air particulate levels are within safe respiratory thresholds. Carry standard inhaler as normal routine.'
    };
  }

  if (p === 'toddler') {
    if (api > 200) {
      return {
        level: 'danger',
        badge: 'SCHOOLS SHUT',
        title: 'Official MOE Closure Triggered',
        text: 'Children must remain strictly indoors. Keep windows sealed and avoid unventilated hallways.'
      };
    }
    if (api > 100) {
      return {
        level: 'warning',
        badge: 'CANCEL RECESS',
        title: 'Outdoor sports prohibited by MOE',
        text: 'Schools and kindergartens must suspend outdoor field activities and playground sessions.'
      };
    }
    return {
      level: 'good',
      badge: 'SAFE FOR RECESS',
      title: 'Normal playground activities safe',
      text: 'Children can participate fully in physical education, playground games, and outdoor sports.'
    };
  }

  if (p === 'elderly') {
    if (api > 100) {
      return {
        level: 'warning',
        badge: 'STAY INDOORS',
        title: 'Cardiovascular strain window',
        text: 'Avoid early morning walks when haze settles near ground level. Monitor blood pressure and resting pulse.'
      };
    }
    return {
      level: 'good',
      badge: 'HEALTHY AIR',
      title: 'Safe for garden and morning walks',
      text: 'Atmospheric oxygenation is optimal. Excellent conditions for senior walking and outdoor leisure.'
    };
  }

  // Default: General Runner / Athlete
  if (api > 150) {
    return {
      level: 'danger',
      badge: 'INDOOR ONLY',
      title: 'Heavy cardio prohibited outdoors',
      text: 'High air intake during runs will deposit particulate matter deep into alveoli. Shift to indoor treadmill/gym.'
    };
  }
  if (api > 100) {
    return {
      level: 'warning',
      badge: 'MODERATE RUNS',
      title: 'Limit marathon & interval training',
      text: 'Keep outdoor runs below 30 minutes at easy pace. Sensitive runners should wear KF94 mask.'
    };
  }
  return {
    level: 'good',
    badge: 'OPTIMAL RUNNING',
    title: 'Peak conditions for outdoor cardio',
    text: 'Zero respiration impairment detected. Ideal for long-distance runs, cycling, and vigorous training.'
  };
});
</script>

<template>
  <div class="rounded-3xl p-5 sm:p-6 bg-black border border-white/[0.12] shadow-2xl space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <HeartPulse class="w-4 h-4 text-cyan-400" />
        <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
          {{ t('guidance.title') }}
        </h3>
      </div>

      <!-- School status trigger pill -->
      <span
        v-if="isSchoolClosureTriggered"
        class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse flex items-center gap-1"
      >
        <School class="w-3 h-3" />
        <span>MOE Closure (API > 200)</span>
      </span>
      <span v-else class="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        Schools Normal
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
            ? 'bg-black border-cyan-400 text-white shadow-md shadow-cyan-500/20 ring-1 ring-cyan-500/40' 
            : 'bg-black border-white/10 text-slate-400 hover:text-white hover:bg-neutral-950 hover:border-white/20'
        ]"
      >
        <div class="flex items-center justify-between">
          <span class="text-lg">{{ p.icon }}</span>
          <span
            v-if="activePersona === p.id"
            class="w-1.5 h-1.5 rounded-full bg-cyan-400"
          ></span>
        </div>
        <div class="mt-1">
          <div class="font-bold text-xs leading-tight">{{ p.label }}</div>
          <div class="text-[10px] text-slate-500 font-mono mt-0.5">{{ p.sub }}</div>
        </div>
      </button>
    </div>

    <!-- Active Persona Context Card -->
    <div
      :class="[
        'p-3.5 rounded-2xl border transition-all text-xs flex items-start gap-3',
        personaGuidance.level === 'danger' 
          ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' 
          : personaGuidance.level === 'warning'
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
      ]"
    >
      <Sparkles class="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
      <div class="space-y-0.5 flex-1">
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-white text-xs">{{ personaGuidance.title }}</h4>
          <span class="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-black/40 border border-white/10">
            {{ personaGuidance.badge }}
          </span>
        </div>
        <p class="text-slate-300 text-[11px] leading-relaxed">
          {{ personaGuidance.text }}
        </p>
      </div>
    </div>

    <!-- 4 Action Pillars Grid -->
    <div class="grid grid-cols-2 gap-2.5 text-xs pt-1">
      <!-- 1. Outdoor Sports -->
      <div class="p-3 rounded-2xl bg-black border border-white/10 hover:border-white/20 transition">
        <div class="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
          <Activity class="w-3 h-3 text-cyan-400" />
          <span>{{ t('guidance.outdoorSports') }}</span>
        </div>
        <div class="font-bold text-white mt-1 text-xs">
          {{ t(`guidance.sports.${category}`) }}
        </div>
      </div>

      <!-- 2. Mask Protection -->
      <div class="p-3 rounded-2xl bg-black border border-white/10 hover:border-white/20 transition">
        <div class="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
          <ShieldCheck class="w-3 h-3 text-emerald-400" />
          <span>{{ t('guidance.maskProtection') }}</span>
        </div>
        <div class="font-bold text-white mt-1 text-xs">
          {{ t(`guidance.mask.${category}`) }}
        </div>
      </div>

      <!-- 3. Indoor Air / Windows -->
      <div class="p-3 rounded-2xl bg-black border border-white/10 hover:border-white/20 transition">
        <div class="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
          <Wind class="w-3 h-3 text-amber-400" />
          <span>{{ t('guidance.indoorAir') }}</span>
        </div>
        <div class="font-bold text-white mt-1 text-xs">
          {{ t(`guidance.windows.${category}`) }}
        </div>
      </div>

      <!-- 4. School Status -->
      <div class="p-3 rounded-2xl bg-black border border-white/10 hover:border-white/20 transition">
        <div class="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
          <School class="w-3 h-3 text-purple-400" />
          <span>{{ t('guidance.schoolStatus') }}</span>
        </div>
        <div class="font-bold text-white mt-1 text-xs">
          {{ t(`guidance.schools.${category}`) }}
        </div>
      </div>
    </div>
  </div>
</template>
