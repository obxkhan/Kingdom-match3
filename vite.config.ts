import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

const pwaManifest = {
  id: '/',
  name: 'TileTown — Match-3 City Builder',
  short_name: 'TileTown',
  description:
    'Match resources on a 15x15 board to construct and grow an endless 225-plot city.',
  theme_color: '#FAF7F0',
  background_color: '#F3EFE6',
  display: 'standalone' as const,
  start_url: '/',
  scope: '/',
  icons: [
    {
      src: '/pwa-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/pwa-maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
  shortcuts: [
    {
      name: 'City Map',
      short_name: 'City',
      description: 'Open your 225-plot city map',
      url: '/?page=city',
      icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
    },
    {
      name: 'Resource Harvest',
      short_name: 'Harvest',
      description: 'Jump straight to the 15x15 match board',
      url: '/?page=harvest',
      icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
    },
  ],
};

// Serves manifest.webmanifest & sw.js in dev when HMR is disabled (avoiding vite-plugin-pwa's import.meta.hot.send call)
function devPwaNoHmrPlugin(): Plugin {
  return {
    name: 'dev-pwa-no-hmr',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url === '/manifest.webmanifest') {
          res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
          res.end(JSON.stringify(pwaManifest));
          return;
        }
        if (url === '/sw.js') {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(`
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
`);
          return;
        }
        next();
      });
    },
    transformIndexHtml(html) {
      if (html.includes('rel="manifest"')) return html;
      return html.replace(
        '</head>',
        '    <link rel="manifest" href="/manifest.webmanifest" />\n  </head>'
      );
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      devPwaNoHmrPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: pwaManifest,
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          navigateFallbackDenylist: [/^\/__/],
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
