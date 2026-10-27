# Web

Vite, React, and Tailwind for the VidhyaSaathy school shell. Run it from the repo root so the API proxy and session cookie stay on one origin.

```powershell
Copy-Item apps/web/.env.example apps/web/.env
npm run dev -w apps/web
```

`VITE_API_URL` is the same-origin prefix `/api`. The dev server forwards that prefix to `VITE_API_PROXY_TARGET` and strips `/api`. It does not rewrite the browser `Origin` header. Requests use `credentials: 'include'`.

Playwright starts the API and this app itself when `E2E_BASE_URL` is unset. Set `E2E_BASE_URL` only when both servers are already running, and set `E2E_DATABASE_PATH` to that API's SQLite file so the claim-code fixture can be inserted. There is no claim-issuance route in this phase.

The mark, favicon, apple touch icon, and OG image are drawn from the Midnight and Ivory palette. The previous landing app was not in this workspace, so those files were not copied from it.

## Dependencies

| Package | Why |
| --- | --- |
| `react`, `react-dom` | UI |
| `react-router-dom` | Routes |
| `@vidhyasaathy/contracts` | Shared request and response schemas |
| `zod` | Client-side parsing of those schemas |
| `@fontsource-variable/manrope` | Self-hosted Manrope, no font CDN |
| `vite`, `@vitejs/plugin-react` | Dev server and build |
| `tailwindcss`, `@tailwindcss/vite` | Styling from `src/ui/tokens.css` |
| `@types/react`, `@types/react-dom` | Component types |
| `@axe-core/playwright` | Used by `e2e/` to check each route |
