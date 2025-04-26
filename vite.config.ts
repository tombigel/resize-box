/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // Define base dynamically based on environment variable for GitHub Pages
  base: process.env.GITHUB_PAGES ? '/resize-box/' : '/',
  plugins: [],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'build', // Output directory for the demo app
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    open: '/', // Automatically open the demo page
  },
});
