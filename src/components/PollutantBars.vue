<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Sparkles } from 'lucide-vue-next';

const props = defineProps({
  pollutants: {
    type: Object,
    required: true
  },
  dominant: {
    type: String,
    default: 'PM2.5'
  }
});

const { t } = useI18n();

const items = computed(() => {
  const dom = (props.dominant || '').toLowerCase();
  return [
    { key: 'pm25', name: t('trends.pm25'), isDominant: dom.includes('pm2.5') || dom.includes('pm25'), data: props.pollutants?.pm25 },
    { key: 'pm10', name: t('trends.pm10'), isDominant: dom.includes('pm10'), data: props.pollutants?.pm10 },
    { key: 'o3', name: t('trends.o3'), isDominant: dom.includes('o3') || dom.includes('o₃') || dom.includes('ozone'), data: props.pollutants?.o3 },
    { key: 'co', name: t('trends.co'), isDominant: dom.includes('co'), data: props.pollutants?.co },
    { key: 'no2', name: t('trends.no2'), isDominant: dom.includes('no2') || dom.includes('no₂'), data: props.pollutants?.no2 },
    { key: 'so2', name: t('trends.so2'), isDominant: dom.includes('so2') || dom.includes('so₂'), data: props.pollutants?.so2 },
  ];
});

function getBarColor(ratio) {
  if (ratio < 40) return 'bg-blue-500';
  if (ratio < 65) return 'bg-emerald-500';
  if (ratio < 85) return 'bg-amber-500';
  return 'bg-red-500';
}
</script>

<template>
  <div class="rounded-3xl p-5 sm:p-6 bg-black border border-white/[0.12] shadow-2xl">
    <div class="flex items-center justify-between mb-3.5">
      <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider">
        {{ t('trends.keyPollutants') }}
      </h3>
      <span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
        <Sparkles class="w-3 h-3 text-amber-400" />
        {{ t('trends.dominant') }}: {{ dominant }}
      </span>
    </div>

    <div class="space-y-3">
      <div v-for="item in items" :key="item.key">
        <div class="flex items-center justify-between text-xs mb-1">
          <div class="flex items-center gap-1">
            <span :class="['font-semibold', item.isDominant ? 'text-amber-300' : 'text-slate-300']">
              {{ item.name }}
            </span>
            <span v-if="item.isDominant" class="text-amber-400 text-xs">⭐</span>
          </div>
          <div class="font-mono text-xs font-bold" :class="item.isDominant ? 'text-amber-400' : 'text-slate-300'">
            {{ item.data?.value }} {{ item.data?.unit }}
          </div>
        </div>

        <!-- Ratio Bar -->
        <div class="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
          <div
            :class="['h-full rounded-full transition-all duration-700', getBarColor(item.data?.ratio || 0)]"
            :style="{ width: `${item.data?.ratio || 10}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
