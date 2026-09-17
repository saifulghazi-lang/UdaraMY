<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { X, Download, Sliders, Bell, Globe, ShieldCheck, Users, Plus, Trash2, Sun, Moon, ExternalLink, Key, Check, RefreshCw } from 'lucide-vue-next';
import { useAirQualityStore } from '../stores/airQuality.js';
import { saveCustomCommunitySensor } from '../services/communityService.js';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  simulationApi: {
    type: [Number, null],
    default: null
  },
  isDarkMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'setSimulation', 'clearSimulation', 'toggleTheme']);
const { t, locale } = useI18n();
const store = useAirQualityStore();

const deferredPrompt = ref(null);
const isInstalled = ref(false);
const openAqKeyInput = ref(store.openAqApiKey || '');
const isKeySaved = ref(false);

async function saveOpenAqKey() {
  await store.updateOpenAqApiKey(openAqKeyInput.value);
  isKeySaved.value = true;
  setTimeout(() => {
    isKeySaved.value = false;
  }, 2500);
}

async function clearOpenAqKey() {
  openAqKeyInput.value = '';
  await store.updateOpenAqApiKey('');
}

function setLang(lang) {
  locale.value = lang;
  localStorage.setItem('udaramy_lang', lang);
}

function handleSimulationChange(e) {
  const val = parseInt(e.target.value, 10);
  emit('setSimulation', val);
}

