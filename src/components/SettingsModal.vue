<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { X, Download, Sliders, Bell, Globe, ShieldCheck } from 'lucide-vue-next';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  simulationApi: {
    type: [Number, null],
    default: null
  }
});

const emit = defineEmits(['close', 'setSimulation', 'clearSimulation']);
const { t, locale } = useI18n();

const deferredPrompt = ref(null);
const isInstalled = ref(false);

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
    <div class="w-full max-w-lg bg-black border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
      <!-- Header -->
      <div class="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 class="font-bold text-white flex items-center gap-2 text-sm">
          <Sliders class="w-4 h-4 text-indigo-400" />
          <span>{{ t('settings.title') }}</span>
        </h3>
        <button @click="emit('close')" class="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900 transition">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Settings Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
        
        <!-- Language Selector -->
        <div class="bg-neutral-950 border border-white/10 rounded-2xl p-3.5 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-neutral-200 flex items-center gap-1.5">
              <Globe class="w-4 h-4 text-indigo-400" />
              <span>{{ t('settings.language') }}</span>
            </span>
            <div class="flex bg-neutral-900 border border-white/5 rounded-xl p-0.5 text-xs font-semibold">
              <button
                @click="setLang('en')"
                :class="['px-3 py-1 rounded-lg transition', locale === 'en' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white']"
              >
                English
              </button>
              <button
                @click="setLang('bm')"
                :class="['px-3 py-1 rounded-lg transition', locale === 'bm' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white']"
              >
                Bahasa Melayu
              </button>
            </div>
          </div>
        </div>

        <!-- PWA Install Banner -->
        <div class="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 rounded-2xl p-4 flex items-start gap-3">
          <img
            src="/pwa-192x192.png"
            alt="UdaraMY"
            class="w-10 h-10 rounded-xl shadow-lg shadow-cyan-500/20 shrink-0 select-none object-contain border border-indigo-500/40"
          />
          <div class="flex-1">
            <h4 class="font-bold text-white">{{ t('settings.pwa') }}</h4>
            <p class="text-[11px] text-indigo-200/80 mt-0.5 leading-relaxed">
              {{ t('settings.pwaDesc') }}
            </p>
            <button
              v-if="!isInstalled"
              @click="promptInstall"
              class="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              <Download class="w-3.5 h-3.5" />
              <span>{{ t('settings.installButton') }}</span>
            </button>
            <span v-else class="mt-2.5 inline-block text-[11px] text-emerald-400 font-bold">
              ✓ {{ t('settings.installed') }}
            </span>
          </div>
        </div>

        <!-- Simulation Tool (Interactive Testing) -->
        <div class="bg-neutral-950 border border-white/10 rounded-2xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-bold text-neutral-200">{{ t('settings.simulation') }}</div>
              <div class="text-[10px] text-neutral-400">{{ t('settings.simulationDesc') }}</div>
            </div>
            <button
              v-if="simulationApi !== null"
              @click="emit('clearSimulation')"
              class="text-[10px] px-2 py-1 rounded bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white"
            >
              Reset to Live
            </button>
          </div>

          <!-- Presets -->
          <div class="grid grid-cols-5 gap-1.5">
            <button
              @click="emit('setSimulation', 35)"
              class="px-1.5 py-1 rounded bg-blue-500/20 text-blue-300 font-mono font-bold hover:bg-blue-500/30 text-[10px] border border-blue-500/20"
            >
              35 Good
            </button>
            <button
              @click="emit('setSimulation', 75)"
              class="px-1.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold hover:bg-emerald-500/30 text-[10px] border border-emerald-500/20"
            >
              75 Mod
            </button>
            <button
              @click="emit('setSimulation', 145)"
              class="px-1.5 py-1 rounded bg-amber-500/20 text-amber-300 font-mono font-bold hover:bg-amber-500/30 text-[10px] border border-amber-500/20"
            >
              145 Unh
            </button>
            <button
              @click="emit('setSimulation', 220)"
              class="px-1.5 py-1 rounded bg-red-500/20 text-red-300 font-mono font-bold hover:bg-red-500/30 text-[10px] border border-red-500/20"
            >
              220 V.Unh
            </button>
            <button
              @click="emit('setSimulation', 320)"
              class="px-1.5 py-1 rounded bg-purple-500/20 text-purple-300 font-mono font-bold hover:bg-purple-500/30 text-[10px] border border-purple-500/20"
            >
              320 Haz
            </button>
          </div>

          <!-- Slider -->
          <div class="space-y-1">
            <div class="flex justify-between text-[11px] font-mono text-neutral-400">
              <span>Slider:</span>
              <span class="text-amber-400 font-bold">{{ simulationApi ?? 'Live' }}</span>
            </div>
            <input
              type="range"
              min="10"
              max="350"
              :value="simulationApi ?? 100"
              @input="handleSimulationChange"
              class="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        <!-- Notification Preferences -->
        <div class="bg-neutral-950 border border-white/10 rounded-2xl p-4 space-y-3">
          <div class="font-bold text-neutral-200 flex items-center gap-1.5">
            <Bell class="w-4 h-4 text-indigo-400" />
            <span>{{ t('settings.notifications') }}</span>
          </div>

          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-neutral-300">{{ t('settings.alertThreshold') }}</span>
            <input type="checkbox" checked class="rounded text-indigo-600 bg-neutral-900 border-neutral-700 w-4 h-4">
          </label>

          <label class="flex items-center justify-between cursor-pointer pt-2 border-t border-white/10">
            <span class="text-neutral-300">{{ t('settings.alertSchool') }}</span>
            <input type="checkbox" checked class="rounded text-indigo-600 bg-neutral-900 border-neutral-700 w-4 h-4">
          </label>
        </div>

        <!-- Attribution & Disclaimer -->
        <div class="bg-neutral-950 border border-white/10 rounded-2xl p-3 text-[11px] text-neutral-400 leading-relaxed">
          <div class="font-bold text-neutral-300 flex items-center gap-1 mb-1">
            <ShieldCheck class="w-3.5 h-3.5 text-indigo-400" />
            <span>{{ t('settings.disclaimerTitle') }}</span>
          </div>
          {{ t('settings.disclaimerText') }}
        </div>
      </div>
    </div>
  </div>
</template>
