# Phase 3 shell/workspace — HARD UX (from v8 screen recording)

Landing + theme tokens IMMUTABLE. Only in-app from sign-in.

## Must fix and screenshot-verify (student/teacher shell)

1. **Student home**
   - Welcome banner: real height/padding; cloud graphic not clipped/squished.
   - Stat cards: values vertically+horizontally centered (not stuck top-left); never show empty dash for mastery — real value or honest empty state.
   - Remove big empty "Continue learning" void; show real continue card or empty-state copy.
   - Replace broken "Read a story / Try it" pill toggle with a proper segmented control (aria, keyboard, pressed state).

2. **My subjects**
   - Fix "Could not load this chapter" API error.
   - Error states must **replace** skeletons (never overlap).

3. **Study sessions**
   - Fix "request could not be completed".
   - Mathematics (and subject) cards: not cramped — padding, min-height, readable title.

4. **Notifications**
   - Fix API error.
   - Error box not glued to banner — spacing/layout.

5. **Settings**
   - Header size proportional (not oversized).
   - Time inputs: label/value not tiny top-left; readable layout.
   - Same broken toggle → segmented control / proper switch.

6. **Privacy**
   - Body paragraphs max-width ~65ch.
   - Side nav spacing from content (not cramped).

## After shell, BEFORE phase 4 — GAMES (critical)

All 10 games must be a true "interactive video":
- Continuous animated SVG scene
- Narrator step that pauses and asks the child to act
- Working drag/tap (pointer events, touch-safe)
- Immediate animated reaction to every action (right/wrong)
- No raw i18n keys in UI/toasts (e.g. no `CAR.RAW - DEN.CEPT 9T0 9`)
- Fix Atom Forge: particles must drag on click/drag
- Fix Maximum update depth render loop
- Playwright: for each game, one drag/tap interaction + screenshots

## Also fix (phase 2 leftover visible in p12 shots)
- `apps/web/src/rosterPreview.ts` still expects 2-col CSV; API expects `name,rollNumber,phone`. Align preview with API.