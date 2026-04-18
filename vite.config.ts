/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/coi-serviceworker/coi-serviceworker.min.js',
          dest: '.',
        },
      ],
    }),
  ],
  assetsInclude: ['obj', 'ppm'],
  base: '/rayb-tracer/',
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  test: {
    root: './src',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: '../coverage',
      include: ['lib/**/*.ts', 'tools/**/*.ts'],
    },
  },
});
