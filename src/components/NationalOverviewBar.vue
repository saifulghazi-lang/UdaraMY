<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Flame, Wind, School } from 'lucide-vue-next';
import { getCategoryColor } from '../data/stations.js';

const props = defineProps({
  summary: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['selectStation']);
const { t } = useI18n();

const highestColor = computed(() => {
  if (!props.summary?.highestStation) return '#f59e0b';
  return getCategoryColor(props.summary.highestStation.category);
});

const cleanestColor = computed(() => {
  if (!props.summary?.cleanestStation) return '#00d2ff';
  return getCategoryColor(props.summary.cleanestStation.category);
});
</script>

<template>
  <div v-if="summary?.highestStation" class="bg-white dark:bg-neutral-950 border border-slate-200/80 dark:border-white/10 rounded-2xl p-2.5 px-3.5 shadow-sm flex items-center justify-between gap-3 text-xs flex-wrap font-mono">
    <!-- National Average -->
    <div class="flex items-center gap-2">
      <span class="text-sm select-none">🇲🇾</span>
      <span class="text-slate-600 dark:text-slate-400 font-sans font-medium text-xs">{{ t('national.title') || 'Purata Kebangsaan' }}:</span>
      <span class="font-black text-slate-900 dark:text-white tabular-nums">{{ summary.nationalAverage }} API</span>
    </div>

    <div class="flex items-center gap-3 shrink-0 flex-wrap">
      <!-- Highest Station Link -->
      <button
        @click="emit('selectStation', summary.highestStation.id)"
        class="flex items-center gap-1.5 hover:opacity-80 transition group text-left"
        :title="summary.highestStation.name"
      >
        <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: highestColor }"></span>
        <span class="text-[11px] text-slate-500 font-sans">Tertinggi:</span>
        <span class="font-bold text-slate-900 dark:text-white group-hover:underline truncate max-w-[120px]">{{ summary.highestStation.name }}</span>
        <span class="font-black tabular-nums" :style="{ color: highestColor }">{{ summary.highestStation.api }}</span>
      </button>

      <span class="text-slate-300 dark:text-white/10 hidden sm:inline">•</span>

      <!-- Cleanest Station Link -->
      <button
        @click="emit('selectStation', summary.cleanestStation.id)"
        class="flex items-center gap-1.5 hover:opacity-80 transition group text-left hidden sm:flex"
        :title="summary.cleanestStation.name"
      >
        <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: cleanestColor }"></span>
        <span class="text-[11px] text-slate-500 font-sans">Terbersih:</span>
        <span class="font-bold text-slate-900 dark:text-white group-hover:underline truncate max-w-[120px]">{{ summary.cleanestStation.name }}</span>
        <span class="font-black tabular-nums" :style="{ color: cleanestColor }">{{ summary.cleanestStation.api }}</span>
      </button>

      <!-- School Alert Indicator -->
      <span
        v-if="summary.schoolAlertCount > 0"
        class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 animate-pulse font-bold"
      >
        <School class="w-3 h-3 text-rose-500" />
        <span>{{ summary.schoolAlertCount }} Sekolah Amaran</span>
      </span>
    </div>
  </div>
</template>
