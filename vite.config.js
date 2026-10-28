import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { setupWebSocketServer } from './server/gameServer.js';

let wssStarted = false;

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'game-websocket-server',
      configureServer() {
        if (!wssStarted) {
          wssStarted = true;
          try {
            setupWebSocketServer(3001);
            console.log('O‘yin WebSocket serveri 3001-portda ishga tushdi');
          } catch (e) {
            console.warn('WSS start error:', e);
          }
        }
      }
    }
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/ice.json': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
        rewriteWsOrigin: true
      }
    }
  }
});
