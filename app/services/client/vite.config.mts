import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(() => ({
  root: import.meta.dirname,
  resolve: {
    conditions: ['@org/source'],
  },
  cacheDir: '../../node_modules/.vite/services/client',
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['../../vitest.setup.ts'],
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
      },
    },
  },
  preview: {
    port: 4173,
    host: 'localhost',
  },
  plugins: [vue(), tailwindcss()],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
