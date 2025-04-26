import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts'; // Plugin to generate declaration files

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true, // Generate a single types entry point
      outDir: 'dist/types',
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ResizeBox', // Global variable name in UMD build
      formats: ['es', 'umd', 'cjs'],
      fileName: (format) => `resize-box.${format}.js`,
    },
    rollupOptions: {
      // Make sure to externalize dependencies that shouldn't be bundled
      // into your library (e.g., React, Vue)
      external: [],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {},
        exports: 'named',
      },
    },
    cssCodeSplit: true,
  },
});
