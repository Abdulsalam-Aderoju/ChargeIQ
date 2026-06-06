import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_TARGET = 'https://61pt3nzcl0.execute-api.us-east-1.amazonaws.com';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/prod'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
