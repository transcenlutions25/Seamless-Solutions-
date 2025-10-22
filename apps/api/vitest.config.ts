import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
  resolve: {
    alias: {
      '@seamless/types': path.resolve(__dirname, '../../packages/types/src'),
      '@seamless/config': path.resolve(__dirname, '../../packages/config/src'),
      '@seamless/utils': path.resolve(__dirname, '../../packages/utils/src'),
    },
  },
});
