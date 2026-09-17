<script setup>
import { computed, ref } from 'vue';
import { 
  GraduationCap, 
  AlertTriangle, 
  FileText, 
  Share2, 
  Check, 
  MessageSquare,
  ShieldCheck
} from 'lucide-vue-next';
import { CIVIC_DATA } from '../data/civicBulletins.js';

const props = defineProps({
  api: {
    type: Number,
    required: true
  },
  stationName: {
    type: String,
    default: 'Current Station'
  }
});

const isCopied = ref(false);

const civicStatus = computed(() => {
  const val = props.api;
  if (val > 200) {
    return {
      level: 'danger',
      badge: 'MOE CIRCULAR 1/2019 TRIGGERED',
      badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      title: 'Mandatory School Closures & Online Learning (PdPR) Activated',
      desc: 'Under MOE Circular Bil. 1/2019, physical classes are immediately suspended when local API exceeds 200. Outdoor activities are strictly prohibited.',
      actionText: 'School Closure Active',
      icon: AlertTriangle,
      borderClass: 'border-rose-500/30 bg-rose-500/5'
    };
  } else if (val > 100) {
    return {
      level: 'warning',
      badge: 'MOE CIRCULAR 1/2019 ACTIVE',
      badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      title: 'Outdoor Physical Activities & Assemblies Suspended',
      desc: 'Under MOE Circular Bil. 1/2019, all outdoor sports and physical education must halt when API exceeds 100. MOH advises vulnerable individuals to wear N95 respirators.',
      actionText: 'Outdoor Sports Suspended',
      icon: GraduationCap,
      borderClass: 'border-amber-500/30 bg-amber-500/5'
    };
  } else if (val > 50) {
    return {
      level: 'moderate',
      badge: 'STANDARD SCHOOL OPERATIONS',
      badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      title: 'Normal Classes & Outdoor Activities Permitted',
      desc: 'Air quality is within acceptable bounds. Sensitive groups with pre-existing asthma or respiratory conditions should remain observant.',
      actionText: 'Normal Routine',
      icon: ShieldCheck,
      borderClass: 'border-cyan-500/20 bg-cyan-500/5'
    };
  } else {
    return {
      level: 'good',
      badge: 'EXCELLENT AIR QUALITY',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      title: 'Ideal for All Outdoor Sports & Recreation',
      desc: 'Air quality index is clean and safe for all school events and recreational activities nationwide.',
      actionText: 'All Clear',
      icon: ShieldCheck,
      borderClass: 'border-emerald-500/20 bg-emerald-500/5'
    };
  }
});

const whatsappShareText = computed(() => {
  const url = window.location.href;
  return `🌫️ *UdaraMY Air Quality Alert: ${props.stationName}*\n📊 Current API: *${props.api}* (${civicStatus.value.actionText})\n🏫 *Official Guidance:* ${civicStatus.value.title}\n📄 Read official MOE Circular & MOH advisory:\n${url}`;
});

function shareToWhatsApp() {
  const text = encodeURIComponent(whatsappShareText.value);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${text}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}

function copyAlert() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(whatsappShareText.value).then(() => {
      isCopied.value = true;
      setTimeout(() => {
        isCopied.value = false;
      }, 2500);
    });
  }
}
</script>

<template>
  <div 
    :class="[
      'rounded-2xl border p-4 sm:p-4.5 transition-all duration-300 space-y-2.5',
      civicStatus.borderClass
    ]"
  >
    <div class="flex items-center justify-between gap-2 flex-wrap">
      <div class="flex items-center gap-2">
        <component :is="civicStatus.icon" class="w-4 h-4 text-slate-700 dark:text-slate-200 shrink-0" />
        <span 
          :class="[
            'text-[10px] font-bold font-mono tracking-wider px-2 py-0.5 rounded-full border',
            civicStatus.badgeClass
          ]"
        >
          {{ civicStatus.badge }}
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <!-- 1-Tap WhatsApp Share -->
        <button
          @click="shareToWhatsApp"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold transition shadow-sm cursor-pointer"
          title="Share official status alert directly to WhatsApp"
        >
          <MessageSquare class="w-3.5 h-3.5" />
          <span>WhatsApp Alert</span>
        </button>

        <!-- Copy Alert Text -->
        <button
          @click="copyAlert"
          class="p-1 rounded-lg bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          :title="isCopied ? 'Copied to clipboard!' : 'Copy formatted alert'"
        >
          <Check v-if="isCopied" class="w-3.5 h-3.5 text-emerald-500" />
          <Share2 v-else class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Directive Title & Description -->
    <div>
      <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
        {{ civicStatus.title }}
      </h4>
      <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
        {{ civicStatus.desc }}
      </p>
    </div>

    <!-- Official PDF Citation Link -->
    <div class="pt-1.5 flex items-center justify-between text-xs font-mono border-t border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-400">
      <span>Authority: MOE & MOH Malaysia</span>
      <a
        :href="CIVIC_DATA.directives[0].url"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-cyan-400 hover:underline"
      >
        <FileText class="w-3 h-3" />
        <span>View MOE Circular 1/2019 PDF ↗</span>
      </a>
    </div>
  </div>
</template>
