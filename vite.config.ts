import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost', // or '0.0.0.0' for LAN access
    port: 3000,         // change this if you want a different port
    open: true,         // auto-open in browser on start (optional)
  },
  // You can remove this unless you specifically want to exclude `lucide-react`
  // optimizeDeps: {
  //   exclude: ['lucide-react'],
  // },
});