function promptInstall() {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt();
    deferredPrompt.value.userChoice.then(choice => {
      if (choice.outcome === 'accepted') {
        isInstalled.value = true;
      }
      deferredPrompt.value = null;
    });
  } else {
    alert('To install, open your browser menu and tap "Add to Home Screen" or "Install App".');
  }
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt.value = e;
  });

  if (window.matchMedia('(display-mode: standalone)').matches) {
    isInstalled.value = true;
  }
});
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-black/80 backdrop-blur-sm transition-opacity"
  >
    <div class="w-full max-w-lg bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-800 dark:text-slate-100">
      <!-- Header -->
      <div class="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-black">
        <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
          <Sliders class="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span>{{ t('settings.title') }}</span>
        </h3>
        <button @click="emit('close')" class="p-1 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Settings Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
        
        <!-- Theme Selector (Light Mode Default vs AMOLED Dark) -->
        <div class="bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
              <component :is="isDarkMode ? Moon : Sun" class="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span>Tema / Theme</span>
            </span>
            <div class="flex bg-slate-200/80 dark:bg-black border border-slate-200 dark:border-white/10 rounded-full p-0.5 text-xs font-semibold">
              <button
                @click="isDarkMode ? emit('toggleTheme') : null"
                :class="['px-3 py-1 rounded-full transition', !isDarkMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white']"
              >
                ☀️ Cerah (Light)
              </button>
              <button
                @click="!isDarkMode ? emit('toggleTheme') : null"
                :class="['px-3 py-1 rounded-full transition', isDarkMode ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white']"
              >
                🌙 Gelap (Dark)
              </button>
            </div>
          </div>
        </div>

        <!-- Language Selector -->
        <div class="bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Globe class="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span>{{ t('settings.language') }}</span>
            </span>
            <div class="flex bg-slate-200/80 dark:bg-black border border-slate-200 dark:border-white/10 rounded-full p-0.5 text-xs font-semibold">
              <button
                @click="setLang('en')"
                :class="['px-3 py-1 rounded-full transition', locale === 'en' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white']"
              >
                English
              </button>
              <button
                @click="setLang('bm')"
                :class="['px-3 py-1 rounded-full transition', locale === 'bm' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white']"
              >
                Bahasa Melayu
              </button>
            </div>
          </div>
        </div>

        <!-- PWA Install Banner -->
        <div class="bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-start gap-3">
          <img
            src="/pwa-192x192.png"
            alt="UdaraMY"
            class="w-10 h-10 rounded-xl shadow-md shrink-0 select-none object-contain border border-slate-200 dark:border-white/10"
          />
          <div class="flex-1">
            <h4 class="font-bold text-slate-900 dark:text-white">{{ t('settings.pwa') }}</h4>
            <p class="text-xs text-slate-600 dark:text-indigo-200/80 mt-0.5 leading-relaxed">
              {{ t('settings.pwaDesc') }}
            </p>
            <button
              v-if="!isInstalled"
              @click="promptInstall"
              class="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold transition shadow-sm"
            >
              <Download class="w-3.5 h-3.5" />
              <span>{{ t('settings.installButton') }}</span>
            </button>
            <span v-else class="mt-2.5 inline-block text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              ✓ {{ t('settings.installed') }}
            </span>
          </div>
        </div>

        <!-- Simulation Tool (Interactive Testing) -->
        <div class="bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-bold text-slate-900 dark:text-neutral-200">{{ t('settings.simulation') }}</div>
              <div class="text-[10px] text-slate-500 dark:text-neutral-400">{{ t('settings.simulationDesc') }}</div>
            </div>
            <button
              v-if="simulationApi !== null"
              @click="emit('clearSimulation')"
              class="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white"
            >
              Reset to Live
            </button>
          </div>

          <!-- Presets -->
          <div class="grid grid-cols-5 gap-1.5">
            <button
              @click="emit('setSimulation', 35)"
              class="px-1.5 py-1 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-mono font-bold hover:bg-cyan-500/25 text-[10px] border border-cyan-500/30"
            >
              35 Good
            </button>
            <button
              @click="emit('setSimulation', 75)"
              class="px-1.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono font-bold hover:bg-emerald-500/25 text-[10px] border border-emerald-500/30"
            >
              75 Mod
            </button>
            <button
              @click="emit('setSimulation', 145)"
              class="px-1.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-bold hover:bg-amber-500/25 text-[10px] border border-amber-500/30"
            >
              145 Unh
            </button>
            <button
              @click="emit('setSimulation', 220)"
              class="px-1.5 py-1 rounded-full bg-red-500/15 text-red-700 dark:text-red-300 font-mono font-bold hover:bg-red-500/25 text-[10px] border border-red-500/30"
            >
              220 V.Unh
            </button>
            <button
              @click="emit('setSimulation', 320)"
              class="px-1.5 py-1 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 font-mono font-bold hover:bg-purple-500/25 text-[10px] border border-purple-500/30"
            >
              320 Haz
            </button>
          </div>

          <!-- Slider -->
          <div class="space-y-1">
            <div class="flex justify-between text-xs font-mono text-slate-600 dark:text-neutral-400">
              <span>Slider:</span>
              <span class="text-amber-600 dark:text-amber-400 font-bold">{{ simulationApi ?? 'Live' }}</span>
            </div>
            <input
              type="range"
              min="10"
              max="350"
              :value="simulationApi ?? 100"
              @input="handleSimulationChange"
              class="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>

        <!-- Crowdsourced Community Sensors Setting -->
        <div class="bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-3.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Users class="w-4 h-4" />
              </div>
              <div>
                <div class="font-bold text-slate-900 dark:text-neutral-200">{{ t('settings.communitySensors') }}</div>
                <div class="text-[10px] text-slate-500 dark:text-neutral-400">{{ t('settings.communitySensorsDesc') }}</div>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                :checked="store.showCommunitySensors"
                @change="store.toggleCommunitySensors()"
                class="sr-only peer"
              >
              <div class="w-9 h-5 bg-slate-300 dark:bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <p class="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
            {{ t('settings.communitySensorsDetail') }}
          </p>

          <!-- Live Status & Data Source Indicator -->
          <div class="flex items-center justify-between bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl p-2.5">
            <div class="flex items-center gap-2">
              <span v-if="store.communitySource === 'openaq'" class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span v-else-if="store.communitySource === 'cached'" class="inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              <span v-else class="inline-flex rounded-full h-2 w-2 bg-amber-500"></span>

              <span class="text-xs font-semibold text-slate-800 dark:text-neutral-300">
                <template v-if="store.communitySource === 'openaq'">
                  {{ t('settings.communityLiveStatusOpenAq', { count: store.communitySensors.length }) }}
                </template>
                <template v-else-if="store.communitySource === 'cached'">
                  {{ t('settings.communityLiveStatusCached', { count: store.communitySensors.length }) }}
                </template>
                <template v-else-if="store.communitySensors.length > 0">
                  {{ store.communitySensors.length }} Stesen Komuniti
                </template>
                <template v-else>
                  Tiada nod dikesan (Perlukan Kunci OpenAQ)
                </template>
              </span>
            </div>

            <button
              @click="store.refreshCommunitySensors()"
              :disabled="store.isCommunityLoading"
              class="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 transition disabled:opacity-50"
              title="Refresh Community Sensors"
            >
              <RefreshCw :class="['w-3.5 h-3.5', store.isCommunityLoading ? 'animate-spin text-indigo-500' : '']" />
            </button>
          </div>

          <!-- EPA Calibration Badge -->
          <div class="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/30 rounded-xl p-2.5 text-[11px] text-indigo-900 dark:text-indigo-300 flex items-start gap-2">
            <ShieldCheck class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div class="leading-tight font-mono">
              {{ t('settings.epaFormulaNote') }}
            </div>
          </div>

          <!-- OpenAQ API Key Input Field -->
          <div class="pt-2 border-t border-slate-200/80 dark:border-white/10 space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Key class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>{{ t('settings.openaqApiKeyLabel') }}</span>
              </label>
              <a
                href="https://explore.openaq.org/register"
                target="_blank"
                rel="noopener noreferrer"
                class="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                <span>explore.openaq.org</span>
                <ExternalLink class="w-2.5 h-2.5" />
              </a>
            </div>

            <div class="flex gap-2">
              <input
                v-model="openAqKeyInput"
                type="text"
                :placeholder="t('settings.openaqApiKeyPlaceholder')"
                class="flex-1 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition"
              />
              <button
                @click="saveOpenAqKey"
                :disabled="store.isCommunityLoading"
                class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-sm"
              >
                <Check v-if="isKeySaved" class="w-3.5 h-3.5" />
                <span>{{ isKeySaved ? t('settings.savedApiKey') : t('settings.saveApiKey') }}</span>
              </button>
              <button
                v-if="openAqKeyInput"
                @click="clearOpenAqKey"
                class="px-2.5 py-1.5 bg-slate-200/70 dark:bg-neutral-900 hover:bg-slate-300 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-400 rounded-xl text-xs font-medium transition"
              >
                {{ t('settings.clearApiKey') }}
              </button>
            </div>

            <p class="text-[10px] text-slate-500 dark:text-neutral-400 leading-normal">
              {{ t('settings.openaqApiKeyHelp') }}
            </p>
          </div>
        </div>

        <!-- Notification Preferences -->
        <div class="bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-3">
          <div class="font-bold text-slate-900 dark:text-neutral-200 flex items-center gap-1.5">
            <Bell class="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>{{ t('settings.notifications') }}</span>
          </div>

          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-slate-700 dark:text-neutral-300">{{ t('settings.alertThreshold') }}</span>
            <input type="checkbox" checked class="rounded text-indigo-600 bg-white dark:bg-neutral-950 border-slate-300 dark:border-neutral-700 w-4 h-4">
          </label>

          <label class="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200 dark:border-white/10">
            <span class="text-slate-700 dark:text-neutral-300">{{ t('settings.alertSchool') }}</span>
            <input type="checkbox" checked class="rounded text-indigo-600 bg-white dark:bg-neutral-950 border-slate-300 dark:border-neutral-700 w-4 h-4">
          </label>
        </div>

        <!-- Attribution & Disclaimer -->
        <div class="bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-white/10 rounded-2xl p-3 text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
          <div class="font-bold text-slate-800 dark:text-neutral-300 flex items-center gap-1 mb-1">
            <ShieldCheck class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>{{ t('settings.disclaimerTitle') }}</span>
          </div>
          {{ t('settings.disclaimerText') }}
        </div>
      </div>
    </div>
  </div>
</template>
