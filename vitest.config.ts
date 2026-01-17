import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Timeouts for tests that might hang
    testTimeout: 10000,
    hookTimeout: 10000,
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      // Base alias
      '@': resolve(__dirname, './src'),
      // Core module (services de infraestructura)
      '@core': resolve(__dirname, './src/core'),
      // Shared UI system
      '@shared': resolve(__dirname, './src/shared'),
      // Services (prioriza core, luego legacy)
      '@services': resolve(__dirname, './src/services'),
      // Context
      '@context': resolve(__dirname, './src/context'),
      // Types
      '@types': resolve(__dirname, './src/types'),
      // Utils
      '@utils': resolve(__dirname, './src/utils'),
      // Hooks
      '@hooks': resolve(__dirname, './src/hooks'),
      // Pages
      '@pages': resolve(__dirname, './src/pages'),
      // Components
      '@components': resolve(__dirname, './src/components'),
      // Features
      '@features': resolve(__dirname, './src/features'),
    },
  },
});
