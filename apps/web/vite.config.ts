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
      allowedHosts: ['terminal.local'],
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
          // The API's CSRF check wants APP_ORIGIN. Map only this dev server's own
          // origins (and explicitly listed tunnel origins) onto it; any other Origin
          // is forwarded untouched so cross-site requests stay rejected.
          const appOrigin = process.env.APP_ORIGIN || process.env.VITE_APP_ORIGIN || fileEnv.APP_ORIGIN || 'http://127.0.0.1:5173';
          const allowed = new Set([
            appOrigin,
            ...(process.env.VITE_ALLOWED_ORIGINS || fileEnv.VITE_ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean),
          ].map((value) => value.replace(/\/+$/, '')));
          proxy.on('proxyReq', (proxyReq, req) => {
            const incoming = typeof req.headers.origin === 'string' ? req.headers.origin.replace(/\/+$/, '') : '';
            const host = req.headers.host;
            const own = host ? [`http://${host}`, `https://${host}`] : [];
            if (incoming && (allowed.has(incoming) || own.includes(incoming))) proxyReq.setHeader('origin', appOrigin);
          });
        },
      },
    };
  }
  return config;
});
