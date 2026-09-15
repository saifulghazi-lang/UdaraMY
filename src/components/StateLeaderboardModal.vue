<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { 
  X, 
  Trophy, 
  Share2, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Copy, 
  MapPin, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown,
  Clock
} from 'lucide-vue-next';
import { getCategoryColor } from '../data/stations.js';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  stateRankings: {
    type: Array,
    required: true
  },
  nationalSummary: {
    type: Object,
    required: true
  },
  selectedStationId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'selectStation']);
const { t } = useI18n();

const sortBy = ref('peak'); // 'peak' | 'average' | 'name'
const regionFilter = ref('all'); // 'all' | 'peninsular' | 'borneo'
const expandedStates = ref({});
const copiedToast = ref(false);
const activeScrubHour = ref({}); // { [stateName]: { hour, avgApi, peakApi, timeLabel } }

function toggleExpand(stateName) {
  expandedStates.value[stateName] = !expandedStates.value[stateName];
}

const sortedRankings = computed(() => {
  let list = [...props.stateRankings];

  if (regionFilter.value === 'peninsular') {
    list = list.filter(s => s.region === 'Peninsular');
  } else if (regionFilter.value === 'borneo') {
    list = list.filter(s => s.region === 'Sabah' || s.region === 'Sarawak');
  }

  if (sortBy.value === 'average') {
    return list.sort((a, b) => b.averageApi - a.averageApi);
  } else if (sortBy.value === 'name') {
    return list.sort((a, b) => a.state.localeCompare(b.state));
  } else {
    // default: peak API descending
    return list.sort((a, b) => b.peakStation.api - a.peakStation.api);
  }
});

// Generate smooth SVG polyline for 24-hour diurnal sparkline
function generateSparklinePoints(hourlyList, width = 160, height = 36) {
  if (!hourlyList || hourlyList.length === 0) return '';
  const maxApi = 250;
  const step = width / (hourlyList.length - 1);

  return hourlyList.map((pt, idx) => {
    const x = Math.round(idx * step);
    const normalized = Math.max(0, Math.min(maxApi, pt.avgApi));
    const y = Math.round(height - (normalized / maxApi) * (height - 8) - 4);
    return `${x},${y}`;
  }).join(' ');
}

// Scrubber hover on state sparkline
function handleSparklineMove(e, stateItem, width = 160) {
  const rect = e.currentTarget.getBoundingClientRect();
  const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const idx = Math.round(relX * (stateItem.hourlyProgression24h.length - 1));
  activeScrubHour.value[stateItem.state] = stateItem.hourlyProgression24h[idx];
}

function handleSparklineLeave(stateName) {
  delete activeScrubHour.value[stateName];
}

