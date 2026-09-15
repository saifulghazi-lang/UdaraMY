<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Trophy, Flame, Wind, School, ChevronRight } from 'lucide-vue-next';
import { getCategoryColor } from '../data/stations.js';

const props = defineProps({
  summary: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['selectStation', 'openLeaderboard']);
const { t } = useI18n();

const highestColor = computed(() => {
  if (!props.summary.highestStation) return '#f59e0b';
  return getCategoryColor(props.summary.highestStation.category);
});

const cleanestColor = computed(() => {
  if (!props.summary.cleanestStation) return '#00d2ff';
  return getCategoryColor(props.summary.cleanestStation.category);
});
</script>

<template>
  <div v-if="summary.highestStation" class="bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-md dark:shadow-lg space-y-2">
    <!-- Top Bar: Title + Open Full Leaderboard Button -->
    <div class="flex items-center justify-between px-1">
      <div class="flex items-center gap-2">
        <span class="text-sm select-none">🇲🇾</span>
        <span class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
          {{ t('national.title') || 'Sorotan Harian Malaysia' }}
        </span>
        <span class="hidden sm:inline text-[10px] text-slate-500 dark:text-slate-400 font-mono">
          · Purata Kebangsaan: <strong class="text-slate-900 dark:text-white">{{ summary.nationalAverage }} API</strong>
        </span>
      </div>

      <button
        @click="emit('openLeaderboard')"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 border border-indigo-200 dark:border-indigo-500/40 text-xs font-bold font-mono transition active:scale-95 shadow-sm"
      >
        <Trophy class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>{{ t('national.viewLeaderboard') || 'Papan Kedudukan 16 Negeri' }}</span>
        <ChevronRight class="w-3 h-3" />
      </button>
    </div>

    <!-- Quick Cards Grid: Highest, Cleanest, School Watch -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
      <!-- 1. Highest / Most Affected Station Today -->
      <button
        @click="emit('selectStation', summary.highestStation.id)"
        class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-neutral-950 dark:hover:bg-black border border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 transition text-left group"
      >
        <div class="flex items-center gap-2 min-w-0">
          <div class="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 shrink-0">
            <Flame class="w-3.5 h-3.5" />
          </div>
          <div class="min-w-0">
            <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-none">
              {{ t('national.worstStation') || 'Paling Terjejas' }}
            </div>
            <div class="font-bold text-slate-900 dark:text-white truncate text-xs mt-0.5 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
              {{ summary.highestStation.name }}
            </div>
            <div class="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
              {{ summary.highestStation.state }}
            </div>
          </div>
        </div>

        <div class="text-right shrink-0 pl-2">
          <span
            class="px-2 py-0.5 rounded-lg font-mono text-xs font-black inline-block shadow-sm"
            :style="{
              backgroundColor: `${highestColor}18`,
              color: highestColor,
              border: `1px solid ${highestColor}33`
            }"
          >
            {{ summary.highestStation.api }}
          </span>
        </div>
      </button>

      <!-- 2. Cleanest Station in Malaysia Today -->
      <button
        @click="emit('selectStation', summary.cleanestStation.id)"
        class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-neutral-950 dark:hover:bg-black border border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 transition text-left group"
      >
        <div class="flex items-center gap-2 min-w-0">
          <div class="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
            <Wind class="w-3.5 h-3.5" />
          </div>
          <div class="min-w-0">
            <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-none">
              {{ t('national.cleanestStation') || 'Udara Paling Bersih' }}
            </div>
            <div class="font-bold text-slate-900 dark:text-white truncate text-xs mt-0.5 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
              {{ summary.cleanestStation.name }}
            </div>
            <div class="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
              {{ summary.cleanestStation.state }}
            </div>
          </div>
        </div>

        <div class="text-right shrink-0 pl-2">
          <span
            class="px-2 py-0.5 rounded-lg font-mono text-xs font-black inline-block shadow-sm"
            :style="{
              backgroundColor: `${cleanestColor}18`,
              color: cleanestColor,
              border: `1px solid ${cleanestColor}33`
            }"
          >
            {{ summary.cleanestStation.api }}
          </span>
        </div>
      </button>

      <!-- 3. National School Alert Watch (API > 200) -->
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200/80 dark:border-white/5">
        <div class="flex items-center gap-2 min-w-0">
          <div
            :class="[
              'p-1.5 rounded-lg shrink-0',
              summary.schoolAlertCount > 0 
                ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/40 animate-pulse' 
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            ]"
          >
            <School class="w-3.5 h-3.5" />
          </div>
          <div class="min-w-0">
            <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono leading-none">
              {{ t('national.schoolRule') || 'Garis Panduan KPM' }}
            </div>
            <div class="font-bold text-xs mt-0.5 truncate" :class="summary.schoolAlertCount > 0 ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-400'">
              {{ summary.schoolAlertCount > 0 ? `${summary.schoolAlertCount} Stesen > 200!` : (t('national.schoolNormal') || 'Sekolah Normal') }}
            </div>
            <div class="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
              {{ summary.schoolAlertCount > 0 ? 'Tutup sekolah berhampiran' : 'Tiada stesen tutup sekolah' }}
            </div>
          </div>
        </div>

        <div class="text-right shrink-0 pl-1">
          <span
            class="w-2.5 h-2.5 rounded-full inline-block"
            :class="summary.schoolAlertCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'"
          />
        </div>
      </div>
    </div>
  </div>
</template>
