import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.pessoal.controlecartao',
  appName: 'Controle do Cartão',
  webDir: 'dist',
  android: {
    backgroundColor: '#f5f1e7',
  },
  plugins: {
    SystemBars: {
      // Injects --safe-area-inset-* so the page can pad around the system bars.
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
      // Dark icons on the app's light background.
      style: 'LIGHT',
    },
  },
};

export default config;
