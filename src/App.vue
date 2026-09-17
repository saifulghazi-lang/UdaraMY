<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAirQualityStore } from './stores/airQuality.js';
import { 
  Home, 
  Map, 
  Sliders, 
  MapPin, 
  WifiOff, 
  Globe, 
  LocateFixed, 
  Share2, 
  RefreshCw, 
  Activity, 
  ChevronDown, 
  MoreHorizontal, 
  Trophy,
  Sun,
  Moon
} from 'lucide-vue-next';

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
import NationalOverviewBar from './components/NationalOverviewBar.vue';
import StateLeaderboardModal from './components/StateLeaderboardModal.vue';

const store = useAirQualityStore();
const { t, locale } = useI18n();

const currentTab = ref('dashboard');
const isStationModalOpen = ref(false);
const isSettingsModalOpen = ref(false);
const isShareModalOpen = ref(false);
const isLeaderboardModalOpen = ref(false);
const isDeepAnalysisOpen = ref(false);
const isOverflowMenuOpen = ref(false);

// Theme state: Default is 'light' unless user explicitly saved 'dark'
const isDarkMode = ref(localStorage.getItem('udaramy_theme') === 'dark');

function applyTheme() {
  if (typeof document !== 'undefined') {
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('udaramy_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('udaramy_theme', 'light');
    }
  }
}

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;
  applyTheme();
}

// Real-time ticking live clock (Malaysian Time MYT)
const liveClock = ref('');
let clockTimer = null;

function updateLiveClock() {
  const now = new Date();
  liveClock.value = now.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }) + ' MYT';
}

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
  applyTheme();
  updateLiveClock();
  clockTimer = setInterval(updateLiveClock, 1000);
});

