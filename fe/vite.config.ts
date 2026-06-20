import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import cesium from 'vite-plugin-cesium';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cesium()
  ],
  server: {
    port: 5183,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8015',
        changeOrigin: true,
        secure: false,
      },
      '/files': {
        target: 'http://127.0.0.1:8015',
        changeOrigin: true,
        secure: false,
      },
      '/private/files': {
        target: 'http://127.0.0.1:8015',
        changeOrigin: true,
        secure: false,
      },
      '/3dtiles': {
        target: 'http://127.0.0.1:8015',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
