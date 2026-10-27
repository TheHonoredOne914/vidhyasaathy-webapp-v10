# Rules for both agents (read before every task)
Scope
- Build only what the phase lists. Never write copy for features that aren't built. Label NEXT items only where shown, never as live.
- Stay inside your track's directories. Need a contract change? Stop and report it; don't edit the other track's files.
Visual
- Use only the tokens in apps/web/src/ui/tokens. Palette: Midnight #041D3D, #193E69, #28517C, #517DAB, Ivory #F9F6EE, Ice #D6E2E6. Light theme by default. Font is Manrope.
- No gradients, glassmorphism, glows, blobs, orbs, particles, dot/grid backgrounds, neon, gradient text, "New" pills, stacked shadows (one subtle shadow level max), or low-opacity white borders.
- Radii are 6-10px. Section spacing follows the scale, varied on purpose. No bento or 3x2 card grids by default.
- Icons: a small custom SVG set used only where it aids meaning. No emoji icons and no icon on every card. No stock photos; use the real logo/mascot assets.
- Body text 16px minimum. Headings sized in proportion.
Motion
- At most 1-2 purposeful transitions (feedback on a correct answer, concept unlock). No fade-up on scroll, hover scale, typewriter, sliding arrows, marquees, cursor glow, or smooth-scroll hijack. Honour prefers-reduced-motion. Animations run once.
Copy
- Plain, specific language. Banned words: supercharge, unlock the power, seamless, effortless, revolutionary, built for the future, "get started in seconds". Keep em dashes rare. No rhyming or triplet headlines.
- No fake stats, testimonials, logos, people, placeholder names or lorem ipsum. Test fixtures stay in tests only. The demo seed is marked "Demo school".
- Footer year comes from the current date. No links to pages that don't exist. Write a real privacy page from the actual data model (flag it for DPDP review).
Function
- Every button and form does something real or doesn't ship. Every search actually searches.
- Every data view has loading, empty and error states. Spinners must time out to an error. No fake delays. No toasts for trivial actions.
- Every fetch is wrapped with error handling. On network failure show cached data with an "updated at" stamp.
- Dialogs close on Escape, trap focus and return focus.
- WCAG AA contrast, full keyboard navigation, visible focus, alt text, 44px tap targets.
- No layout breaks from 360 to 1440px, including 768-1024. No horizontal scroll, no text overflow.
Security
- No secrets in frontend code. Keys (LLM, session secret) live only in apps/api .env (gitignored, .env.example committed).
- Authorization in api middleware on every route, deny by default; an api test per role rule. Sessions are httpOnly, SameSite=Lax cookies; passwords/PINs hashed with argon2.
- AI: never fabricate. Without a configured provider, show the labelled stub state.
- Validate every input with packages/contracts zod schemas on both client and server. Rate-limit auth, claim, AI and form endpoints.
- No localhost or hardcoded URLs. Use env config.
Code
- TypeScript strict. Small components, one per file. Don't duplicate variants; use props.
- No inline styles mixed with Tailwind. No commented-out code. No TODO or "add logic here" comments. No unused dependencies (run `npx depcheck`). Every new dependency needs a one-line justification in the PR.
- Every phase ships tests (Vitest unit plus a Playwright e2e for the acceptance criteria). CI runs typecheck, lint, test and e2e.
- Commits use conventional, descriptive messages, e.g. "feat(auth): add claim-code redemption with expiry". Never "fix" or "final".
- Keep the README real: setup, env vars, scripts and architecture. Set page titles and meta descriptions per route, plus OG image, favicon and a custom 404.
- Before handoff, run `npm test` plus typecheck and lint, check for console errors, and attach screenshots at 360px and 1280px.
- Windows dev: scripts must work in PowerShell (use cross-env/rimraf, no bash-only syntax).
- Stay in your owned dirs (see PHASES.md). Commit in small steps.
