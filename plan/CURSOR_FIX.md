Fix only, no redesign. Two Playwright e2e tests fail after the v2 landing/auth redesign:
1) e2e/phase1.spec.ts:50 "public routes have titles, no overflow, and no axe violations" - axe violations (likely colour contrast, link names, image alt, landmarks) on the new Landing/SignIn/RegisterSchool. Fix the markup/CSS in apps/web (keep the look; tweak contrast minimally).
2) e2e/phase2.spec.ts:40 "wizard invites a teacher..." times out on locator.getAttribute - probably a selector/label changed in the redesigned auth or register forms. Make the app keep the old accessible names/attributes; only edit the test if the flow is unchanged and the selector is just stale.
Do not touch apps/api or packages. Run `npx playwright test` until all pass, and `npm run typecheck`.
Then save fresh 1280px full-page screenshots to e2e/screenshots/v2-landing.png, v2-signin.png, v2-register.png (dev server, then stop it).
