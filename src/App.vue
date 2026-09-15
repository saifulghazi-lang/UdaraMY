<script setup>
import { onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAirQualityStore } from './stores/airQuality.js';
import { Home, Map, Sliders, MapPin, WifiOff, Globe, LocateFixed, Share2, RefreshCw } from 'lucide-vue-next';

import AtmosphericCard from './components/AtmosphericCard.vue';
import HealthAdvicePanel from './components/HealthAdvicePanel.vue';
import TrendChart from './components/TrendChart.vue';
import PollutantBars from './components/PollutantBars.vue';
import StationMapView from './components/StationMapView.vue';
import StationListModal from './components/StationListModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import WatchlistBar from './components/WatchlistBar.vue';
import ShareCardModal from './components/ShareCardModal.vue';
import HazeHotspotWidget from './components/HazeHotspotWidget.vue';
import HazeCalendarGrid from './components/HazeCalendarGrid.vue';

const store = useAirQualityStore();
const { t, locale } = useI18n();

const currentTab = ref('dashboard');
const isStationModalOpen = ref(false);
const isSettingsModalOpen = ref(false);
const isShareModalOpen = ref(false);

function toggleLang() {
  const next = locale.value === 'en' ? 'bm' : 'en';
  locale.value = next;
  localStorage.setItem('udaramy_lang', next);
}

function handleStationSelect(id) {
  store.selectStation(id);
  currentTab.value = 'dashboard';
  isStationModalOpen.value = false;
}

const formattedLastUpdated = computed(() => {
  if (!store.lastUpdated) return t('app.live');
  const d = new Date(store.lastUpdated);
  if (isNaN(d.getTime())) return t('app.live');
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
});

onMounted(() => {
  store.init();
});
</script>

