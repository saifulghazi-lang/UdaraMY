<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Calendar, Info, CloudRain, Sun, Wind } from 'lucide-vue-next';
import { getCategoryColor } from '../data/stations.js';

const props = defineProps({
  currentApi: {
    type: Number,
    default: 85
  }
});

const { t, locale } = useI18n();
const hoveredDay = ref(null);

// Generate 365 days of calendar data with Malaysian seasonal meteorological patterns
const calendarDays = computed(() => {
  const days = [];
  const now = new Date();
  const year = now.getFullYear();
  const startDate = new Date(year, 0, 1);
  const currentDayOfYear = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < 365; i++) {
    const d = new Date(year, 0, i + 1);
    const month = d.getMonth(); // 0 = Jan, 11 = Dec
    const day = d.getDate();
    const isToday = i === currentDayOfYear;

    let baseApi = 35;
    let season = 'clean';

    // Meteorological seasonality in Malaysia:
    // Jan - Feb: Wet season / NE Monsoon (API 25 - 45)
    // Mar - May: Inter-monsoon (API 45 - 70)
    // Jun - Jul: Early SW Monsoon (API 55 - 85)
    // Aug - Oct: Peak SW Monsoon Haze Risk (API 90 - 185 with episodic spikes)
    // Nov - Dec: Early NE Monsoon Washout (API 25 - 45)
    if (month >= 7 && month <= 9) { // Aug, Sep, Oct
      season = 'haze';
      // simulate historical peak distribution with occasional spikes
      const cycle = Math.sin((i - 210) / 30) * 45;
      baseApi = Math.round(110 + cycle + (i % 7 === 0 ? 35 : (i % 3) * 12));
    } else if (month >= 5 && month <= 6) { // Jun, Jul
      season = 'transitional';
      baseApi = Math.round(55 + (i % 5) * 8);
    } else if (month >= 2 && month <= 4) { // Mar, Apr, May
      season = 'moderate';
      baseApi = Math.round(45 + (i % 4) * 6);
    } else { // Nov, Dec, Jan, Feb
      season = 'washout';
      baseApi = Math.round(28 + (i % 6) * 4);
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
      day,
      api: baseApi,
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
  <div class="rounded-3xl p-5 sm:p-6 bg-black border border-white/[0.12] shadow-2xl space-y-4">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar class="w-4 h-4 text-indigo-400" />
          <span>{{ t('calendar.title') }}</span>
        </h3>
        <p class="text-xs text-slate-400 mt-0.5">{{ t('calendar.subtitle') }}</p>
      </div>

      <!-- Quick Season Legend Badges -->
      <div class="flex items-center gap-2 text-[10px]">
        <span class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
          <Sun class="w-3 h-3 text-amber-400" />
          <span>{{ t('calendar.hazeSeason') }}</span>
        </span>
        <span class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
          <CloudRain class="w-3 h-3 text-emerald-400" />
          <span>{{ t('calendar.cleanSeason') }}</span>
        </span>
      </div>
    </div>

    <!-- 365 Days Heatmap Grid -->
    <div class="overflow-x-auto pb-2 custom-scrollbar">
      <div class="min-w-[680px]">
        <!-- Months Labels -->
        <div class="flex text-[10px] font-semibold text-slate-500 mb-1 px-1">
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
                day.isToday ? 'ring-2 ring-white scale-125 z-10' : 'hover:scale-125'
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
    <div class="bg-black border border-white/10 rounded-2xl p-2.5 flex items-center justify-between text-xs min-h-[44px]">
      <div v-if="hoveredDay" class="flex items-center gap-2">
        <span
          class="w-2.5 h-2.5 rounded-full shrink-0"
          :style="{ backgroundColor: getCategoryColor(hoveredDay.category) }"
        />
        <span class="font-semibold text-slate-200">{{ formatDayDate(hoveredDay) }}</span>
        <span class="text-slate-400 font-mono">
          API ~<strong class="text-white">{{ hoveredDay.api }}</strong>
        </span>
        <span
          v-if="hoveredDay.isToday"
          class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold"
        >
          TODAY
        </span>
      </div>

      <div v-else class="text-slate-500 text-xs flex items-center gap-1.5">
        <Info class="w-3.5 h-3.5 text-slate-400" />
        <span>Hover or tap any date to inspect historical seasonal API trends</span>
      </div>

      <!-- Color scale reference -->
      <div class="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
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
