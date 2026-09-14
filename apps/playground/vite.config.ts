import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' || process.env.CI === 'true' ? '/aurora-rte/' : './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000
  }
});
