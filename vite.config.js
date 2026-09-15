import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

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
      '/api3': {
        target: 'https://eqms.doe.gov.my',
        changeOrigin: true,
        secure: false,
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
      }
    }
  },
  preview: {
    proxy: {
      '/api3': {
        target: 'https://eqms.doe.gov.my',
        changeOrigin: true,
        secure: false,
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
      }
    }
  }
})
