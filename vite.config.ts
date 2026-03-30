import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Leer versión del package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './src/shared'),
      '@services': resolve(__dirname, './src/services'),
      '@context': resolve(__dirname, './src/core/context'),
      '@types': resolve(__dirname, './src/types'),
      '@utils': resolve(__dirname, './src/utils'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@pages': resolve(__dirname, './src/pages'),
      '@components': resolve(__dirname, './src/shared/components'),
      '@features': resolve(__dirname, './src/features'),
      '@core': resolve(__dirname, './src/core'),
    },
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
  },
  server: {
    port: 3004,
    open: true,
    hmr: {
      host: 'localhost',
      port: 3004,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // React core — cached long-term, rarely changes
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          // Firebase — large SDK, cached separately
          if (id.includes('node_modules/firebase/') || id.includes('node_modules/@firebase/')) {
            return 'vendor-firebase';
          }
          // PDF.js — heavy, only used in OCR/docs
          if (id.includes('node_modules/pdfjs-dist/')) {
            return 'vendor-pdfjs';
          }
          // Lucide icons — tree-shaken but still significant
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['oldversion'],
  },
});
