import { defineConfig } from 'vitest/config';
import * as path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@aurora/model': path.resolve(import.meta.dirname, 'packages/model/src/index.ts'),
      '@aurora/engine-prosemirror': path.resolve(import.meta.dirname, 'packages/engine-prosemirror/src/index.ts'),
      '@aurora/editor': path.resolve(import.meta.dirname, 'packages/editor/src/index.ts'),
      '@aurora/features': path.resolve(import.meta.dirname, 'packages/features/src/index.ts'),
      '@aurora/ui': path.resolve(import.meta.dirname, 'packages/ui/src/index.ts'),
      '@aurora/extension-sdk': path.resolve(import.meta.dirname, 'packages/extension-sdk/src/index.ts'),
      '@aurora/enterprise-review': path.resolve(import.meta.dirname, 'packages/enterprise-review/src/index.ts')
    }
  },
  test: {
    exclude: ['**/dist/**', '**/node_modules/**'],
    environment: 'happy-dom',
    globals: true
  }
});
