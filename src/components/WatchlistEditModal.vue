<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { X, Plus, Trash2, Edit3, Check, Search, MapPin, Star } from 'lucide-vue-next';
import { getCategoryColor } from '../data/stations.js';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  watchlist: {
    type: Array,
    required: true
  },
  stations: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['close', 'updateItem', 'addItem', 'removeItem']);
const { t } = useI18n();

const PRESET_ICONS = ['🏠', '🏢', '🏫', '👵', '👶', '🏡', '🎒', '🏖️', '🏥', '📍', '🚲', '🌳'];

// Editing or Adding state
const isFormOpen = ref(false);
const editingOldId = ref(null);
const formLabel = ref('');
const formIcon = ref('🏠');
const formStationId = ref('');
const stationSearch = ref('');

const filteredStations = computed(() => {
  const q = stationSearch.value.toLowerCase().trim();
  if (!q) return props.stations;
  return props.stations.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.state.toLowerCase().includes(q)
  );
});

const selectedStationObj = computed(() => {
  return props.stations.find(s => s.id === formStationId.value);
});

function openAddForm() {
  editingOldId.value = null;
  formLabel.value = '';
  formIcon.value = '🏠';
  formStationId.value = props.stations[0]?.id || '';
  stationSearch.value = '';
  isFormOpen.value = true;
}

function openEditForm(item) {
  editingOldId.value = item.id;
  formLabel.value = item.label;
  formIcon.value = item.icon || '📍';
  formStationId.value = item.id;
  stationSearch.value = '';
  isFormOpen.value = true;
}

function closeForm() {
  isFormOpen.value = false;
  editingOldId.value = null;
}

function submitForm() {
  if (!formStationId.value) return;

  const finalLabel = formLabel.value.trim() || selectedStationObj.value?.name || 'Saved';
  const payload = {
    id: formStationId.value,
    label: finalLabel,
    icon: formIcon.value || '📍'
  };

  if (editingOldId.value) {
    emit('updateItem', editingOldId.value, payload);
  } else {
    emit('addItem', payload);
  }

  closeForm();
}

function deleteItem(id) {
  emit('removeItem', id);
  if (editingOldId.value === id) {
    closeForm();
  }
}

