import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv, defineConfig, type UserConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '');
  const proxyTarget = process.env.VITE_API_PROXY_TARGET || fileEnv.VITE_API_PROXY_TARGET;
  if (command === 'serve' && !proxyTarget) {
    throw new Error('Set VITE_API_PROXY_TARGET to the API origin.');
  }
  const config: UserConfig = {
    plugins: [react(), tailwindcss()],
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const path = id.replace(/\\/g, '/');
            if (path.endsWith('/src/routes/SignIn.tsx')) return 'signin';
            if (path.includes('commonjsHelpers')) return 'react';
            if (!path.includes('/node_modules/')) return;
            if (/\/node_modules\/(react|react-dom|scheduler)\//.test(path)) return 'react';
            return 'vendor';
          },
        },
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
    },
  };
  if (proxyTarget && config.server) {
    config.server.proxy = {
      '/api': {
        target: proxyTarget,
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/api/, '') || '/',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const origin = req.headers.origin;
            // Real browsers always send Origin on POSTs; headless drivers may not.
            // Fall back to the app origin so the API's CSRF origin check still passes.
            proxyReq.setHeader('origin', typeof origin === 'string' && origin ? origin : (process.env.VITE_APP_ORIGIN || 'http://127.0.0.1:5173'));
          });
        },
      },
    };
  }
  return config;
});
