<script setup>
import { computed } from 'vue';

const props = defineProps({
  state: {
    type: String,
    required: true
  },
  flagClass: {
    type: String,
    default: 'w-6 h-4'
  }
});

// Normalize state names to standard keys
const stateKey = computed(() => {
  const s = (props.state || '').toLowerCase().trim();
  if (s.includes('kuala lumpur') || s === 'kl') return 'kuala_lumpur';
  if (s.includes('putrajaya')) return 'putrajaya';
  if (s.includes('labuan')) return 'labuan';
  if (s.includes('johor')) return 'johor';
  if (s.includes('kedah')) return 'kedah';
  if (s.includes('kelantan')) return 'kelantan';
  if (s.includes('melaka') || s.includes('malacca')) return 'melaka';
  if (s.includes('sembilan')) return 'negeri_sembilan';
  if (s.includes('pahang')) return 'pahang';
  if (s.includes('perak')) return 'perak';
  if (s.includes('perlis')) return 'perlis';
  if (s.includes('pinang') || s.includes('penang')) return 'penang';
  if (s.includes('sabah')) return 'sabah';
  if (s.includes('sarawak')) return 'sarawak';
  if (s.includes('selangor')) return 'selangor';
  if (s.includes('terengganu')) return 'terengganu';
  return 'malaysia';
});
</script>