// Reset form when modal closes
watch(() => props.isOpen, (newVal) => {
  if (!newVal) {
    closeForm();
  }
});
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-black/85 backdrop-blur-md transition-opacity"
  >
    <div class="w-full max-w-md bg-black border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
      <!-- Header -->
      <div class="p-4 border-b border-white/10 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-sm">
            ⭐
          </div>
          <div>
            <h3 class="font-bold text-slate-100 text-sm">
              {{ t('watchlist.title') }}
            </h3>
            <p class="text-[10px] text-slate-400">
              {{ isFormOpen ? (editingOldId ? t('watchlist.editLocation') : t('watchlist.addNew')) : `${watchlist.length} lokasi disemat` }}
            </p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <!-- FORM MODE: Add or Edit Location -->
        <div v-if="isFormOpen" class="space-y-4">
          <!-- 1. Icon Selection -->
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              {{ t('watchlist.chooseIcon') }}
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="emoji in PRESET_ICONS"
                :key="emoji"
                type="button"
                @click="formIcon = emoji"
                :class="[
                  'w-9 h-9 rounded-xl text-base flex items-center justify-center border transition',
                  formIcon === emoji
                    ? 'bg-indigo-600 border-indigo-400 shadow-md shadow-indigo-600/40 scale-105'
                    : 'bg-black border-white/10 hover:border-white/20 text-slate-200'
                ]"
              >
                {{ emoji }}
              </button>
            </div>
          </div>

          <!-- 2. Custom Label Input -->
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              {{ t('watchlist.locationName') }}
            </label>
            <input
              v-model="formLabel"
              type="text"
              :placeholder="t('watchlist.customLabel')"
              class="w-full bg-black border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              maxlength="24"
            />
          </div>

          <!-- 3. Monitoring Station Selection -->
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              {{ t('watchlist.chooseStation') }}
            </label>

            <!-- Search within stations -->
            <div class="relative mb-2">
              <Search class="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                v-stationSearch="stationSearch"
                v-model="stationSearch"
                type="text"
                :placeholder="t('watchlist.searchStationPlaceholder')"
                class="w-full bg-black border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <!-- Station List Choices -->
            <div class="max-h-44 overflow-y-auto space-y-1 custom-scrollbar border border-white/10 rounded-2xl p-1 bg-black">
              <button
                v-for="st in filteredStations"
                :key="st.id"
                type="button"
                @click="formStationId = st.id"
                :class="[
                  'w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition',
                  formStationId === st.id
                    ? 'bg-indigo-600/30 border border-indigo-500/60 text-white'
                    : 'hover:bg-neutral-950 text-slate-300'
                ]"
              >
                <div class="truncate pr-2">
                  <span class="font-bold">{{ st.name }}</span>
                  <span class="text-[10px] text-slate-400 ml-1.5">({{ st.state }})</span>
                </div>
                <span
                  class="shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                  :style="{
                    backgroundColor: `${getCategoryColor(st.category)}22`,
                    color: getCategoryColor(st.category)
                  }"
                >
                  API {{ st.api }}
                </span>
              </button>

              <div v-if="filteredStations.length === 0" class="p-3 text-center text-slate-500 text-xs">
                No stations found
              </div>
            </div>
          </div>

          <!-- Actions: Save or Cancel -->
          <div class="flex items-center gap-2 pt-2">
            <button
              type="button"
              @click="closeForm"
              class="flex-1 py-2 rounded-xl bg-neutral-950 hover:bg-black text-slate-300 text-xs font-semibold transition border border-white/10"
            >
              {{ t('watchlist.cancel') }}
            </button>
            <button
              type="button"
              @click="submitForm"
              :disabled="!formStationId"
              class="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
            >
              <Check class="w-4 h-4" />
              <span>{{ t('watchlist.saveChanges') }}</span>
            </button>
          </div>
        </div>

        <!-- LIST MODE: Overview of all watchlist entries -->
        <div v-else class="space-y-3">
          <div class="space-y-2">
            <div
              v-for="item in watchlist"
              :key="item.id"
              class="bg-black border border-white/10 rounded-2xl p-3 flex items-center justify-between group hover:border-white/20 transition"
            >
              <div class="flex items-center gap-2.5 min-w-0 pr-2">
                <span class="text-xl select-none shrink-0 p-1.5 bg-neutral-950 rounded-xl border border-white/10">
                  {{ item.icon || '📍' }}
                </span>
                <div class="min-w-0">
                  <div class="font-bold text-slate-100 text-xs truncate flex items-center gap-1.5">
                    <span>{{ item.label }}</span>
                  </div>
                  <div class="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <MapPin class="w-3 h-3 text-slate-500 shrink-0" />
                    <span class="truncate">{{ item.station?.name || item.id }} ({{ item.station?.state || '' }})</span>
                  </div>
                </div>
              </div>

              <!-- Right: API Badge + Action Buttons -->
              <div class="flex items-center gap-1.5 shrink-0">
                <span
                  class="font-mono text-xs font-bold px-2 py-0.5 rounded-lg mr-1"
                  :style="{
                    backgroundColor: `${getCategoryColor(item.category)}22`,
                    color: getCategoryColor(item.category)
                  }"
                >
                  {{ item.api }}
                </span>

                <!-- Edit Button -->
                <button
                  @click="openEditForm(item)"
                  class="p-1.5 rounded-lg bg-neutral-950 hover:bg-indigo-600 text-white/70 hover:text-white transition border border-white/10"
                  title="Edit"
                >
                  <Edit3 class="w-3.5 h-3.5" />
                </button>

                <!-- Delete Button -->
                <button
                  @click="deleteItem(item.id)"
                  class="p-1.5 rounded-lg bg-neutral-950 hover:bg-red-600 text-white/70 hover:text-white transition border border-white/10"
                  title="Remove"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div v-if="watchlist.length === 0" class="py-8 text-center text-slate-500 text-xs">
              {{ t('watchlist.empty') }}
            </div>
          </div>

          <!-- Add New Location Button -->
          <button
            @click="openAddForm"
            class="w-full py-2.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Plus class="w-4 h-4" />
            <span>{{ t('watchlist.addNew') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
