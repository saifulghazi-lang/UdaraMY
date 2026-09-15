<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Star, Plus, X, Pin, Edit3 } from 'lucide-vue-next';
import { getCategoryColor } from '../data/stations.js';
import WatchlistEditModal from './WatchlistEditModal.vue';

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
  'removeStation',
  'updateItem',
  'addItem'
]);
const { t } = useI18n();

const showEditModal = ref(false);
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex items-center justify-between px-1">
      <div class="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
        <Star class="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
        <span>{{ t('watchlist.title') }}</span>
      </div>

      <div class="flex items-center gap-1.5">
        <!-- Edit / Manage Watchlist Button -->
        <button
          @click="showEditModal = true"
          class="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border bg-slate-100 dark:bg-black border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/25 transition active:scale-95 shadow-sm"
          :title="t('watchlist.manage')"
        >
          <Edit3 class="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
          <span>{{ t('watchlist.manage') }}</span>
        </button>

        <!-- Quick Pin/Unpin Current Station -->
        <button
          @click="emit('toggleCurrentWatchlist')"
          :class="[
            'flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border transition active:scale-95 shadow-sm',
            isCurrentInWatchlist
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
              : 'bg-slate-100 dark:bg-black border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/25'
          ]"
        >
          <Pin class="w-3 h-3" :class="{ 'rotate-45 text-amber-500 dark:text-amber-400': isCurrentInWatchlist }" />
          <span>{{ isCurrentInWatchlist ? t('watchlist.pinned') : t('watchlist.addCurrent') }}</span>
        </button>
      </div>
    </div>

    <!-- Horizontal Scrollable Watchlist Pills -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
      <button
        v-for="item in watchlistStations"
        :key="item.id"
        @click="emit('selectStation', item.id)"
        :class="[
          'shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border transition text-xs font-semibold group shadow-sm',
          item.id === selectedStationId
            ? 'bg-indigo-50 border-indigo-500 text-indigo-900 dark:bg-black dark:border-indigo-500 dark:text-white ring-1 ring-indigo-500/50'
            : 'bg-white dark:bg-black border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-950 hover:border-slate-300 dark:hover:border-white/20'
        ]"
      >
        <span class="text-sm select-none">{{ item.icon || '📍' }}</span>
        <div class="text-left">
          <div class="text-xs font-bold leading-tight">{{ item.label }}</div>
          <div class="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-tight truncate max-w-[90px]">
            {{ item.station?.name || item.id }}
          </div>
        </div>

        <!-- API Pill -->
        <span
          class="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-black"
          :style="{
            backgroundColor: `${getCategoryColor(item.category)}22`,
            color: getCategoryColor(item.category),
            border: `1px solid ${getCategoryColor(item.category)}33`
          }"
        >
          {{ item.api }}
        </span>

        <!-- Remove X button with mobile touch support -->
        <span
          @click.stop="emit('removeStation', item.id)"
          class="p-0.5 rounded-full opacity-40 hover:opacity-100 hover:text-red-500 text-slate-400 ml-0.5 transition"
          title="Remove from watchlist"
        >
          <X class="w-3 h-3" />
        </span>
      </button>

      <!-- Add New Location Pill -->
      <button
        @click="showEditModal = true"
        class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-400 text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 text-xs font-semibold transition bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 active:scale-95 shadow-sm"
        :title="t('watchlist.addNew')"
      >
        <Plus class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>{{ t('watchlist.add') }}</span>
      </button>

      <div v-if="watchlistStations.length === 0" class="text-xs text-slate-500 italic py-1 px-2">
        {{ t('watchlist.empty') }}
      </div>
    </div>

    <!-- Edit / Add Modal -->
    <WatchlistEditModal
      :is-open="showEditModal"
      :watchlist="watchlistStations"
      :stations="stations"
      @close="showEditModal = false"
      @update-item="(oldId, data) => emit('updateItem', oldId, data)"
      @add-item="(data) => emit('addItem', data)"
      @remove-item="(id) => emit('removeStation', id)"
    />
  </div>
</template>
