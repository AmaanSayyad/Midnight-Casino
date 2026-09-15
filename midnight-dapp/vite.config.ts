import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const compactRuntimeRoot = path.dirname(
  require.resolve('@midnight-ntwrk/compact-runtime/package.json'),
);
const compactJsRoot = path.dirname(
  require.resolve('@midnight-ntwrk/compact-js/package.json'),
);

export default defineConfig({
  cacheDir: './.vite',
  envDir: '.',
  build: {
    target: 'esnext',
    minify: false,
    commonjsOptions: {
      transformMixedEsModules: true,
      extensions: ['.js', '.cjs'],
      ignoreDynamicRequires: true,
    },
  },
  plugins: [
    react(),
    wasm(),
    topLevelAwait({
      promiseExportName: '__tla',
      promiseImportName: (i) => `__tla_${i}`,
    }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      supported: { 'top-level-await': true },
      platform: 'browser',
      format: 'esm',
      loader: { '.wasm': 'binary' },
    },
    // Force a single prebundle so Compact TypeId Symbol() stays consistent
    include: [
      '@midnight-ntwrk/compact-runtime',
      '@midnight-ntwrk/compact-js',
      '@midnight-ntwrk/midnight-js-contracts',
      '@midnight-ntwrk/midnight-js-protocol',
    ],
    exclude: [
      '@midnight-ntwrk/onchain-runtime-v3',
      '@midnight-ntwrk/onchain-runtime-v3/midnight_onchain_runtime_wasm_bg.wasm',
      '@midnight-ntwrk/onchain-runtime-v3/midnight_onchain_runtime_wasm.js',
    ],
  },
  resolve: {
    // Critical: compact-js uses Symbol() (not Symbol.for) for CompiledContract context.
    // Duplicate module instances → undefined context → "Cannot read properties of undefined (reading 'ctor')"
    dedupe: [
      '@midnight-ntwrk/compact-runtime',
      '@midnight-ntwrk/compact-js',
      '@midnight-ntwrk/midnight-js-protocol',
      '@midnight-ntwrk/midnight-js-contracts',
      'effect',
    ],
    alias: {
      '@midnight-casino/contract': path.resolve(__dirname, '../midnight-contract'),
      '@midnight-ntwrk/compact-runtime': compactRuntimeRoot,
      '@midnight-ntwrk/compact-js': compactJsRoot,
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.wasm'],
    mainFields: ['browser', 'module', 'main'],
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
});
