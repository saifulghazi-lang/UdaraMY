<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { 
  HelpCircle, 
  X, 
  ChevronDown, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Activity, 
  Bell, 
  WifiOff 
} from 'lucide-vue-next';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);
const { t } = useI18n();

// Default first question open
const openItems = ref({
  q1: true,
  q2: false,
  q3: false,
  q4: false,
  q5: false,
  q6: false
});

function toggleItem(key) {
  openItems.value[key] = !openItems.value[key];
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    emit('close');
  }
}

watch(() => props.isOpen, (open) => {
  if (open) {
    window.addEventListener('keydown', handleKeydown);
  } else {
    window.removeEventListener('keydown', handleKeydown);
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
    class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-black/80 backdrop-blur-sm transition-opacity"
  >
    <div
      class="w-full max-w-2xl bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-slate-800 dark:text-slate-100 transition-colors"
      role="dialog"
      aria-modal="true"
    >
      <!-- Modal Header -->
      <div class="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-start justify-between gap-3 bg-white dark:bg-black shrink-0">
        <div>
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              <HelpCircle class="w-4 h-4" />
            </div>
            <h3 class="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
              {{ t('faq.title') }}
            </h3>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {{ t('faq.subtitle') }}
          </p>
        </div>

        <button
          @click="emit('close')"
          class="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition"
          aria-label="Close FAQ"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- FAQ Accordion List -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar text-xs">
        
        <!-- Question 1: Accuracy & DOE vs OpenAQ -->
        <div class="border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-neutral-950 overflow-hidden transition-all shadow-sm">
          <button
            @click="toggleItem('q1')"
            class="w-full px-4 py-3.5 flex items-center justify-between text-left font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <div class="flex items-center gap-2.5 pr-2">
              <ShieldCheck class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span class="text-xs sm:text-sm leading-snug">{{ t('faq.q1') }}</span>
            </div>
            <ChevronDown :class="['w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200', openItems.q1 ? 'rotate-180 text-indigo-600' : '']" />
          </button>

          <div v-if="openItems.q1" class="px-4 pb-4 pt-1 text-slate-600 dark:text-slate-300 space-y-2.5 border-t border-slate-200 dark:border-white/5 bg-white/60 dark:bg-black/60">
            <p class="leading-relaxed">
              <strong class="text-slate-900 dark:text-white">1. JAS APIMS (Rasmi):</strong>
              {{ t('faq.a1_p1') }}
            </p>
            <p class="leading-relaxed">
              <strong class="text-slate-900 dark:text-white">2. Penderia Komuniti (OpenAQ/PurpleAir):</strong>
              {{ t('faq.a1_p2') }}
            </p>
            <div class="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-[11px] font-mono text-indigo-900 dark:text-indigo-300">
              {{ t('faq.a1_p3') }}
            </div>
          </div>
        </div>

        <!-- Question 2: Why US AQI differs from Malaysian API -->
        <div class="border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-neutral-950 overflow-hidden transition-all shadow-sm">
          <button
            @click="toggleItem('q2')"
            class="w-full px-4 py-3.5 flex items-center justify-between text-left font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <div class="flex items-center gap-2.5 pr-2">
              <Activity class="w-4 h-4 text-indigo-500 shrink-0" />
              <span class="text-xs sm:text-sm leading-snug">{{ t('faq.q2') }}</span>
            </div>
            <ChevronDown :class="['w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200', openItems.q2 ? 'rotate-180 text-indigo-600' : '']" />
          </button>

          <div v-if="openItems.q2" class="px-4 pb-4 pt-1 text-slate-600 dark:text-slate-300 space-y-2 border-t border-slate-200 dark:border-white/5 bg-white/60 dark:bg-black/60">
            <p class="leading-relaxed">{{ t('faq.a2_p1') }}</p>
            <p class="leading-relaxed">{{ t('faq.a2_p2') }}</p>
          </div>
        </div>

        <!-- Question 3: Update Frequency -->
        <div class="border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-neutral-950 overflow-hidden transition-all shadow-sm">
          <button
            @click="toggleItem('q3')"
            class="w-full px-4 py-3.5 flex items-center justify-between text-left font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <div class="flex items-center gap-2.5 pr-2">
              <Clock class="w-4 h-4 text-sky-500 shrink-0" />
              <span class="text-xs sm:text-sm leading-snug">{{ t('faq.q3') }}</span>
            </div>
            <ChevronDown :class="['w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200', openItems.q3 ? 'rotate-180 text-indigo-600' : '']" />
          </button>

          <div v-if="openItems.q3" class="px-4 pb-4 pt-1 text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-white/5 bg-white/60 dark:bg-black/60">
            <p class="leading-relaxed whitespace-pre-line">{{ t('faq.a3_p1') }}</p>
          </div>
        </div>

        <!-- Question 4: Health actions per API level -->
        <div class="border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-neutral-950 overflow-hidden transition-all shadow-sm">
          <button
            @click="toggleItem('q4')"
            class="w-full px-4 py-3.5 flex items-center justify-between text-left font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <div class="flex items-center gap-2.5 pr-2">
              <CheckCircle2 class="w-4 h-4 text-amber-500 shrink-0" />
              <span class="text-xs sm:text-sm leading-snug">{{ t('faq.q4') }}</span>
            </div>
            <ChevronDown :class="['w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200', openItems.q4 ? 'rotate-180 text-indigo-600' : '']" />
          </button>

          <div v-if="openItems.q4" class="px-4 pb-4 pt-1 text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-white/5 bg-white/60 dark:bg-black/60">
            <p class="leading-relaxed whitespace-pre-line">{{ t('faq.a4_p1') }}</p>
          </div>
        </div>

        <!-- Question 5: PWA Haze Alerts -->
        <div class="border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-neutral-950 overflow-hidden transition-all shadow-sm">
          <button
            @click="toggleItem('q5')"
            class="w-full px-4 py-3.5 flex items-center justify-between text-left font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <div class="flex items-center gap-2.5 pr-2">
              <Bell class="w-4 h-4 text-rose-500 shrink-0" />
              <span class="text-xs sm:text-sm leading-snug">{{ t('faq.q5') }}</span>
            </div>
            <ChevronDown :class="['w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200', openItems.q5 ? 'rotate-180 text-indigo-600' : '']" />
          </button>

          <div v-if="openItems.q5" class="px-4 pb-4 pt-1 text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-white/5 bg-white/60 dark:bg-black/60">
            <p class="leading-relaxed">{{ t('faq.a5_p1') }}</p>
          </div>
        </div>

        <!-- Question 6: Offline support -->
        <div class="border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-neutral-950 overflow-hidden transition-all shadow-sm">
          <button
            @click="toggleItem('q6')"
            class="w-full px-4 py-3.5 flex items-center justify-between text-left font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <div class="flex items-center gap-2.5 pr-2">
              <WifiOff class="w-4 h-4 text-slate-400 shrink-0" />
              <span class="text-xs sm:text-sm leading-snug">{{ t('faq.q6') }}</span>
            </div>
            <ChevronDown :class="['w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200', openItems.q6 ? 'rotate-180 text-indigo-600' : '']" />
          </button>

          <div v-if="openItems.q6" class="px-4 pb-4 pt-1 text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-white/5 bg-white/60 dark:bg-black/60">
            <p class="leading-relaxed">{{ t('faq.a6_p1') }}</p>
          </div>
        </div>

      </div>

      <!-- Footer Button -->
      <div class="p-3.5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-950/80 flex items-center justify-between text-xs shrink-0">
        <span class="text-[10px] text-slate-400 font-mono">UdaraMY • Malaysian Ambient Air Quality Standard (MCG)</span>
        <button
          @click="emit('close')"
          class="px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-sm"
        >
          Tutup / Close
        </button>
      </div>
    </div>
  </div>
</template>
