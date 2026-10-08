import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the bundle loads from the Capacitor WebView.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@workspace/api-client-react': path.resolve(import.meta.dirname, 'src/data/api.ts'),
      '@': path.resolve(import.meta.dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: Number(process.env.PORT) || 5173,
    host: '0.0.0.0',
  },
});
