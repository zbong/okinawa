import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Okinawa Trip 2026',
        short_name: 'Okinawa',
        description: '오키나와 가족 여행 가이드',
        theme_color: '#ffffff',
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
          }
        ],
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            // Google Maps Tiles Caching
            urlPattern: /^https:\/\/mt0\.google\.com\/vt\/lyrs=m/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-maps-tiles',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1년 보관
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Pretendard Font Caching
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/gh\/orioncactus\/pretendard/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'web-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1년 보관
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Exchange Rate API (Network First, fallback to Offline Cache)
            urlPattern: /^https:\/\/open\.er-api\.com\/v6\/latest\/JPY/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'exchange-rate',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 // 24시간 보관
              },
              networkTimeoutSeconds: 3
            }
          }
        ]
      }
    })
  ],
})
