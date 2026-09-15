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
      <div class="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <Star class="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
        <span>{{ t('watchlist.title') }}</span>
      </div>

      <div class="flex items-center gap-1.5">
        <!-- Edit / Manage Watchlist Button -->
        <button
          @click="showEditModal = true"
          class="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border bg-black border-white/10 text-slate-300 hover:text-white hover:border-white/25 transition active:scale-95"
          :title="t('watchlist.manage')"
        >
          <Edit3 class="w-3 h-3 text-indigo-400" />
          <span>{{ t('watchlist.manage') }}</span>
        </button>

        <!-- Quick Pin/Unpin Current Station -->
        <button
          @click="emit('toggleCurrentWatchlist')"
          :class="[
            'flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition active:scale-95',
            isCurrentInWatchlist
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-black border-white/10 text-slate-400 hover:text-white hover:border-white/25'
          ]"
        >
          <Pin class="w-3 h-3" :class="{ 'rotate-45 text-amber-400': isCurrentInWatchlist }" />
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
          'shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition text-xs font-semibold group',
          item.id === selectedStationId
            ? 'bg-black border-indigo-500 text-white shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/50'
            : 'bg-black border-white/10 text-slate-300 hover:bg-neutral-950 hover:border-white/20'
        ]"
      >
        <span class="text-sm select-none">{{ item.icon || '📍' }}</span>
        <div class="text-left">
          <div class="text-[11px] font-bold leading-tight">{{ item.label }}</div>
          <div class="text-[9px] text-slate-400 font-normal leading-tight truncate max-w-[90px]">
            {{ item.station?.name || item.id }}
          </div>
        </div>

        <!-- API Pill -->
        <span
          class="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black"
          :style="{
            backgroundColor: `${getCategoryColor(item.category)}22`,
            color: getCategoryColor(item.category)
          }"
        >
          {{ item.api }}
        </span>

        <!-- Remove X button -->
        <span
          @click.stop="emit('removeStation', item.id)"
          class="opacity-0 group-hover:opacity-80 hover:opacity-100 hover:text-red-400 text-slate-500 ml-0.5 transition"
          title="Remove from watchlist"
        >
          <X class="w-3 h-3" />
        </span>
      </button>

      <!-- Add New Location Pill -->
      <button
        @click="showEditModal = true"
        class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-dashed border-white/15 hover:border-indigo-500 text-slate-400 hover:text-indigo-300 text-xs font-semibold transition bg-black hover:bg-indigo-950/20 active:scale-95"
        :title="t('watchlist.addNew')"
      >
        <Plus class="w-3.5 h-3.5 text-indigo-400" />
        <span>{{ t('watchlist.add') }}</span>
      </button>

      <div v-if="watchlistStations.length === 0" class="text-[11px] text-slate-500 italic py-1 px-2">
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
