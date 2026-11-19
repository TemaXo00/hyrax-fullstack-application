/// <reference types='vitest' />
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import * as path from 'path';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/client-pages',
  publicDir: path.join(import.meta.dirname, '../../services/client/public'),
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(import.meta.dirname, 'tsconfig.lib.json'),
    }),
  ],
  resolve: {
    conditions: ['@org/source'],
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['../../vitest.setup.ts'],
  },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    copyPublicDir: false,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: 'src/index.ts',
      name: '@org/client-pages',
      fileName: 'index',
      formats: ['es' as const],
    },
    rolldownOptions: {
      external: [
        '@org/api-client',
        '@org/client-composables',
        '@org/client-core',
        '@org/client-pet',
        '@org/client-progress',
        '@org/client-shop',
        '@org/client-ui',
        '@org/types',
        'pinia',
        'vue',
        'vue-router',
      ],
    },
  },
}));
