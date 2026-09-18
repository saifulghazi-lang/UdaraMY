<script setup>
import { useI18n } from 'vue-i18n';
import { Star, X, Pin } from 'lucide-vue-next';
import { getCategoryColor } from '../data/stations.js';

const props = defineProps({
  watchlistStations: {
    type: Array,
    required: true
  },
  selectedStationId: {
    type: String,
    required: true
  },
  isCurrentInWatchlist: {
    type: Boolean,
    default: false
  },
  stations: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits([
  'selectStation', 
  'toggleCurrentWatchlist', 
  'removeStation'
]);
const { t } = useI18n();
</script>

<template>
  <div v-if="watchlistStations.length > 0 || isCurrentInWatchlist" class="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar text-xs font-mono">
    <!-- Quick Pin/Unpin Current Station Toggle -->
    <button
      @click="emit('toggleCurrentWatchlist')"
      :class="[
        'shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition active:scale-95 shadow-sm font-sans font-medium',
        isCurrentInWatchlist
          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
          : 'bg-white dark:bg-neutral-950 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:border-slate-300'
      ]"
      :title="isCurrentInWatchlist ? 'Unpin from quick access' : 'Pin current station'"
    >
      <Pin class="w-3 h-3" :class="{ 'rotate-45 text-amber-500': isCurrentInWatchlist }" />
      <span>{{ isCurrentInWatchlist ? t('watchlist.pinned') : t('watchlist.addCurrent') }}</span>
    </button>

    <!-- Horizontal Saved Station Capsules -->
    <button
      v-for="item in watchlistStations"
      :key="item.id"
      @click="emit('selectStation', item.id)"
      :class="[
        'shrink-0 flex items-center gap-2 px-3 py-1 rounded-full border transition text-xs group shadow-sm font-sans',
        item.id === selectedStationId
          ? 'bg-indigo-50 border-indigo-500 text-indigo-950 dark:bg-black dark:border-indigo-500 dark:text-white ring-1 ring-indigo-500/50'
          : 'bg-white dark:bg-neutral-950 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300'
      ]"
    >
      <span class="text-xs select-none">{{ item.icon || '📍' }}</span>
      <span class="font-semibold truncate max-w-[100px]">{{ item.station?.name || item.label }}</span>

      <!-- API Pill -->
      <span
        class="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black tabular-nums"
        :style="{
          backgroundColor: `${getCategoryColor(item.category)}18`,
          color: getCategoryColor(item.category),
          border: `1px solid ${getCategoryColor(item.category)}33`
        }"
      >
        {{ item.api }}
      </span>

      <!-- Quick Remove X -->
      <span
        @click.stop="emit('removeStation', item.id)"
        class="opacity-30 hover:opacity-100 hover:text-red-500 text-slate-400 transition"
        title="Remove"
      >
        <X class="w-3 h-3" />
      </span>
    </button>
  </div>
</template>