onBeforeUnmount(() => {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
    <!-- Top Header: 3-Zone Consolidated Architecture -->
    <header class="sticky top-0 z-30 bg-white/80 dark:bg-black/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.08] px-4 sm:px-8 py-2.5 flex items-center justify-between gap-2">
      <!-- Zone 1: Left Brand & Station Quick Trigger -->
      <div class="flex items-center gap-3 min-w-0">
        <div class="flex items-center gap-2 shrink-0">
          <img
            src="/favicon.svg"
            alt="UdaraMY Logo"
            class="w-8 h-8 rounded-xl shadow-md shrink-0 select-none object-contain border border-slate-200 dark:border-white/10"
          />
          <div>
            <h1 class="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
              <span>{{ t('app.title') }}</span>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">MY</span>
            </h1>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{{ t('app.subtitle') }}</p>
          </div>
        </div>

        <!-- Station Quick Selector Pill (Capsule Design) -->
        <button
          @click="isStationModalOpen = true"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-neutral-950 dark:hover:bg-neutral-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition max-w-[140px] sm:max-w-[210px] truncate shadow-sm"
          :title="t('app.changeStation')"
        >
          <MapPin class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
          <span class="truncate">{{ store.currentStation?.name || t('app.changeStation') }}</span>
          <span
            v-if="store.distanceToCurrentStation !== null"
            class="hidden sm:inline-block ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-mono shrink-0"
          >
            {{ store.distanceToCurrentStation }} km
          </span>
        </button>
      </div>

      <!-- Zone 2: Center Desktop Navigation & Live Sync / Clock -->
      <div class="hidden md:flex items-center gap-3">
        <nav class="flex items-center gap-1 bg-slate-100 dark:bg-black border border-slate-200 dark:border-white/10 rounded-full p-1 text-xs">
          <button
            @click="currentTab = 'dashboard'"
            :class="[
              'flex items-center gap-2 px-3.5 py-1.5 rounded-full font-semibold transition-all',
              currentTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-neutral-950'
            ]"
          >
            <Home class="w-4 h-4" />
            <span>{{ t('nav.home') }}</span>
          </button>
          <button
            @click="currentTab = 'map'"
            :class="[
              'flex items-center gap-2 px-3.5 py-1.5 rounded-full font-semibold transition-all',
              currentTab === 'map' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-neutral-950'
            ]"
          >
            <Map class="w-4 h-4" />
            <span>{{ t('nav.map') }}</span>
          </button>
        </nav>

        <!-- Real-time Live Ticking Clock (MYT) -->
        <div class="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 font-mono text-[10px] text-slate-700 dark:text-slate-300 font-bold shadow-sm">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{{ liveClock }}</span>
        </div>

        <!-- Live Sync Status Badge -->
        <span
          :class="[
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition shadow-sm',
            store.isLive
              ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-amber-700 dark:text-amber-400'
          ]"
        >
          <span :class="['w-1.5 h-1.5 rounded-full', store.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500']"></span>
          <span>{{ store.isLive ? 'LIVE APIMS' : 'CACHED' }}: {{ formattedLastUpdated }}</span>
        </span>
      </div>

      <!-- Zone 3: Right Consolidated Actions (Theme Toggle, Locate, Refresh, Overflow Menu) -->
      <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <!-- 1-Tap Theme Toggle: Light Mode (Default) vs Dark Mode AMOLED -->
        <button
          @click="toggleTheme"
          class="p-2 rounded-full bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-black transition focus:outline-none shadow-sm"
          :title="isDarkMode ? 'Tukar ke Mod Cerah (Light Mode)' : 'Tukar ke Mod Gelap AMOLED (Dark Mode)'"
        >
          <Sun v-if="isDarkMode" class="w-4 h-4 text-amber-400" />
          <Moon v-else class="w-4 h-4 text-indigo-600" />
        </button>

        <!-- GPS Locate Button -->
        <button
          @click="store.detectUserLocation(true)"
          :disabled="store.isLocating"
          class="p-2 rounded-full bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/25 hover:bg-slate-200 dark:hover:bg-black transition focus:outline-none shadow-sm"
          :title="store.isLocating ? t('location.locating') : t('location.locateMe')"
        >
          <LocateFixed :class="['w-4 h-4 text-cyan-500 dark:text-cyan-400', store.isLocating ? 'animate-spin text-amber-500' : '']" />
        </button>

        <!-- Dedicated Data Refresh Button -->
        <button
          @click="store.refreshData(true)"
          :disabled="store.isRefreshing"
          class="p-2 sm:px-3 sm:py-1.5 rounded-full bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/25 hover:bg-slate-200 dark:hover:bg-black transition focus:outline-none active:scale-95 shadow-sm flex items-center gap-1.5"
          :title="store.isRefreshing ? t('app.refreshing') : t('app.refresh')"
        >
          <RefreshCw :class="['w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400', store.isRefreshing ? 'animate-spin' : '']" />
          <span class="hidden xl:inline text-xs font-mono text-slate-500 dark:text-slate-400">
            {{ formattedLastUpdated }}
          </span>
        </button>

        <!-- Overflow Menu Trigger (...) -->
        <div class="relative">
          <button
            @click="isOverflowMenuOpen = !isOverflowMenuOpen"
            class="p-2 rounded-full bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/25 hover:bg-slate-200 dark:hover:bg-black transition focus:outline-none shadow-sm"
            :title="t('guidance.moreOptions')"
          >
            <MoreHorizontal class="w-4 h-4" />
          </button>

          <!-- Backdrop -->
          <div
            v-if="isOverflowMenuOpen"
            @click="isOverflowMenuOpen = false"
            class="fixed inset-0 z-40"
          ></div>

          <!-- Floating Overflow Dropdown -->
          <div
            v-if="isOverflowMenuOpen"
            class="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-black/95 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 backdrop-blur-xl"
          >
            <!-- State Leaderboard -->
            <button
              @click="isLeaderboardModalOpen = true; isOverflowMenuOpen = false"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-950 transition text-left"
            >
              <Trophy class="w-4 h-4 text-amber-500 shrink-0" />
              <span>{{ t('national.viewLeaderboard') || 'Papan Kedudukan Negeri' }}</span>
            </button>

            <!-- Share Story Card -->
            <button
              v-if="store.currentStation"
              @click="isShareModalOpen = true; isOverflowMenuOpen = false"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-950 transition text-left"
            >
              <Share2 class="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span>{{ t('share.button') }}</span>
            </button>

            <!-- Language Switcher -->
            <button
              @click="toggleLang(); isOverflowMenuOpen = false"
              class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-950 transition text-left"
            >
              <div class="flex items-center gap-2.5">
                <Globe class="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                <span>{{ locale === 'en' ? 'Bahasa Melayu' : 'English' }}</span>
              </div>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 uppercase">{{ locale }}</span>
            </button>

            <!-- Theme Toggle in Menu -->
            <button
              @click="toggleTheme(); isOverflowMenuOpen = false"
              class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-950 transition text-left"
            >
              <div class="flex items-center gap-2.5">
                <component :is="isDarkMode ? Sun : Moon" class="w-4 h-4 text-amber-500 shrink-0" />
                <span>{{ isDarkMode ? 'Mod Cerah' : 'Mod Gelap AMOLED' }}</span>
              </div>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 uppercase">{{ isDarkMode ? 'DARK' : 'LIGHT' }}</span>
            </button>

            <div class="border-t border-slate-200 dark:border-white/10 my-0.5"></div>

            <!-- Settings -->
            <button
              @click="isSettingsModalOpen = true; isOverflowMenuOpen = false"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-950 transition text-left"
            >
              <Sliders class="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span>{{ t('settings.title') }}</span>
            </button>
          </div>
        </div>
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

        <!-- National Highs & Lows Glance Bar -->
        <NationalOverviewBar
          :summary="store.nationalSummary"
          @select-station="(id) => store.selectStation(id)"
          @open-leaderboard="isLeaderboardModalOpen = true"
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
              :is-simulating="store.simulationApi !== null"
              @open-station-selector="isStationModalOpen = true"
              @clear-simulation="() => store.clearSimulation()"
            />

            <HealthAdvicePanel
              :category="store.currentStation.category"
              :api="store.currentStation.api"
            />
          </div>

          <!-- Right Column: 24-Hour Trend & Regional Wildfire Hotspots -->
          <div class="lg:col-span-6 space-y-5">
            <TrendChart
              :history="store.currentStation.history24h"
              :current-api="store.currentStation.api"
              :forecast="store.forecast"
            />

            <HazeHotspotWidget
              :hotspots="store.hotspots"
              :trend-analysis="store.trend3hAnalysis"
            />
          </div>
        </div>

        <!-- Collapsible Progressive Disclosure: Detailed Chemical Pollutants & 365-Day Annual Seasonality -->
        <div class="border border-slate-200 dark:border-white/10 rounded-3xl bg-white dark:bg-neutral-950/80 overflow-hidden shadow-sm transition-all">
          <button
            @click="isDeepAnalysisOpen = !isDeepAnalysisOpen"
            class="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition text-left cursor-pointer focus:outline-none"
          >
            <div class="flex items-center gap-3.5">
              <div class="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Activity class="w-4 h-4" />
              </div>
              <div>
                <h3 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>{{ t('app.detailedAnalysis') }}</span>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                    PM2.5, PM10, O₃, NO₂, SO₂, CO • 365 Hari
                  </span>
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {{ isDeepAnalysisOpen ? t('app.hideDetailedAnalysis') : t('app.detailedAnalysisDesc') }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-slate-400 shrink-0 ml-2">
              <span class="text-xs font-semibold hidden sm:inline">{{ isDeepAnalysisOpen ? 'Tutup' : 'Buka' }}</span>
              <ChevronDown
                :class="['w-5 h-5 transition-transform duration-300', isDeepAnalysisOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : '']"
              />
            </div>
          </button>

          <div v-if="isDeepAnalysisOpen" class="p-4 sm:p-6 border-t border-slate-200 dark:border-white/10 space-y-6 bg-slate-50/50 dark:bg-black/60">
            <PollutantBars
              :pollutants="store.currentStation.pollutants"
              :dominant="store.currentStation.dominantPollutant"
              :station-state="store.currentStation.state"
              :station-name="store.currentStation.name"
              :telemetry="store.forecast?.currentPollutants"
            />
            <HazeCalendarGrid
              :current-api="store.currentStation.api"
            />
          </div>
        </div>
      </template>

      <!-- National Map View (Map + Beside Station List) -->
      <template v-else-if="currentTab === 'map'">
        <StationMapView
          :stations="store.stations"
          :community-sensors="store.communitySensors"
          :show-community="store.showCommunitySensors"
          :selected-station-id="store.selectedStationId"
          :user-location="store.userLocation"
          :is-locating="store.isLocating"
          @toggle-community="store.toggleCommunitySensors"
          @select-station="(id) => { store.selectStation(id); }"
          @view-dashboard="() => { currentTab = 'dashboard'; }"
          @locate-me="store.detectUserLocation(true)"
        />
      </template>
    </main>

    <!-- Bottom Navigation Bar (Mobile Only, hidden on md+) -->
    <nav
      class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/[0.08] px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-around"
    >
      <button
        @click="currentTab = 'dashboard'"
        :class="[
          'flex flex-col items-center py-1 transition-colors',
          currentTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        ]"
      >
        <Home class="w-5 h-5" />
        <span class="text-[10px] font-medium mt-1">{{ t('nav.home') }}</span>
      </button>

      <button
        @click="isStationModalOpen = true"
        :class="[
          'flex flex-col items-center py-1 transition-colors',
          isStationModalOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        ]"
      >
        <MapPin class="w-5 h-5" />
        <span class="text-[10px] font-medium mt-1">{{ t('nav.stations') }}</span>
      </button>

      <button
        @click="currentTab = 'map'"
        :class="[
          'flex flex-col items-center py-1 transition-colors',
          currentTab === 'map' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        ]"
      >
        <Map class="w-5 h-5" />
        <span class="text-[10px] font-medium mt-1">{{ t('nav.map') }}</span>
      </button>

      <button
        @click="isSettingsModalOpen = true"
        :class="[
          'flex flex-col items-center py-1 transition-colors',
          isSettingsModalOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
      :is-dark-mode="isDarkMode"
      @close="isSettingsModalOpen = false"
      @toggle-theme="toggleTheme"
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

    <StateLeaderboardModal
      :is-open="isLeaderboardModalOpen"
      :state-rankings="store.stateRankings"
      :national-summary="store.nationalSummary"
      :selected-station-id="store.selectedStationId"
      @close="isLeaderboardModalOpen = false"
      @select-station="handleStationSelect"
    />
  </div>
</template>
