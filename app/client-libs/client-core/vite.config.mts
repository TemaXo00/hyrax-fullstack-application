/// <reference types='vitest' />
import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';
import * as path from 'path';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/client-core',
  plugins: [
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
      name: '@org/client-core',
      fileName: 'index',
      formats: ['es' as const],
    },
    rolldownOptions: {
      external: ['@org/types'],
    },
  },
}));
