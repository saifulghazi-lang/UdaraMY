<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Calendar, Info, CloudRain, Sun, Wind, MapPin } from 'lucide-vue-next';
import { getCategoryColor } from '../data/stations.js';

const props = defineProps({
  currentApi: {
    type: Number,
    default: 85
  },
  stationState: {
    type: String,
    default: 'Kuala Lumpur'
  },
  stationName: {
    type: String,
    default: ''
  },
  stationRegion: {
    type: String,
    default: 'Peninsular'
  }
});

const { t, locale } = useI18n();
const hoveredDay = ref(null);

// Determine regional meteorological profile based on selected station state/region
const regionalProfile = computed(() => {
  const state = props.stationState || '';
  const region = props.stationRegion || '';

  if (region === 'Sarawak' || state.includes('Sarawak')) {
    return {
      type: 'sarawak',
      badge: t('calendar.sarawakBadge'),
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      hazeMonths: [7, 8], // Aug, Sep peak (West Kalimantan)
      hazeBase: 125,
      cleanBase: 24,
      moderateMonths: [5, 6, 9] // Jun, Jul, Oct
    };
  } else if (region === 'Sabah' || state.includes('Sabah') || state.includes('Labuan')) {
    return {
      type: 'sabah',
      badge: t('calendar.sabahBadge'),
      badgeClass: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
      hazeMonths: [8], // Sep peak (rare)
      hazeBase: 65,
      cleanBase: 22,
      moderateMonths: [2, 7] // Mar, Aug
    };
  } else if (['Pulau Pinang', 'Kedah', 'Perlis'].includes(state)) {
    return {
      type: 'north',
      badge: t('calendar.northBadge'),
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      hazeMonths: [1, 2, 7, 8], // Feb, Mar (Mekong agricultural) & Aug, Sep (Sumatra)
      hazeBase: 98,
      cleanBase: 35,
      moderateMonths: [0, 3, 6] // Jan, Apr, Jul
    };
  } else if (['Kelantan', 'Terengganu', 'Pahang'].includes(state)) {
    return {
      type: 'eastCoast',
      badge: t('calendar.eastCoastBadge'),
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      hazeMonths: [6, 7], // Jul, Aug
      hazeBase: 68,
      cleanBase: 22,
      moderateMonths: [4, 5, 8] // May, Jun, Sep
    };
  } else {
    // West Coast Peninsular (KL, Selangor, Putrajaya, N. Sembilan, Melaka, Johor, Perak)
    return {
      type: 'westCoast',
      badge: t('calendar.westCoastBadge'),
      badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
      hazeMonths: [7, 8, 9], // Aug, Sep, Oct (Sumatra SW Monsoon)
      hazeBase: 115,
      cleanBase: 36,
      moderateMonths: [1, 2, 5, 6] // Feb, Mar (dry inter-monsoon), Jun, Jul
    };
  }
});

// Generate 365 days of calendar data with Malaysian seasonal meteorological patterns
const calendarDays = computed(() => {
  const days = [];
  const now = new Date();
  const year = now.getFullYear();
  const startDate = new Date(year, 0, 1);
  const currentDayOfYear = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  const prof = regionalProfile.value;

  for (let i = 0; i < 365; i++) {
    const d = new Date(year, 0, i + 1);
    const month = d.getMonth(); // 0 = Jan, 11 = Dec
    const isToday = i === currentDayOfYear;

    let baseApi = prof.cleanBase;
    let season = 'clean';

    if (prof.hazeMonths.includes(month)) {
      season = 'haze';
      const cycle = Math.sin((i - 220) / 25) * 35;
      baseApi = Math.round(prof.hazeBase + cycle + (i % 5 === 0 ? 30 : (i % 3) * 10));
    } else if (prof.moderateMonths.includes(month)) {
      season = 'moderate';
      baseApi = Math.round(prof.cleanBase + 25 + (i % 4) * 6);
    } else {
      season = 'washout';
      baseApi = Math.round(prof.cleanBase + (i % 6) * 3);
    }

    if (isToday) {
      baseApi = props.currentApi;
    }

    let category = 'good';
    if (baseApi > 200) category = 'veryUnhealthy';
    else if (baseApi > 100) category = 'unhealthy';
    else if (baseApi > 50) category = 'moderate';

    days.push({
      index: i,
      date: d,
      month,
      day: d.getDate(),
      api: Math.max(15, baseApi),
      category,
      season,
      isToday
    });
  }
  return days;
});