<template>
  <span :class="['inline-block overflow-hidden rounded-[3px] border border-black/15 shadow-sm shrink-0 select-none align-middle', props.flagClass]">
    <!-- 1. Johor -->
    <svg v-if="stateKey === 'johor'" viewBox="0 0 60 40" class="w-full h-full">
      <rect width="60" height="40" fill="#001489" />
      <rect width="30" height="20" fill="#DA291C" />
      <circle cx="15" cy="10" r="6" fill="#ffffff" />
      <circle cx="17" cy="10" r="5" fill="#DA291C" />
      <polygon points="17,6 18,9 21,9 18.5,11 19.5,14 17,12 14.5,14 15.5,11 13,9 16,9" fill="#ffffff" />
    </svg>

    <!-- 2. Kedah -->
    <svg v-else-if="stateKey === 'kedah'" viewBox="0 0 60 40" class="w-full h-full">
      <rect width="60" height="40" fill="#DA291C" />
      <circle cx="18" cy="16" r="10" fill="#007A3D" />
      <circle cx="20" cy="15" r="8" fill="#DA291C" />
      <circle cx="16" cy="16" r="5" fill="#FFCD00" />
    </svg>

    <!-- 3. Kelantan -->
    <svg v-else-if="stateKey === 'kelantan'" viewBox="0 0 60 40" class="w-full h-full">
      <rect width="60" height="40" fill="#DA291C" />
      <circle cx="30" cy="20" r="11" fill="#ffffff" />
      <circle cx="33" cy="20" r="9" fill="#DA291C" />
      <polygon points="32,15 33,18 36,18 33.5,20 34.5,23 32,21 29.5,23 30.5,20 28,18 31,18" fill="#ffffff" />
    </svg>

    <!-- 4. Melaka -->
    <svg v-else-if="stateKey === 'melaka'" viewBox="0 0 60 40" class="w-full h-full">
      <rect width="60" height="20" fill="#DA291C" />
      <rect y="20" width="60" height="20" fill="#ffffff" />
      <rect width="30" height="20" fill="#001489" />
      <circle cx="14" cy="10" r="6" fill="#FFCD00" />
      <circle cx="16" cy="10" r="5" fill="#001489" />
      <polygon points="17,6 18,9 21,9 18.5,11 19.5,14 17,12 14.5,14 15.5,11 13,9 16,9" fill="#FFCD00" />
    </svg>

    <!-- 5. Negeri Sembilan -->
    <svg v-else-if="stateKey === 'negeri_sembilan'" viewBox="0 0 60 40" class="w-full h-full">
      <rect width="60" height="40" fill="#FFCD00" />
      <polygon points="0,0 30,0 0,20" fill="#DA291C" />
      <polygon points="30,0 30,20 0,20" fill="#000000" />
    </svg>

    <!-- 6. Pahang -->
    <svg v-else-if="stateKey === 'pahang'" viewBox="0 0 60 40" class="w-full h-full">
      <rect width="60" height="20" fill="#ffffff" />
      <rect y="20" width="60" height="20" fill="#000000" />
    </svg>

    <!-- 7. Perak -->
    <svg v-else-if="stateKey === 'perak'" viewBox="0 0 60 40" class="w-full h-full">
      <rect width="60" height="13.33" fill="#ffffff" />
      <rect y="13.33" width="60" height="13.34" fill="#FFCD00" />
      <rect y="26.67" width="60" height="13.33" fill="#000000" />
    </svg>

    <!-- 8. Perlis -->
    <svg v-else-if="stateKey === 'perlis'" viewBox="0 0 60 40" class="w-full h-full">
      <rect width="60" height="20" fill="#FFCD00" />
      <rect y="20" width="60" height="20" fill="#001489" />
    </svg>

    <!-- 9. Pulau Pinang -->
    <svg v-else-if="stateKey === 'penang'" viewBox="0 0 60 40" class="w-full h-full">
      <rect width="20" height="40" fill="#0072CE" />
      <rect x="20" width="20" height="40" fill="#ffffff" />
      <rect x="40" width="20" height="40" fill="#FFCD00" />
      <!-- Stylized Pinang Palm -->
      <path d="M30 14 C27 12 25 16 27 18 C28 15 30 16 30 25 L30 27 L31 27 L31 25 C31 16 33 15 34 18 C36 16 34 12 31 14" fill="#007A3D" />
      <path d="M26 27 C28 26 33 26 35 27" stroke="#0072CE" stroke-width="1" fill="none" />
    </svg>

    <!-- 10. Sabah -->
    <svg v-else-if="stateKey === 'sabah'" viewBox="0 0 60 40" class="w-full h-full">
      <rect width="60" height="13.33" fill="#69B3E7" />
      <rect y="13.33" width="60" height="13.34" fill="#ffffff" />
      <rect y="26.67" width="60" height="13.33" fill="#DA291C" />
      <rect width="30" height="20" fill="#00205B" />
      <!-- Silhouette of Mt Kinabalu -->
      <polygon points="4,20 12,12 18,14 24,7 28,20" fill="#0072CE" />
    </svg>

    <!-- 11. Sarawak -->
    <svg v-else-if="stateKey === 'sarawak'" viewBox="0 0 60 40" class="w-full h-full">
      <rect width="60" height="40" fill="#FFCD00" />
      <!-- Diagonal stripes -->
      <polygon points="0,0 60,40 40,40 0,13.33" fill="#DA291C" />
      <polygon points="0,0 60,40 60,26.67 20,0" fill="#000000" />
      <!-- Star -->
      <circle cx="28" cy="20" r="5" fill="#FFCD00" />
    </svg>

    <!-- 12. Selangor -->
    <svg v-else-if="stateKey === 'selangor'" viewBox="0 0 60 40" class="w-full h-full">
      <rect width="30" height="20" fill="#DA291C" />
      <rect x="30" width="30" height="20" fill="#FFCD00" />
      <rect y="20" width="30" height="20" fill="#FFCD00" />
      <rect x="30" y="20" width="30" height="20" fill="#DA291C" />
      <!-- Crescent & 5-point star in top-left -->
      <circle cx="14" cy="10" r="6" fill="#FFCD00" />
      <circle cx="16" cy="10" r="5" fill="#DA291C" />
      <polygon points="17,6 18,9 21,9 18.5,11 19.5,14 17,12 14.5,14 15.5,11 13,9 16,9" fill="#FFCD00" />
    </svg>

    <!-- 13. Terengganu -->
    <svg v-else-if="stateKey === 'terengganu'" viewBox="0 0 60 40" class="w-full h-full">
      <rect width="60" height="40" fill="#ffffff" />
      <rect x="6" y="5" width="48" height="30" fill="#000000" />
      <circle cx="28" cy="20" r="7" fill="#ffffff" />
      <circle cx="30" cy="20" r="6" fill="#000000" />
      <polygon points="33,16 34,19 37,19 34.5,21 35.5,24 33,22 30.5,24 31.5,21 29,19 32,19" fill="#ffffff" />
    </svg>

    <!-- 14. WP Kuala Lumpur -->
    <svg v-else-if="stateKey === 'kuala_lumpur'" viewBox="0 0 60 40" class="w-full h-full">
      <rect width="60" height="40" fill="#001489" />
      <rect y="8" width="60" height="6" fill="#DA291C" />
      <rect y="14" width="60" height="12" fill="#ffffff" />
      <rect y="26" width="60" height="6" fill="#DA291C" />
      <circle cx="30" cy="20" r="5" fill="#FFCD00" />
      <circle cx="31.5" cy="20" r="4.2" fill="#ffffff" />
      <circle cx="34" cy="20" r="2" fill="#FFCD00" />
    </svg>

    <!-- 15. WP Labuan -->
    <svg v-else-if="stateKey === 'labuan'" viewBox="0 0 60 40" class="w-full h-full">
      <rect width="60" height="13.33" fill="#001489" />
      <rect y="13.33" width="60" height="13.34" fill="#ffffff" />
      <rect y="26.67" width="60" height="13.33" fill="#DA291C" />
      <circle cx="30" cy="20" r="5" fill="#FFCD00" />
      <circle cx="31.5" cy="20" r="4.2" fill="#ffffff" />
      <circle cx="34" cy="20" r="2" fill="#FFCD00" />
    </svg>

    <!-- 16. WP Putrajaya -->
    <svg v-else-if="stateKey === 'putrajaya'" viewBox="0 0 60 40" class="w-full h-full">
      <rect width="18" height="40" fill="#001489" />
      <rect x="18" width="24" height="40" fill="#FFCD00" />
      <rect x="42" width="18" height="40" fill="#001489" />
      <circle cx="30" cy="20" r="6" fill="#DA291C" />
    </svg>

    <!-- Default: Malaysia National Flag (Jalur Gemilang) -->
    <svg v-else viewBox="0 0 60 40" class="w-full h-full">
      <rect width="60" height="40" fill="#ffffff" />
      <rect y="0" width="60" height="2.85" fill="#DA291C" />
      <rect y="5.7" width="60" height="2.85" fill="#DA291C" />
      <rect y="11.4" width="60" height="2.85" fill="#DA291C" />
      <rect y="17.1" width="60" height="2.85" fill="#DA291C" />
      <rect y="22.8" width="60" height="2.85" fill="#DA291C" />
      <rect y="28.5" width="60" height="2.85" fill="#DA291C" />
      <rect y="34.2" width="60" height="2.85" fill="#DA291C" />
      <rect width="30" height="22.8" fill="#001489" />
      <circle cx="13" cy="11.4" r="6.5" fill="#FFCD00" />
      <circle cx="15" cy="11.4" r="5.5" fill="#001489" />
      <polygon points="16,8 17,10 19,10 17.5,12 18.5,14 16,13 13.5,14 14.5,12 13,10 15,10" fill="#FFCD00" />
    </svg>
  </span>
</template>
