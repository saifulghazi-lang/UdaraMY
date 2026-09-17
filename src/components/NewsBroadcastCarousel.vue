<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { 
  Newspaper, 
  FileText, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  PhoneCall, 
  ShieldAlert,
  X
} from 'lucide-vue-next';
import { CIVIC_DATA } from '../data/civicBulletins.js';

const activeTab = ref('news'); // 'news' | 'directives'
const currentIdx = ref(0);
const isPaused = ref(false);
const isModalOpen = ref(false);
const progressPercent = ref(0);

let timer = null;
const SLIDE_DURATION = 8000; // 8 seconds per slide
const TICK_INTERVAL = 100;

const currentList = computed(() => {
  return activeTab.value === 'news' ? CIVIC_DATA.news : CIVIC_DATA.directives;
});

const currentSlide = computed(() => {
  return currentList.value[currentIdx.value] || currentList.value[0];
});

function switchTab(tab) {
  if (activeTab.value === tab) return;
  activeTab.value = tab;
  currentIdx.value = 0;
  progressPercent.value = 0;
}

function nextSlide() {
  currentIdx.value = (currentIdx.value + 1) % currentList.value.length;
  progressPercent.value = 0;
}

function prevSlide() {
  currentIdx.value = (currentIdx.value - 1 + currentList.value.length) % currentList.value.length;
  progressPercent.value = 0;
}

function goToSlide(index) {
  currentIdx.value = index;
  progressPercent.value = 0;
}

function startTimer() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    if (!isPaused.value && !isModalOpen.value) {
      progressPercent.value += (TICK_INTERVAL / SLIDE_DURATION) * 100;
      if (progressPercent.value >= 100) {
        nextSlide();
      }
    }
  }, TICK_INTERVAL);
}

function onMouseEnter() {
  isPaused.value = true;
}

function onMouseLeave() {
  isPaused.value = false;
}

