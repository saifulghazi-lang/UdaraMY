<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { X, Download, Share2, Copy, Check } from 'lucide-vue-next';
import { getCategoryColor } from '../data/stations.js';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  station: {
    type: Object,
    required: true
  },
  lastUpdated: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close']);
const { t } = useI18n();

const format = ref('story'); // 'story' (9:16) | 'square' (1:1)
const canvasRef = ref(null);
const previewUrl = ref('');
const isCopied = ref(false);

function getGradientStops(category) {
  switch (category) {
    case 'good': return ['#1d4ed8', '#000000'];
    case 'moderate': return ['#047857', '#000000'];
    case 'unhealthy': return ['#b45309', '#000000'];
    case 'veryUnhealthy': return ['#b91c1c', '#000000'];
    case 'hazardous': return ['#6b21a8', '#000000'];
    default: return ['#1e293b', '#000000'];
  }
}

function generateShareGraphic() {
  if (!canvasRef.value || !props.station) return;

  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');

  const width = format.value === 'story' ? 1080 : 1080;
  const height = format.value === 'story' ? 1920 : 1080;

  canvas.width = width;
  canvas.height = height;

  // 1. Background Gradient
  const [topColor, bottomColor] = getGradientStops(props.station.category);
  const grad = ctx.createLinearGradient(0, 0, width * 0.4, height);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Decorative circles / haze particles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.beginPath();
  ctx.arc(width * 0.8, height * 0.2, 350, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(width * 0.1, height * 0.7, 400, 0, Math.PI * 2);
  ctx.fill();

  // 3. Top Header Branding
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
  ctx.fillText('🌫️ UdaraMY', 90, 130);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.font = '500 24px system-ui, sans-serif';
  ctx.fillText('MALAYSIA AIR QUALITY MONITOR', 90, 170);

  // Live Pill
  const liveX = width - 260;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.roundRect(liveX, 98, 170, 48, 24);
  ctx.fill();
  ctx.fillStyle = '#34d399';
  ctx.beginPath();
  ctx.arc(liveX + 26, 122, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('LIVE APIMS', liveX + 44, 129);

  // 4. Center Station Information
  const contentCenterY = format.value === 'story' ? height * 0.46 : height * 0.48;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(`📍 ${props.station.state?.toUpperCase()}`, 90, contentCenterY - 170);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 68px system-ui, -apple-system, sans-serif';
  ctx.fillText(props.station.name, 90, contentCenterY - 95);

  // Giant API Gauge
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 220px monospace';
  ctx.fillText(String(props.station.api), 90, contentCenterY + 110);

  // Status Badge Pill
  const catColor = getCategoryColor(props.station.category);
  const catLabel = t(`categories.${props.station.category}`).toUpperCase();
  ctx.fillStyle = catColor;
  ctx.beginPath();
  ctx.roundRect(90, contentCenterY + 160, 360, 68, 34);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText(catLabel, 130, contentCenterY + 206);

  // 5. Health Advice Box
  const adviceY = contentCenterY + 280;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.roundRect(90, adviceY, width - 180, 180, 28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText('Nasihat Kesihatan / Health Advisory:', 130, adviceY + 54);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '500 24px system-ui, sans-serif';
  const adviceText = t(`advice.${props.station.category}`);
  ctx.fillText(adviceText.slice(0, 65) + (adviceText.length > 65 ? '...' : ''), 130, adviceY + 105);

  // 6. Bottom Footer
  const footerY = height - 100;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '500 22px system-ui, sans-serif';
  ctx.fillText('Data Rasmi: Jabatan Alam Sekitar (JAS) • APIMS Malaysia', 90, footerY);

  const timeStr = props.lastUpdated
    ? new Date(props.lastUpdated).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Hari ini / Today';
  ctx.fillText(timeStr, width - 360, footerY);

  previewUrl.value = canvas.toDataURL('image/png');
}

function downloadImage() {
  if (!previewUrl.value) return;
  const link = document.createElement('a');
  link.download = `UdaraMY-${props.station.name.replace(/\s+/g, '_')}-${props.station.api}.png`;
  link.href = previewUrl.value;
  link.click();
}

async function shareNative() {
  if (!canvasRef.value) return;
  try {
    const canvas = canvasRef.value;
    canvas.toBlob(async blob => {
      const file = new File([blob], `UdaraMY-${props.station.name}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `UdaraMY — Air Quality: ${props.station.name} (${props.station.api})`,
          text: `Current Air Pollutant Index for ${props.station.name} is ${props.station.api} (${t('categories.' + props.station.category)}). Track live haze on UdaraMY!`
        });
      } else {
        downloadImage();
      }
    });
  } catch (e) {
    downloadImage();
  }
}

async function copyToClipboard() {
  if (!canvasRef.value) return;
  try {
    canvasRef.value.toBlob(async blob => {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      isCopied.value = true;
      setTimeout(() => { isCopied.value = false; }, 2500);
    });
  } catch (e) {
    downloadImage();
  }
}

watch([() => props.isOpen, format, () => props.station], () => {
  if (props.isOpen) {
    nextTick(generateShareGraphic);
  }
});
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md transition-opacity"
  >
    <div class="w-full max-w-md bg-black border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 class="font-bold text-white flex items-center gap-2 text-sm">
          <Share2 class="w-4 h-4 text-indigo-400" />
          <span>{{ t('share.title') }}</span>
        </h3>
        <button @click="emit('close')" class="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Format Selector & Preview -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-center">
        <!-- Story vs Square toggle -->
        <div class="inline-flex bg-neutral-950 border border-white/10 rounded-2xl p-1 text-xs font-semibold">
          <button
            @click="format = 'story'"
            :class="['px-3 py-1.5 rounded-xl transition', format === 'story' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white']"
          >
            {{ t('share.formatStory') }}
          </button>
          <button
            @click="format = 'square'"
            :class="['px-3 py-1.5 rounded-xl transition', format === 'square' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white']"
          >
            {{ t('share.formatSquare') }}
          </button>
        </div>

        <!-- Hidden canvas generating full resolution -->
        <canvas ref="canvasRef" class="hidden"></canvas>

        <!-- Preview Image -->
        <div class="flex justify-center">
          <img
            v-if="previewUrl"
            :src="previewUrl"
            alt="Share Preview"
            :class="[
              'rounded-2xl shadow-2xl border border-white/10 object-contain max-h-[380px]',
              format === 'story' ? 'aspect-[9/16]' : 'aspect-square'
            ]"
          />
        </div>
      </div>

      <!-- Action Footer -->
      <div class="p-4 border-t border-white/10 bg-neutral-950/60 flex items-center gap-2">
        <button
          @click="shareNative"
          class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg transition"
        >
          <Share2 class="w-4 h-4" />
          <span>{{ t('share.shareNative') }}</span>
        </button>

        <button
          @click="downloadImage"
          class="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 transition"
          :title="t('share.download')"
        >
          <Download class="w-4 h-4" />
        </button>

        <button
          @click="copyToClipboard"
          class="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 transition"
          :title="isCopied ? t('share.copied') : 'Copy Image'"
        >
          <component :is="isCopied ? Check : Copy" :class="['w-4 h-4', isCopied ? 'text-emerald-400' : '']" />
        </button>
      </div>
    </div>
  </div>
</template>
