import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App, prefetchSignIn } from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element is missing.');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (window.location.pathname === '/') {
  const prefetch = () => {
    if (window.location.pathname === '/') {
      void prefetchSignIn().catch(() => undefined);
    }
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(prefetch, { timeout: 2000 });
  } else {
    globalThis.setTimeout(prefetch, 2000);
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}
