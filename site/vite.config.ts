import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte()],
  base: './',
  // Every demo runs against the library's own source.
  resolve: { alias: { tipsy: fileURLToPath(new URL('../src/index.ts', import.meta.url)) } },
});
