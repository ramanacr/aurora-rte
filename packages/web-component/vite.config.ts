import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'AuroraRte',
      fileName: () => 'aurora-editor.min.js',
      formats: ['iife']
    },
    outDir: './dist/bundle',
    emptyOutDir: false,
    minify: true
  }
});
