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
  },
  stationState: {
    type: String,
    default: ''
  },
  stationName: {
    type: String,
    default: ''
  },
  telemetry: {
    type: Object,
    default: null
  }
});

const { t } = useI18n();

const items = computed(() => {
  const dom = (props.dominant || '').toLowerCase();
  const p = props.pollutants || {};

  return [
    {
      key: 'pm25',
      name: t('trends.pm25'),
      isDominant: dom.includes('pm2.5') || dom.includes('pm25'),
      value: p.pm25?.value !== undefined ? p.pm25.value : (props.telemetry?.pm25 ?? 25),
      unit: 'µg/m³',
      ratio: p.pm25?.ratio ?? 25
    },
    {
      key: 'pm10',
      name: t('trends.pm10'),
      isDominant: dom.includes('pm10'),
      value: p.pm10?.value !== undefined ? p.pm10.value : (props.telemetry?.pm10 ?? 35),
      unit: 'µg/m³',
      ratio: p.pm10?.ratio ?? 20
    },
    {
      key: 'o3',
      name: t('trends.o3'),
      isDominant: dom.includes('o3') || dom.includes('o₃') || dom.includes('ozone'),
      value: p.o3?.value !== undefined ? p.o3.value : (props.telemetry?.o3 ?? 45),
      unit: 'µg/m³',
      ratio: p.o3?.ratio ?? 15
    },
    {
      key: 'no2',
      name: t('trends.no2'),
      isDominant: dom.includes('no2') || dom.includes('no₂'),
      value: p.no2?.value !== undefined ? p.no2.value : (props.telemetry?.no2 ?? 18),
      unit: 'µg/m³',
      ratio: p.no2?.ratio ?? 12
    },
    {
      key: 'so2',
      name: t('trends.so2'),
      isDominant: dom.includes('so2') || dom.includes('so₂'),
      value: p.so2?.value !== undefined ? p.so2.value : (props.telemetry?.so2 ?? 6),
      unit: 'µg/m³',
      ratio: p.so2?.ratio ?? 8
    },
    {
      key: 'co',
      name: t('trends.co'),
      isDominant: dom.includes('co'),
      value: p.co?.value !== undefined ? p.co.value : (props.telemetry?.co ?? 420),
      unit: 'µg/m³',
      ratio: p.co?.ratio ?? 10
    },
  ];
});

function getBarColor(ratio) {
  if (ratio < 40) return 'bg-cyan-500';
  if (ratio < 65) return 'bg-emerald-500';
  if (ratio < 85) return 'bg-amber-500';
  return 'bg-red-500';
}
</script>

<template>
  <div class="rounded-3xl p-5 sm:p-6 bg-white dark:bg-black border border-slate-200 dark:border-white/[0.12] shadow-xl dark:shadow-2xl">
    <div class="flex items-center justify-between mb-3.5 flex-wrap gap-2">
      <div class="flex items-center gap-2 flex-wrap">
        <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
          {{ t('trends.keyPollutants') }}
        </h3>
        <span v-if="stationState" class="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
          📍 {{ stationState }}
        </span>
        <span class="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          APIMS Telemetry
        </span>
      </div>
      <span class="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-500/30 shadow-sm font-mono">
        <Sparkles class="w-3 h-3 text-amber-500 dark:text-amber-400" />
        {{ t('trends.dominant') }}: {{ dominant }}
      </span>
    </div>

    <div class="space-y-3">
      <div v-for="item in items" :key="item.key">
        <div class="flex items-center justify-between text-xs mb-1">
          <div class="flex items-center gap-1">
            <span :class="['font-semibold', item.isDominant ? 'text-amber-600 dark:text-amber-300 font-bold' : 'text-slate-700 dark:text-slate-300']">
              {{ item.name }}
            </span>
            <span v-if="item.isDominant" class="text-amber-500 text-xs">⭐</span>
          </div>
          <div class="font-mono text-xs font-bold" :class="item.isDominant ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'">
            {{ item.value }} {{ item.unit }}
          </div>
        </div>

        <!-- Ratio Bar -->
        <div class="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            :class="['h-full rounded-full transition-all duration-700', getBarColor(item.ratio)]"
            :style="{ width: `${item.ratio}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
