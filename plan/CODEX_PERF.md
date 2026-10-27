PERFORMANCE pass for apps/web (Vite+React). Goal: app feels instant.
You may edit ONLY: apps/web/src/App.tsx, apps/web/src/main.tsx, apps/web/vite.config.ts, apps/web/index.html, and add apps/web/src/ui/RouteFallback.tsx. Do NOT edit routes/*, landing/*, auth/*, apps/api, packages, e2e.
Do:
- Route-level code splitting: React.lazy + Suspense for every route except Landing and SignIn; light branded fallback (navy bg, no spinner flash under 200ms).
- vite build: manualChunks for react/vendor, target es2020, cssCodeSplit, no sourcemaps in prod.
- index.html: preload the Plus Jakarta Sans woff2 used above the fold, preconnect not needed (self-hosted), theme-color meta, set font-display swap.
- Prefetch the sign-in chunk on idle from Landing via a small helper exported from App.tsx (no edit to Landing needed; use requestIdleCallback in main.tsx).
Keep all routes/paths and behaviour identical. At the end print a short summary of changes. You cannot run npm; I will build and test.