// Group into 53 weeks for contribution-like display
const calendarWeeks = computed(() => {
  const weeks = [];
  let currentWeek = [];
  
  calendarDays.value.forEach((d, idx) => {
    currentWeek.push(d);
    if (currentWeek.length === 7 || idx === calendarDays.value.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  return weeks;
});

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDayDate(d) {
  if (!d) return '';
  return d.date.toLocaleDateString(locale.value === 'bm' ? 'ms-MY' : 'en-MY', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}
</script>

<template>
  <div class="rounded-3xl p-5 sm:p-6 bg-white dark:bg-black border border-slate-200 dark:border-white/[0.12] shadow-2xl space-y-4 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <div>
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar class="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>{{ t('calendar.title') }}</span>
          </h3>
          <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono', regionalProfile.badgeClass]">
            {{ stationState }}: {{ regionalProfile.badge }}
          </span>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {{ t('calendar.stateProfile', { state: stationState }) }}
        </p>
      </div>

      <!-- Quick Season Legend Badges -->
      <div class="flex items-center gap-2 text-[10px] shrink-0">
        <span class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-medium">
          <Sun class="w-3 h-3 text-amber-500" />
          <span>{{ t('calendar.hazeSeason') }}</span>
        </span>
        <span class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-medium">
          <CloudRain class="w-3 h-3 text-emerald-500" />
          <span>{{ t('calendar.cleanSeason') }}</span>
        </span>
      </div>
    </div>

    <!-- 365 Days Heatmap Grid -->
    <div class="overflow-x-auto pb-2 custom-scrollbar">
      <div class="min-w-[680px]">
        <!-- Months Labels -->
        <div class="flex text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1 px-1">
          <div v-for="(m, idx) in months" :key="idx" class="flex-1 text-left">
            {{ m }}
          </div>
        </div>

        <!-- Heatmap Grid (7 rows x 52 columns) -->
        <div class="flex gap-1">
          <div
            v-for="(week, wIdx) in calendarWeeks"
            :key="wIdx"
            class="flex flex-col gap-1"
          >
            <div
              v-for="day in week"
              :key="day.index"
              @mouseenter="hoveredDay = day"
              @mouseleave="hoveredDay = null"
              @touchstart.passive="hoveredDay = day"
              :class="[
                'w-2.5 h-2.5 rounded-[2px] cursor-pointer transition-all duration-150',
                day.isToday ? 'ring-2 ring-indigo-500 dark:ring-white scale-125 z-10' : 'hover:scale-125'
              ]"
              :style="{
                backgroundColor: getCategoryColor(day.category),
                opacity: day.category === 'good' ? 0.35 : day.category === 'moderate' ? 0.65 : 0.95
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Active Hover / Inspection Panel -->
    <div class="bg-slate-50 dark:bg-black border border-slate-200/80 dark:border-white/10 rounded-2xl p-2.5 flex items-center justify-between text-xs min-h-[44px] transition-colors">
      <div v-if="hoveredDay" class="flex items-center gap-2 flex-wrap">
        <span
          class="w-2.5 h-2.5 rounded-full shrink-0"
          :style="{ backgroundColor: getCategoryColor(hoveredDay.category) }"
        />
        <span class="font-semibold text-slate-800 dark:text-slate-200">{{ formatDayDate(hoveredDay) }}</span>
        <span class="text-slate-600 dark:text-slate-400 font-mono">
          API ~<strong class="text-slate-900 dark:text-white">{{ hoveredDay.api }}</strong>
        </span>
        <span
          v-if="hoveredDay.isToday"
          class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold"
        >
          {{ t('calendar.today') }}
        </span>
      </div>

      <div v-else class="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1.5">
        <Info class="w-3.5 h-3.5 text-slate-400" />
        <span>{{ t('calendar.hoverPrompt') }}</span>
      </div>

      <!-- Color scale reference -->
      <div class="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
        <span>Clean</span>
        <div class="flex gap-0.5">
          <div class="w-2 h-2 rounded-[2px] bg-[#00d2ff]/40"></div>
          <div class="w-2 h-2 rounded-[2px] bg-emerald-500/70"></div>
          <div class="w-2 h-2 rounded-[2px] bg-amber-500"></div>
          <div class="w-2 h-2 rounded-[2px] bg-red-500"></div>
          <div class="w-2 h-2 rounded-[2px] bg-[#881337]"></div>
        </div>
        <span>Haze Peak</span>
      </div>
    </div>
  </div>
</template>
