import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // Use jsdom to simulate browser environment
    // setupFiles: './tests/setup.ts', // Optional: Path to setup file if needed
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'], // Where to find tests
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
    },
  },
  // Add resolve alias for Vitest
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
