import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

// Vite only auto-loads .env into `import.meta.env` for app code — this
// config file itself still needs to load it manually into process.env
// before reading PORT/BASE_PATH/etc. below. loadEnv() is built into Vite,
// so this needs no extra dependency. '' as the third arg loads every key
// in the file, not just VITE_-prefixed ones (those still also get exposed
// to the client separately, as normal).
const fileEnv = loadEnv(process.env.NODE_ENV ?? 'development', import.meta.dirname, '');
for (const [key, value] of Object.entries(fileEnv)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(import.meta.dirname, 'attached_assets'),
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
    fs: {
      strict: true,
    },
    // In local/dev setups the frontend and API run as two separate
    // processes on two different ports. Proxy same-origin "/api" calls to
    // the API server so the app's relative-URL API client (see
    // src/lib/api.ts) works without extra config. In production, set
    // API_PROXY_TARGET to your deployed API's URL, or put both behind a
    // shared reverse proxy/router instead.
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
