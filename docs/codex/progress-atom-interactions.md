# Atom Forge interaction review — 2026-11-01

## Changes
- Preserve the approved scene artwork, palette, geometry and camera paths.
- Fix the purple iris covering the scene with reduced motion enabled.
- Use elapsed time for zoom holds and cutscenes so slow rendering does not stall progress; cancel holds and orbit gestures on blur/cancel.
- Add deliberate Continue/recap actions instead of automatically skipping the payoff.
- Give neutron controls tap, keyboard and drag paths, clear feedback and bounds. Orbiting no longer accidentally removes neutrons.
- Sort the actual transferred card, reset selection on replay, disable incomplete quiz submission, and resume timeline playback correctly.
- Make pinned particles, selection and keyboard focus apparent; remove inactive caption buttons.
- Fix Back to games to use the existing `/student?panel=games` screen.

## Verification
- Root typecheck passed; focused Atom tests: 6 files, 28 tests passed. Final complete web unit suite: 37 files, 130 tests passed. Browser spec discovery and `git diff --check` passed.
- Both intro browser checks passed before the interaction changes (normal and reduced motion).
- Added an opt-in real-demo browser regression covering all six beats, mouse/touch/keyboard, invalid answers, replay and exit. No database reset or mock answers.
- The first extended browser run exposed the slow-rendering hold bug, now fixed and unit-tested. Final browser rerun remains blocked: the local Vite process crashed with Windows exit code 3221226505 and background restart was denied by the tool policy. Asked the user to restart the server. Do not claim the extended browser suite passed.

## Resume browser verification
With the existing demo services running, set `E2E_BASE_URL=http://127.0.0.1:5173` and run `npx playwright test e2e/atom-demo.spec.ts --workers=1`. It signs in as the existing Aarav demo student; preserve the database.

## Live mechanics follow-up — 2026-11-01
- Preserve the approved artwork, geometry, palette and camera framing. Enable turning/tapping from the opening scene, not just after its cutscene.
- Add damped nucleus recoil, gentle idle bobbing, particle/electron arrival easing, and unstable-nucleus wobble. Changing counts has an immediate visible consequence.
- Let students test an incorrect nucleus and retry. Carbon-13 correctly settles as stable; it does not explode merely because the task asks for carbon-12. Instability is an illustrative wobble, not a simulated decay timescale.
- Full shells visibly repel the attempted electron; the correct outer shell accepts it. Sorting gives rejection motion, placed-card feedback and live group counts. Builder changes update particles and readouts immediately.
- Respect reduced motion, with an explicit Animate atom / Reduce motion control. Restore local regressions in keyboard controls, drag payloads, count bounds, pinned labels and incomplete quiz submission; preserve the pre-edit file in `%TEMP%/vs-atom-before-live-motion-20261101.tsx`.
- Root typecheck and final web typecheck passed. Web unit suite: 37 files / 133 tests passed, including recoil, rejection trajectory and stable carbon-13 checks. Browser verification pending below.
- Final root typecheck and complete web suite passed again (37 files / 133 tests). `git diff --check` passed.
- Fixed this machine's missing client API configuration with an ignored `apps/web/.env.local` (`VITE_API_URL=/api`, existing API origin on port 3001). No database changes or service replacement.
- Browser: normal-motion intro, motion toggle and exit passed against the real API. Full reduced-motion six-beat verification remains incomplete: software-rendering delays exposed driver-command timing and an auto-finished cutscene detaching Your turn. Hardened those test races without removing phase assertions; do not claim the complete browser flow passed.
- Preserve keyboard focus while restarting sorting rejection animation; no card-list remounts.
