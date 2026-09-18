import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import https from 'node:https'
import crypto from 'node:crypto'

const legacyTlsAgent = new https.Agent({
  rejectUnauthorized: false,
  secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT
})

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'UdaraMY — Malaysia Air Quality & Haze Tracker',
        short_name: 'UdaraMY',
        description: 'Track real-time Air Pollutant Index (API/IPU) across 68 Malaysian stations with health advisories and maps.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
      }
    })
  ],
  server: {
    proxy: {
      '/api/apims': {
        target: 'https://eqms.doe.gov.my',
        changeOrigin: true,
        secure: false,
        agent: legacyTlsAgent,
        rewrite: () => '/api3/publicportalapims/apitablehourly',
        headers: {
          'Referer': 'https://eqms.doe.gov.my/APIMS/main',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) UdaraMY/1.0'
        }
      },
      '/api3': {
        target: 'https://eqms.doe.gov.my',
        changeOrigin: true,
        secure: false,
        agent: legacyTlsAgent,
        headers: {
          'Referer': 'https://eqms.doe.gov.my/APIMS/main',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) UdaraMY/1.0'
        }
      },
      '/asmc': {
        target: 'https://asmc.asean.org',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/asmc/, ''),
        headers: {
          'Referer': 'https://asmc.asean.org/home/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) UdaraMY/1.0'
        }
      },
      '/openaq': {
        target: 'https://api.openaq.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/openaq/, '/v3'),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) UdaraMY/1.0'
        }
      }
    }
  },
  preview: {
    proxy: {
      '/api3': {
        target: 'https://eqms.doe.gov.my',
        changeOrigin: true,
        secure: false,
        agent: legacyTlsAgent,
        headers: {
          'Referer': 'https://eqms.doe.gov.my/APIMS/main',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) UdaraMY/1.0'
        }
      },
      '/asmc': {
        target: 'https://asmc.asean.org',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/asmc/, ''),
        headers: {
          'Referer': 'https://asmc.asean.org/home/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) UdaraMY/1.0'
        }
      },
      '/openaq': {
        target: 'https://api.openaq.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/openaq/, '/v3'),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) UdaraMY/1.0'
        }
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'pinia', 'vue-i18n'],
          'vendor-map': ['leaflet'],
          'vendor-icons': ['lucide-vue-next']
        }
      }
    }
  }
})
