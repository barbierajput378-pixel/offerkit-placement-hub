import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Replit-only plugin — guarded by REPL_ID so it is safely ignored locally.
// We import it lazily to avoid crashing when the package is absent.
let runtimeErrorOverlay: () => any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  runtimeErrorOverlay = require('@replit/vite-plugin-runtime-error-modal').default;
} catch {
  runtimeErrorOverlay = () => ({ name: 'noop-runtime-error-modal' });
}

// PORT defaults to 5173 (Vite's standard dev port) when not set.
const port = Number(process.env.PORT ?? '5173');

// BASE_PATH defaults to '/' — required by Vite's `base` option.
const basePath = process.env.BASE_PATH ?? '/';

// API server port — the Express backend runs here in dev; Vite proxies /api to it.
const apiPort = Number(process.env.API_PORT ?? '3001');

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    // Replit cartographer and dev-banner: only load when running on Replit.
    ...(process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({ root: path.resolve(import.meta.dirname, '..') }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) => m.devBanner()),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: { strict: true },
    // Proxy /api calls to the Express backend so the frontend never hits CORS in dev.
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
