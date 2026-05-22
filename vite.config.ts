import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    cssCodeSplit: true,
    // Increase chunk size warning limit since we're splitting properly
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app-[hash].js',
        chunkFileNames: 'assets/chunk-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Manual chunk splitting: separate heavy vendor libraries
        manualChunks: (id) => {
          // Firebase: heaviest dependency, split per service
          if (id.includes('firebase/firestore')) return 'vendor-firebase-firestore';
          if (id.includes('firebase/auth')) return 'vendor-firebase-auth';
          if (id.includes('firebase/app-check')) return 'vendor-firebase-appcheck';
          if (id.includes('firebase')) return 'vendor-firebase-core';

          // Recharts: data visualization (large, only needed on analytics pages)
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-')) return 'vendor-charts';

          // Framer Motion: animation library
          if (id.includes('framer-motion')) return 'vendor-motion';

          // React core
          if (id.includes('react-dom')) return 'vendor-react-dom';
          if (id.includes('react-router-dom') || id.includes('react-router')) return 'vendor-router';
          if (id.includes('react')) return 'vendor-react';

          // Other node_modules
          if (id.includes('node_modules')) return 'vendor-misc';
        },
      },
    },
  },
  esbuild: {
    legalComments: 'none',
    // Drop console and debugger in production
    drop: ['debugger'],
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  root: path.resolve(__dirname, './')
});
