# Codex rules (token-efficient)
- Read only files you need. Use rg to find things; never read whole dirs, lockfiles, plan/games/ncert, or *.png.
- Specs: plan/PHASES.md, plan/SPEC_SUMMARY.md, plan/vs-design/DESIGN_SPEC.md, plan/vs-design/VIBE_TELLS.md. Open only the section you need.
- Stack: npm workspaces. apps/web = Vite+React+TS, apps/api = Fastify+SQLite+Drizzle. Tests: vitest, Playwright e2e.
- Font: Patrick Hand only. Brand: #041D3D #193E69 #28517C #517DAB #F9F6EE #D6E2E6. No AI images.
- Keep edits minimal and scoped; don't reformat untouched code. No long explanations in replies, just list changed files.
- Verify with: npm run typecheck and npx vitest run (only the affected package). Full e2e only when asked.
