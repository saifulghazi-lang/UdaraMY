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
  telemetry: {
    type: Object,
    default: null
  }
});

const { t } = useI18n();

const items = computed(() => {
  const dom = (props.dominant || '').toLowerCase();
  const tel = props.telemetry;

  return [
    {
      key: 'pm25',
      name: t('trends.pm25'),
      isDominant: dom.includes('pm2.5') || dom.includes('pm25'),
      value: tel?.pm25 !== undefined ? tel.pm25 : props.pollutants?.pm25?.value,
      unit: 'µg/m³',
      ratio: tel?.pm25 !== undefined ? Math.min(100, Math.round((tel.pm25 / 75) * 100)) : (props.pollutants?.pm25?.ratio || 25)
    },
    {
      key: 'pm10',
      name: t('trends.pm10'),
      isDominant: dom.includes('pm10'),
      value: tel?.pm10 !== undefined ? tel.pm10 : props.pollutants?.pm10?.value,
      unit: 'µg/m³',
      ratio: tel?.pm10 !== undefined ? Math.min(100, Math.round((tel.pm10 / 150) * 100)) : (props.pollutants?.pm10?.ratio || 20)
    },
    {
      key: 'o3',
      name: t('trends.o3'),
      isDominant: dom.includes('o3') || dom.includes('o₃') || dom.includes('ozone'),
      value: tel?.o3 !== undefined ? tel.o3 : props.pollutants?.o3?.value,
      unit: 'µg/m³',
      ratio: tel?.o3 !== undefined ? Math.min(100, Math.round((tel.o3 / 120) * 100)) : (props.pollutants?.o3?.ratio || 15)
    },
    {
      key: 'no2',
      name: t('trends.no2'),
      isDominant: dom.includes('no2') || dom.includes('no₂'),
      value: tel?.no2 !== undefined ? tel.no2 : props.pollutants?.no2?.value,
      unit: 'µg/m³',
      ratio: tel?.no2 !== undefined ? Math.min(100, Math.round((tel.no2 / 100) * 100)) : (props.pollutants?.no2?.ratio || 12)
    },
    {
      key: 'so2',
      name: t('trends.so2'),
      isDominant: dom.includes('so2') || dom.includes('so₂'),
      value: tel?.so2 !== undefined ? tel.so2 : props.pollutants?.so2?.value,
      unit: 'µg/m³',
      ratio: tel?.so2 !== undefined ? Math.min(100, Math.round((tel.so2 / 80) * 100)) : (props.pollutants?.so2?.ratio || 8)
    },
    {
      key: 'co',
      name: t('trends.co'),
      isDominant: dom.includes('co'),
      value: tel?.co !== undefined ? tel.co : props.pollutants?.co?.value,
      unit: 'µg/m³',
      ratio: tel?.co !== undefined ? Math.min(100, Math.round((tel.co / 2000) * 100)) : (props.pollutants?.co?.ratio || 10)
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
  <div class="rounded-3xl p-5 sm:p-6 bg-black border border-white/[0.12] shadow-2xl">
    <div class="flex items-center justify-between mb-3.5 flex-wrap gap-2">
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
          {{ t('trends.keyPollutants') }}
        </h3>
        <span v-if="telemetry" class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
          CAMS Live
        </span>
      </div>
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
            {{ item.value }} {{ item.unit }}
          </div>
        </div>

        <!-- Ratio Bar -->
        <div class="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
          <div
            :class="['h-full rounded-full transition-all duration-700', getBarColor(item.ratio)]"
            :style="{ width: `${item.ratio}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