// 1-Tap Copy WhatsApp Daily Report
function copyWhatsAppReport() {
  const dateStr = new Date().toLocaleDateString('ms-MY', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
  const timeStr = new Date().toLocaleTimeString('ms-MY', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  });

  const top3 = props.stateRankings.slice(0, 3).map((s, idx) => {
    return `${idx + 1}. *${s.state}* · Puncak: ${s.peakStation.api} (${s.peakStation.name}) [${s.peakCategory.toUpperCase()}]`;
  }).join('\n');

  const cleanest = props.nationalSummary.cleanestStation;
  const schoolStatus = props.nationalSummary.schoolAlertCount > 0 
    ? `⚠️ *AMARAN:* ${props.nationalSummary.schoolAlertCount} stesen melebihi API 200 (Awas penutupan sekolah KPM)` 
    : `✅ Semua sekolah dibuka normal (Tiada stesen > 200)`;

  const text = `🇲🇾 *LAPORAN KUALITI UDARA HARIAN MALAYSIA*
📅 ${dateStr} (${timeStr})
Sumber: Jabatan Alam Sekitar (JAS APIMS) via UdaraMY

🚨 *Negeri Paling Terjejas Hari Ini:*
${top3}

🍃 *Udara Paling Bersih:*
• *${cleanest?.state}* (${cleanest?.name} · API ${cleanest?.api})

🏫 *Status Sekolah:*
• ${schoolStatus}

📊 *Purata Kebangsaan:* ${props.nationalSummary.nationalAverage} API

👉 Semak bacaan stesen & jerebu kawasan anda:
https://udaramy.vercel.app`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      copiedToast.value = true;
      setTimeout(() => { copiedToast.value = false; }, 2500);
    });
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-black/85 backdrop-blur-md transition-opacity"
  >
    <div class="w-full max-w-2xl bg-black border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Modal Header -->
      <div class="p-4 sm:p-5 border-b border-white/10 flex items-start justify-between gap-3 bg-black">
        <div>
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Trophy class="w-4 h-4" />
            </div>
            <h3 class="font-extrabold text-white text-base tracking-tight">
              {{ t('leaderboard.title') || 'Papan Kedudukan Kualiti Udara Negeri' }}
            </h3>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            {{ t('leaderboard.subtitle') || 'Kedudukan 16 negeri & wilayah berdasarkan bacaan stesen hari ini' }}
          </p>
        </div>

        <button
          @click="emit('close')"
          class="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900 border border-white/5 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Action & Filter Bar -->
      <div class="px-4 py-3 bg-neutral-950/60 border-b border-white/10 flex flex-wrap items-center justify-between gap-2.5">
        <!-- 1-Tap WhatsApp Exporter Button -->
        <button
          @click="copyWhatsAppReport"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition shadow-sm active:scale-95 border',
            copiedToast
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          ]"
          :title="t('leaderboard.copyWhatsApp')"
        >
          <component :is="copiedToast ? Check : Copy" class="w-3.5 h-3.5" />
          <span>{{ copiedToast ? (t('leaderboard.copied') || 'Disalin ke WhatsApp!') : (t('leaderboard.copyWhatsApp') || 'Salin Laporan WhatsApp') }}</span>
        </button>

        <!-- Sort Mode Switcher -->
        <div class="flex items-center gap-1 bg-black border border-white/10 rounded-xl p-0.5 text-xs font-mono">
          <button
            @click="sortBy = 'peak'"
            :class="['px-2.5 py-1 rounded-lg transition text-[11px]', sortBy === 'peak' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white']"
          >
            🔥 {{ t('leaderboard.sortPeak') || 'Puncak' }}
          </button>
          <button
            @click="sortBy = 'average'"
            :class="['px-2.5 py-1 rounded-lg transition text-[11px]', sortBy === 'average' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white']"
          >
            📊 {{ t('leaderboard.sortAverage') || 'Purata' }}
          </button>
          <button
            @click="sortBy = 'name'"
            :class="['px-2.5 py-1 rounded-lg transition text-[11px]', sortBy === 'name' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white']"
          >
            {{ t('leaderboard.sortName') || 'A-Z' }}
          </button>
        </div>
      </div>

      <!-- Scrollable State Leaderboard List -->
      <div class="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 custom-scrollbar">
        <div
          v-for="(st, index) in sortedRankings"
          :key="st.state"
          class="rounded-2xl bg-neutral-950 border border-white/10 overflow-hidden transition"
        >
          <!-- State Summary Header Row -->
          <div 
            @click="toggleExpand(st.state)"
            class="p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-neutral-900 transition select-none"
          >
            <!-- Left: Rank + State Name + Peak Info -->
            <div class="flex items-center gap-3 min-w-0">
              <!-- Rank Badge -->
              <span
                :class="[
                  'w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0',
                  index === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' :
                  index === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30' :
                  index === 2 ? 'bg-amber-700/20 text-amber-400 border border-amber-700/30' :
                  'bg-black text-slate-400 border border-white/10'
                ]"
              >
                #{{ index + 1 }}
              </span>

              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="font-extrabold text-white text-sm tracking-tight truncate">
                    {{ st.state }}
                  </h4>
                  <span class="text-[9px] px-1.5 py-0.2 rounded-full bg-black border border-white/10 text-slate-400 font-mono">
                    {{ st.stationCount }} stesen
                  </span>
                </div>

                <div class="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1.5 font-mono">
                  <span>{{ t('leaderboard.peak') || 'Puncak' }}: <strong class="text-slate-200">{{ st.peakStation.name }}</strong></span>
                  <span class="text-slate-600">•</span>
                  <span :style="{ color: getCategoryColor(st.peakCategory) }">{{ st.peakStation.api }} API</span>
                </div>
              </div>
            </div>

            <!-- Middle: 24h Diurnal Mini Sparkline (AM to PM) -->
            <div 
              class="hidden sm:flex flex-col items-end shrink-0 cursor-crosshair pr-2"
              @mousemove="(e) => handleSparklineMove(e, st)"
              @mouseleave="() => handleSparklineLeave(st.state)"
            >
              <div class="text-[9px] text-slate-500 font-mono mb-1">
                {{ activeScrubHour[st.state] ? `${activeScrubHour[st.state].timeLabel}: ${activeScrubHour[st.state].avgApi} API` : (t('leaderboard.trend24h') || 'Trend 24j (AM→PM)') }}
              </div>
              <svg width="120" height="28" class="overflow-visible">
                <polyline
                  fill="none"
                  :stroke="getCategoryColor(st.category)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :points="generateSparklinePoints(st.hourlyProgression24h, 120, 28)"
                />
              </svg>
            </div>

            <!-- Right: State Average API Pill & Expand Chevron -->
            <div class="flex items-center gap-2 shrink-0">
              <div class="text-right">
                <span
                  class="px-2.5 py-1 rounded-xl font-mono text-xs font-black inline-block"
                  :style="{
                    backgroundColor: `${getCategoryColor(st.category)}22`,
                    color: getCategoryColor(st.category),
                    border: `1px solid ${getCategoryColor(st.category)}44`
                  }"
                >
                  {{ st.averageApi }}
                </span>
                <div class="text-[9px] text-slate-500 font-mono mt-0.5 uppercase">
                  {{ t('leaderboard.average') || 'Purata' }}
                </div>
              </div>

              <component 
                :is="expandedStates[st.state] ? ChevronUp : ChevronDown" 
                class="w-4 h-4 text-slate-500" 
              />
            </div>
          </div>

          <!-- Expanded Accordion: List of all stations in this state -->
          <div 
            v-if="expandedStates[st.state]"
            class="p-3 bg-black border-t border-white/5 space-y-1.5"
          >
            <div class="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>{{ t('leaderboard.stationsIn', { state: st.state }) || `Stesen Pemantauan di ${st.state}` }}</span>
              <span>{{ t('leaderboard.selectToMonitor') || 'Pilih untuk pantau' }}</span>
            </div>

            <div
              v-for="subStation in st.stations"
              :key="subStation.id"
              @click="() => { emit('selectStation', subStation.id); emit('close'); }"
              :class="[
                'p-2 rounded-xl flex items-center justify-between cursor-pointer border transition text-xs',
                subStation.id === selectedStationId
                  ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-sm'
                  : 'bg-neutral-950/70 border-white/5 hover:bg-neutral-900 text-slate-300 hover:text-white'
              ]"
            >
              <div class="flex items-center gap-2 min-w-0">
                <MapPin class="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span class="font-bold truncate">{{ subStation.name }}</span>
                <span v-if="subStation.id === selectedStationId" class="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-bold shrink-0">
                  {{ t('leaderboard.active') || 'Aktif' }}
                </span>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span class="text-[11px] capitalize text-slate-400 hidden sm:inline">
                  {{ subStation.category }}
                </span>
                <span
                  class="px-2 py-0.5 rounded-lg font-mono text-xs font-black"
                  :style="{
                    backgroundColor: `${getCategoryColor(subStation.category)}22`,
                    color: getCategoryColor(subStation.category),
                    border: `1px solid ${getCategoryColor(subStation.category)}44`
                  }"
                >
                  {{ subStation.api }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
