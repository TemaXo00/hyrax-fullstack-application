/// <reference types='vitest' />
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import * as path from 'path';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/client-progress',
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
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: 'src/index.ts',
      name: '@org/client-progress',
      fileName: 'index',
      formats: ['es' as const],
    },
    rolldownOptions: {
      external: [
        '@org/api-client',
        '@org/client-composables',
        '@org/client-core',
        '@org/client-ui',
        '@org/types',
        'pinia',
        'vue',
      ],
    },
  },
}));