<template>
  <div class="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
    <!-- Top Header -->
    <header class="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <img
          src="/favicon.svg"
          alt="UdaraMY Logo"
          class="w-8 h-8 rounded-xl shadow-lg shadow-cyan-500/20 shrink-0 select-none object-contain border border-white/10"
        />
        <div>
          <h1 class="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
            <span>{{ t('app.title') }}</span>
            <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">MY</span>
          </h1>
          <p class="text-[10px] text-slate-400 -mt-0.5">{{ t('app.subtitle') }}</p>
        </div>
      </div>

      <!-- Desktop Navigation Links -->
      <nav class="hidden md:flex items-center gap-1.5 bg-black border border-white/10 rounded-2xl p-1 text-xs">
        <button
          @click="currentTab = 'dashboard'"
          :class="[
            'flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-semibold transition-all',
            currentTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-neutral-900'
          ]"
        >
          <Home class="w-4 h-4" />
          <span>{{ t('nav.home') }}</span>
        </button>
        <button
          @click="currentTab = 'map'"
          :class="[
            'flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-semibold transition-all',
            currentTab === 'map' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-neutral-900'
          ]"
        >
          <Map class="w-4 h-4" />
          <span>{{ t('nav.map') }}</span>
        </button>
      </nav>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <!-- Station Quick Trigger (Opens Station Picker Modal) -->
        <button
          @click="isStationModalOpen = true"
          class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black border border-white/10 text-xs font-medium text-slate-300 hover:text-white hover:border-white/25 hover:bg-neutral-950 transition"
        >
          <MapPin class="w-3.5 h-3.5 text-indigo-400" />
          <span>{{ store.currentStation?.name || t('app.changeStation') }}</span>
          <span
            v-if="store.distanceToCurrentStation !== null"
            class="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono"
          >
            {{ store.distanceToCurrentStation }} km
          </span>
        </button>

        <!-- Share Story Trigger in Top Bar -->
        <button
          v-if="store.currentStation"
          @click="isShareModalOpen = true"
          class="p-2 rounded-xl bg-black border border-white/10 text-slate-400 hover:text-white hover:border-white/25 hover:bg-neutral-950 transition focus:outline-none"
          :title="t('share.button')"
        >
          <Share2 class="w-4 h-4 text-indigo-400" />
        </button>

        <!-- GPS Locate Button in Top Bar -->
        <button
          @click="store.detectUserLocation(true)"
          :disabled="store.isLocating"
          class="p-2 rounded-xl bg-black border border-white/10 text-slate-400 hover:text-white hover:border-white/25 hover:bg-neutral-950 transition focus:outline-none"
          :title="store.isLocating ? t('location.locating') : t('location.locateMe')"
        >
          <LocateFixed :class="['w-4 h-4 text-cyan-400', store.isLocating ? 'animate-spin text-amber-300' : '']" />
        </button>

        <!-- Dedicated Location & Data Refresh Button -->
        <button
          @click="store.refreshData(true)"
          :disabled="store.isRefreshing"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black border border-white/10 text-slate-300 hover:text-white hover:border-white/25 hover:bg-neutral-950 transition focus:outline-none active:scale-95 shadow-sm"
          :title="store.isRefreshing ? t('app.refreshing') : t('app.refresh')"
        >
          <RefreshCw :class="['w-3.5 h-3.5 text-cyan-400', store.isRefreshing ? 'animate-spin' : '']" />
          <span class="hidden md:inline text-[11px] font-mono text-slate-400">
            {{ formattedLastUpdated }}
          </span>
        </button>

        <!-- Bilingual Switcher Button -->
        <button
          @click="toggleLang"
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:border-white/25 hover:bg-neutral-950 transition"
          :title="locale === 'en' ? 'Tukar ke Bahasa Melayu' : 'Switch to English'"
        >
          <Globe class="w-3.5 h-3.5 text-indigo-400" />
          <span class="uppercase">{{ locale }}</span>
        </button>

        <!-- Settings Gear -->
        <button
          @click="isSettingsModalOpen = true"
          class="p-2 rounded-xl bg-black border border-white/10 text-slate-400 hover:text-white hover:border-white/25 hover:bg-neutral-950 transition"
        >
          <Sliders class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Offline Alert Strip -->
    <div
      v-if="store.isOffline"
      class="bg-amber-950/80 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-xs flex items-center justify-center gap-2"
    >
      <WifiOff class="w-4 h-4" />
      <span>{{ t('app.offlineNotice') }}</span>
    </div>

    <!-- Main Content Body -->
    <main
      :class="[
        'flex-1 w-full mx-auto p-3 sm:p-6 space-y-5 transition-all duration-300 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-12',
        currentTab === 'map' ? 'max-w-7xl' : 'max-w-5xl'
      ]"
    >
      <!-- Loading skeleton -->
      <div v-if="store.isLoading" class="space-y-4 animate-pulse">
        <div class="h-64 bg-neutral-950 border border-white/5 rounded-3xl"></div>
        <div class="grid grid-cols-2 gap-3">
          <div class="h-24 bg-neutral-950 border border-white/5 rounded-2xl"></div>
          <div class="h-24 bg-neutral-950 border border-white/5 rounded-2xl"></div>
        </div>
      </div>

      <!-- Dashboard View -->
      <template v-else-if="currentTab === 'dashboard' && store.currentStation">
        <!-- Watchlist Quick Bar -->
        <WatchlistBar
          :watchlist-stations="store.watchlistStations"
          :selected-station-id="store.selectedStationId"
          :is-current-in-watchlist="store.isCurrentStationInWatchlist"
          :stations="store.stations"
          @select-station="(id) => store.selectStation(id)"
          @toggle-current-watchlist="() => store.toggleWatchlist(store.selectedStationId)"
          @remove-station="(id) => store.removeFromWatchlist(id)"
          @update-item="(oldId, data) => store.updateWatchlistItem(oldId, data)"
          @add-item="(data) => store.addToWatchlist(data)"
        />

        <!-- Core Dashboard Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <!-- Left Column: Atmospheric Card & Health Advice -->
          <div class="lg:col-span-6 space-y-5">
            <AtmosphericCard
              :station="store.currentStation"
              :last-updated="store.lastUpdated"
              :is-live="store.isLive"
              :distance-km="store.distanceToCurrentStation"
              :is-nearest="store.isNearestStationActive"
              :is-locating="store.isLocating"
              :is-refreshing="store.isRefreshing"
              :is-simulating="store.simulationApi !== null"
              @open-station-selector="isStationModalOpen = true"
              @locate-me="store.detectUserLocation(true)"
              @refresh-data="store.refreshData(true)"
              @open-share-modal="isShareModalOpen = true"
              @set-simulation="(val) => store.setSimulationApi(val)"
              @clear-simulation="() => store.clearSimulation()"
            />

            <HealthAdvicePanel
              :category="store.currentStation.category"
              :api="store.currentStation.api"
            />
          </div>

          <!-- Right Column: 24-Hour Trend, Regional Hotspots & Key Pollutant Bars -->
          <div class="lg:col-span-6 space-y-5">
            <TrendChart
              :history="store.currentStation.history24h"
              :current-api="store.currentStation.api"
            />

            <HazeHotspotWidget
              :hotspots="store.hotspots"
              :trend-analysis="store.trend3hAnalysis"
            />

            <PollutantBars
              :pollutants="store.currentStation.pollutants"
              :dominant="store.currentStation.dominantPollutant"
            />
          </div>
        </div>

        <!-- Full-Width Haze Seasonality Calendar Heatmap -->
        <HazeCalendarGrid
          :current-api="store.currentStation.api"
        />
      </template>

      <!-- National Map View (Map + Beside Station List) -->
      <template v-else-if="currentTab === 'map'">
        <StationMapView
          :stations="store.stations"
          :selected-station-id="store.selectedStationId"
          :user-location="store.userLocation"
          :is-locating="store.isLocating"
          @select-station="(id) => { store.selectStation(id); }"
          @view-dashboard="() => { currentTab = 'dashboard'; }"
          @locate-me="store.detectUserLocation(true)"
        />
      </template>
    </main>

    <!-- Bottom Navigation Bar (Mobile Only, hidden on md+) -->
    <nav
      class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black/95 backdrop-blur-2xl border-t border-white/[0.08] px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-around"
    >
      <button
        @click="currentTab = 'dashboard'"
        :class="[
          'flex flex-col items-center py-1 transition-colors',
          currentTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
        ]"
      >
        <Home class="w-5 h-5" />
        <span class="text-[10px] font-medium mt-1">{{ t('nav.home') }}</span>
      </button>

      <button
        @click="isStationModalOpen = true"
        :class="[
          'flex flex-col items-center py-1 transition-colors',
          isStationModalOpen ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
        ]"
      >
        <MapPin class="w-5 h-5" />
        <span class="text-[10px] font-medium mt-1">{{ t('nav.stations') }}</span>
      </button>

      <button
        @click="currentTab = 'map'"
        :class="[
          'flex flex-col items-center py-1 transition-colors',
          currentTab === 'map' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
        ]"
      >
        <Map class="w-5 h-5" />
        <span class="text-[10px] font-medium mt-1">{{ t('nav.map') }}</span>
      </button>

      <button
        @click="isSettingsModalOpen = true"
        :class="[
          'flex flex-col items-center py-1 transition-colors',
          isSettingsModalOpen ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
        ]"
      >
        <Sliders class="w-5 h-5" />
        <span class="text-[10px] font-medium mt-1">{{ t('nav.settings') }}</span>
      </button>
    </nav>

    <!-- Modals -->
    <StationListModal
      :is-open="isStationModalOpen"
      :stations="store.stations"
      :selected-station-id="store.selectedStationId"
      @close="isStationModalOpen = false"
      @select-station="handleStationSelect"
    />

    <SettingsModal
      :is-open="isSettingsModalOpen"
      :simulation-api="store.simulationApi"
      @close="isSettingsModalOpen = false"
      @set-simulation="store.setSimulationApi"
      @clear-simulation="store.clearSimulation"
    />

    <ShareCardModal
      v-if="store.currentStation"
      :is-open="isShareModalOpen"
      :station="store.currentStation"
      :last-updated="store.lastUpdated"
      @close="isShareModalOpen = false"
    />
  </div>
</template>