onMounted(() => {
  startTimer();
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <section 
    class="relative rounded-2xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden transition-all duration-300"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    aria-label="Civic Broadcast & News Hub"
  >
    <!-- Top Action Header & Tab Switcher -->
    <div class="px-4 pt-3 pb-2.5 flex items-center justify-between border-b border-slate-100 dark:border-white/5 gap-2 flex-wrap sm:flex-nowrap">
      <!-- Section Tabs -->
      <div class="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-black border border-slate-200 dark:border-white/10 text-xs font-semibold">
        <button
          @click="switchTab('news')"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition text-xs font-bold',
            activeTab === 'news'
              ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-white/15'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          ]"
        >
          <Newspaper class="w-3.5 h-3.5 text-indigo-500" />
          <span>Official News</span>
        </button>
        <button
          @click="switchTab('directives')"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition text-xs font-bold',
            activeTab === 'directives'
              ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-white/15'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          ]"
        >
          <FileText class="w-3.5 h-3.5 text-purple-500" />
          <span>Gov Directives & PDFs</span>
        </button>
      </div>

      <!-- Navigation Arrows & Slide Counter -->
      <div class="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5">
          {{ currentIdx + 1 }} / {{ currentList.length }}
        </span>
        <div class="flex items-center gap-1">
          <button
            @click="prevSlide"
            class="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 transition"
            title="Previous Bulletin"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
          </button>
          <button
            @click="nextSlide"
            class="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 transition"
            title="Next Bulletin"
          >
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Active Bulletin Card Body -->
    <div class="p-4 sm:p-5 space-y-2.5">
      <!-- Badges Row -->
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div class="flex items-center gap-2">
          <span
            :class="[
              'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono tracking-wider border',
              currentSlide.badgeColor
            ]"
          >
            {{ currentSlide.category }}
          </span>
          <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-mono text-slate-600 dark:text-slate-400">
            {{ currentSlide.formatBadge }}
          </span>
        </div>

        <div class="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
          <span>{{ currentSlide.source }}</span>
          <span>•</span>
          <span>{{ currentSlide.timestamp }}</span>
        </div>
      </div>

      <!-- CLICKABLE HEADLINE: Exact Verified Deep Link -->
      <a
        :href="currentSlide.url"
        target="_blank"
        rel="noopener noreferrer"
        class="group block cursor-pointer"
        title="Open verified authority source link"
      >
        <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition flex items-start justify-between gap-2">
          <span>{{ currentSlide.headline }}</span>
          <ExternalLink class="w-4 h-4 text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 shrink-0 mt-0.5 transition-colors" />
        </h3>
      </a>

      <!-- Snippet Summary -->
      <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
        {{ currentSlide.snippet }}
      </p>

      <!-- Bottom Card Actions -->
      <div class="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-white/5 text-xs">
        <!-- Pagination Dots -->
        <div class="flex items-center gap-1.5">
          <button
            v-for="(item, idx) in currentList"
            :key="item.id"
            @click="goToSlide(idx)"
            :class="[
              'h-1.5 rounded-full transition-all',
              currentIdx === idx 
                ? 'w-6 bg-indigo-600 dark:bg-cyan-400' 
                : 'w-1.5 bg-slate-200 dark:bg-white/20 hover:bg-slate-300 dark:hover:bg-white/40'
            ]"
            :title="`Slide ${idx + 1}`"
          />
        </div>

        <!-- Action Links -->
        <div class="flex items-center gap-3">
          <button
            @click="isModalOpen = true"
            class="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
          >
            <Info class="w-3.5 h-3.5" />
            <span>Quick Summary</span>
          </button>
          <span class="text-slate-300 dark:text-slate-700">•</span>
          <a
            :href="currentSlide.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition"
          >
            <span>{{ activeTab === 'directives' ? 'Open Official PDF' : 'Read Full Report' }}</span>
            <span class="text-xs">↗</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Auto-cycle Progress Line Indicator -->
    <div class="w-full bg-slate-100 dark:bg-white/5 h-0.5 overflow-hidden">
      <div
        class="h-full bg-indigo-600 dark:bg-cyan-500 transition-all duration-100 ease-linear"
        :style="{ width: `${progressPercent}%` }"
      />
    </div>

    <!-- Mini Civic Footer: Toll-Free Reporting Strip -->
    <div class="px-4 py-2 bg-slate-50 dark:bg-black/60 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 flex-wrap gap-2">
      <div class="flex items-center gap-1.5">
        <ShieldAlert class="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>Spotted open burning or peat fires?</span>
      </div>
      <div class="flex items-center gap-3">
        <a
          :href="`tel:${CIVIC_DATA.hotlines.doeTollFree}`"
          class="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          title="Call DOE Toll-Free Open Burning Hotline"
        >
          <PhoneCall class="w-3 h-3" />
          <span>{{ CIVIC_DATA.hotlines.doeTollFreeDisplay }}</span>
        </a>
        <span>•</span>
        <a
          :href="CIVIC_DATA.hotlines.doeEaduanUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-indigo-600 dark:text-cyan-400 hover:underline"
        >
          DOE e-Aduan Portal ↗
        </a>
      </div>
    </div>

    <!-- Quick Summary Popup Modal -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-150"
      @click.self="isModalOpen = false"
    >
      <div class="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-white/10 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl text-slate-900 dark:text-slate-100">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
          <div class="flex items-center gap-2">
            <span :class="['px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono tracking-wider border', currentSlide.badgeColor]">
              {{ currentSlide.category }}
            </span>
            <span class="text-xs font-mono text-slate-500 dark:text-slate-400">{{ currentSlide.formatBadge }}</span>
          </div>
          <button
            @click="isModalOpen = false"
            class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-900 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-2">
          <h4 class="text-base font-bold leading-snug">
            {{ currentSlide.headline }}
          </h4>
          <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {{ currentSlide.fullText }}
          </p>
        </div>

        <div class="p-3 rounded-xl bg-slate-50 dark:bg-black/60 border border-slate-200/80 dark:border-white/5 text-xs font-mono space-y-1 text-slate-600 dark:text-slate-400">
          <div class="flex items-center justify-between">
            <span>Verified Source:</span>
            <strong class="text-slate-900 dark:text-white">{{ currentSlide.source }}</strong>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="shrink-0">Direct Endpoint:</span>
            <span class="text-indigo-600 dark:text-cyan-400 truncate text-[10px] font-mono">{{ currentSlide.url }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <a
            :href="currentSlide.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs text-center transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>{{ activeTab === 'directives' ? 'Open & Download Official PDF' : 'Visit Official Article Source' }}</span>
            <ExternalLink class="w-3.5 h-3.5" />
          </a>
          <button
            @click="isModalOpen = false"
            class="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
