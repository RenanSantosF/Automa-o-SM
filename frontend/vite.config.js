import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Dellmar Docs',
        short_name: 'Dellmar',
        start_url: '/',
        display: 'standalone',
        background_color: '#333333',
        theme_color: '#333333',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },

      workbox: {
        // *** CORREÇÃO IMPORTANTE ***
        // Aumenta limite para permitir precache de bundle maior
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB

        // Suporte para SPA
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,

        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 dias
              },
            },
          },
        ],
      },
    }),
  ],

  server: {
    host: '0.0.0.0', // permite acesso externo
    port: 5173,      // porta padrão
  },
})
