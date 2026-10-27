# GAMES_TEACH — top-priority game rule (2026-10-27 Asia/Calcutta)

**Priority:** above polish. Games must TEACH the concept through play, NOT quizzes.

## Non-negotiable
1. **Living simulation, not MCQ.** Child discovers the concept by manipulating a simulation (drag electrons into shells → atom stabilises/glows; push cricket ball → see F=ma). No multiple-choice screens inside games.
2. **Continuous animation.** Idle bob/orbit/particles always ticking. Never a frozen poster.
3. **Juicy feedback.** Particles, optional sounds, combo/streak glow, smooth easing. Wrong = soft shake + reversible. Right = pulse + gold particles <100ms.
4. **4 escalating levels** per game. Short narrated beats (Saathy or text) that pause for input.
5. **Reward moment** when the concept clicks — celebration ≤800ms then Continue.
6. **QA gate:** real Playwright pointer-drag must move the object AND change a meter/state; record short screen video OR GIF of the interaction for each game. Screenshots alone are not enough.
7. Follow `plan/v9/inspo/WORKSPACE_INSPO.md` §4 (interactive video) + §0 tokens. Landing/theme locked.
8. Human copy only — never raw i18n keys. Fix Atom Forge drag + Check toast + max update depth first as the gold pattern, then apply to all 10 games.

## Anti-patterns (ban)
- Quiz/MCQ/tap-the-correct-option as the game loop
- Static SVG with dead drag targets
- "Check answer" that shows raw keys
- Levels that are just harder quiz questions

## Verify each game
- Playwright: drag/gesture that changes sim state
- Capture: short webm/mp4 OR animated GIF under e2e/screenshots/games/
- Still PNG of level 1 stage after interaction
