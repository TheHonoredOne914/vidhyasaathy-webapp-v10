# ENGINE brief: shared InteractiveVideo game engine (run first)
Do not run npm, npx, or any install/test/build commands. Edit files only. Keep TypeScript strict and the existing lint style. Read plan/AGENT_RULES.md, plan/DESIGN_SPEC.md, plan/vs-design/VIBE_TELLS.md and plan/games/SYLLABUS_MAP.md first.

## Goal
Each game is an "interactive video": an animated scene sequence narrated by text from the Saathy cloud mascot. It plays like a video, but pauses at checkpoints where the student has to act (drag, tap, predict, set a slider, order items). Paying attention is rewarded. A wrong answer plays a short reteach replay, then a retry.

## Files (new: apps/web/src/games/engine/)
- types.ts: GameDef {id, title, chapterRef, conceptIds[], scenes: Scene[]}. Scene {id, durationMs, narration: string[], render: (t:number, state) => ReactNode (SVG), checkpoint?: Checkpoint}. Checkpoint kinds: 'tap' | 'drag' | 'predict' (MCQ BEFORE the reveal) | 'slider' (target range) | 'order' | 'numeric'. Each has a prompt, a validate() function, a reteach: {sceneId|narration[], hint}, and a conceptId.
- InteractiveVideo.tsx: the player. Uses requestAnimationFrame on a timeline, with play/pause, a scrubber that only goes back through watched scenes, chapter dots, and replay of the last 10 seconds. Auto-pauses at a checkpoint, and the "Continue" button is disabled until the checkpoint is solved. Respects prefers-reduced-motion with step-through mode and no autoplay animations.
- Saathy.tsx: a hand-drawn SVG cloud with moods (talk, think, cheer, oops) and a speech-bubble narration typewriter. Tap to skip the typing.
- rewards.ts and RewardLayer.tsx: stars (3 for first try, 2 after a hint, 1 after reteach), an attention streak (consecutive first-try checkpoints), sparkles at correct answers (SVG, <= 600ms), and unlocking the next scene. Also "Focus check" pop-ins: once or twice per game, a tiny tap target appears on screen for 4s during playback ("Tap the electron that just jumped!"). Catching it gives a bonus star; missing it costs nothing. Every 3rd scene is a no-reward scene.
- recap.ts: retrieval practice. The end of the game has a 3-question recap drawn from checkpoints the student got wrong or slowly. Store missed conceptIds in localStorage `vs.games.recap`. The next time any game opens, show 1 spaced-recap question from items more than 1 day old before the intro (skippable).
- progress.ts: posts each checkpoint result to the existing learning-evidence/practice API. First find the existing client in apps/web/src (search for "evidence" / "practice" / "attempt") and reuse it; never invent endpoints. Payload: conceptId, correct, attempts, hintUsed, ms, source:'game:<id>'. Offline: queue using the existing offline sync helper if one exists, otherwise localStorage.
- theme.css: the game surface is dark. Background is Midnight #041D3D with a subtle radial gradient to Deep #193E69. Lines and UI use Cool #517DAB, text uses Ice #D6E2E6, and highlights/correct use peach #FFD9C2. The only font is Patrick Hand. SVG strokes are hand-drawn: slightly uneven paths, stroke-linecap round, no glossy gradients, no glow blobs, no emoji, no AI images. Minimum contrast is AA. Tap targets >= 44px.
- registry.ts: lazy imports for each game folder (apps/web/src/games/<name>/index.ts exporting GameDef). Hook it into the existing games route/page (find the current games list that has Atom Workshop 3D, Reflection Lab, Bio Quest and Tinker). New engine games appear as cards. Leave the old games in place unless a game brief says to replace one.

## Research-backed rules the engine enforces
1. Prediction before reveal: 'predict' checkpoints lock in an answer before the animation shows the outcome (generation effect, predict-observe-explain).
2. Immediate, specific feedback: say why, not just "wrong".
3. Retrieval practice and spaced recap (recap.ts above).
4. Segmenting: each scene is <= 45s, and the learner controls the pace (Mayer's segmenting principle).
5. Signalling: highlight the thing being narrated.
6. Keep text short (<= 2 lines per bubble). Avoid redundant text on the animation.
7. Interleave 1 question from an earlier concept inside each game.
8. No timers on checkpoints (stress hurts learning), except optional Focus checks.

## Acceptance
- The engine renders a demo GameDef (apps/web/src/games/engine/demo.ts) with each checkpoint kind.
- Keyboard accessible: Space for play/pause and arrows for the slider. Checkpoints have ARIA labels.
- Unit tests in apps/web/src/games/engine/__tests__ (vitest) for rewards and recap scheduling. Write the tests but do not run them.
- Commit message: "games: interactive video engine" (git add only the files you touched).
