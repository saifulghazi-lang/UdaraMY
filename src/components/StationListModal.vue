<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { Search, X, MapPin, Flame } from 'lucide-vue-next';
import { getCategoryColor } from '../data/stations.js';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  stations: {
    type: Array,
    required: true
  },
  selectedStationId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'selectStation']);
const { t } = useI18n();

const query = ref('');
const searchInputRef = ref(null);

const filteredStations = computed(() => {
  const q = query.value.toLowerCase().trim();
  if (!q) return props.stations;
  return props.stations.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.state.toLowerCase().includes(q)
  );
});

const topHazeStations = computed(() => {
  return [...props.stations].sort((a, b) => b.api - a.api).slice(0, 3);
});

function selectAndClose(id) {
  emit('selectStation', id);
  emit('close');
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    emit('close');
  }
}

watch(() => props.isOpen, (open) => {
  if (open) {
    window.addEventListener('keydown', handleKeydown);
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  } else {
    window.removeEventListener('keydown', handleKeydown);
    query.value = '';
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div
    v-if="isOpen"
    @click.self="emit('close')"
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-black/80 backdrop-blur-sm transition-opacity"
  >
    <div class="w-full max-w-lg bg-black border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
      <!-- Modal Header -->
      <div class="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 class="font-bold text-white flex items-center gap-2 text-sm">
          <MapPin class="w-4 h-4 text-indigo-400" />
          <span>{{ t('app.viewAllStations') }} ({{ stations.length }})</span>
        </h3>
        <button
          @click="emit('close')"
          class="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
          aria-label="Tutup / Close"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Search Input -->
      <div class="p-4 border-b border-white/10 bg-neutral-950">
        <div class="relative flex items-center">
          <Search class="w-4 h-4 text-neutral-500 absolute left-3 pointer-events-none" />
          <input
            ref="searchInputRef"
            v-model="query"
            type="text"
            :placeholder="t('app.searchStation')"
            class="w-full bg-black border border-white/10 rounded-2xl py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <!-- Top Affected Hotspots -->
        <div v-if="!query" class="mt-3">
          <div class="flex items-center gap-1 text-[11px] font-bold text-amber-400 mb-1.5 uppercase tracking-wide">
            <Flame class="w-3.5 h-3.5" />
            <span>Top Haze Watch</span>
          </div>
          <div class="flex gap-1.5 overflow-x-auto pb-1">
            <button
              v-for="st in topHazeStations"
              :key="st.id"
              @click="selectAndClose(st.id)"
              class="shrink-0 flex items-center gap-2 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition"
            >
              <span>{{ st.name }}</span>
              <span class="font-mono font-bold">{{ st.api }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Station List -->
      <div class="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        <button
          v-for="st in filteredStations"
          :key="st.id"
          @click="selectAndClose(st.id)"
          :class="[
            'w-full text-left p-3 rounded-2xl border transition flex items-center justify-between',
            st.id === selectedStationId
              ? 'bg-indigo-950/60 border-indigo-500/60 ring-1 ring-indigo-500/50'
              : 'bg-neutral-950 border border-white/10 hover:bg-neutral-900 hover:border-white/20'
          ]"
        >
          <div>
            <div class="font-bold text-white text-xs flex items-center gap-1.5">
              <span>{{ st.name }}</span>
              <span v-if="st.id === selectedStationId" class="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-normal">Active</span>
            </div>
            <div class="text-[10px] text-neutral-400 mt-0.5">{{ st.state }} • {{ st.region }}</div>
          </div>

          <div class="flex items-center gap-2">
            <span
              class="px-2.5 py-1 rounded-xl font-mono text-xs font-black"
              :style="{
                backgroundColor: `${getCategoryColor(st.category)}20`,
                color: getCategoryColor(st.category)
              }"
            >
              {{ st.api }}
            </span>
          </div>
        </button>

        <div v-if="filteredStations.length === 0" class="py-12 text-center text-neutral-500 text-xs">
          No stations found matching "{{ query }}"
        </div>
      </div>
    </div>
  </div>
</template>
