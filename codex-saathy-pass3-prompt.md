# Saathy pass 3 (finish it, do not stop early)
Branch saathy-model in this folder. Ganita Manjari retrieval (b8beab6) and the Saathy chat (de36163) are done; open auth is merged, so any PIN logs in.
Read codex-saathy-pass2-prompt.md and codex-saathy-model-prompt.md for full context and rules, then finish ONLY what is left, working through all of it before you stop:
1. Rich artifact cards in the Saathy chat (explanation, worked example, diagram/notes cards, quick-check card) styled in the notebook look, ported from C:\Users\jce\dhruv-model where possible.
2. Hint ladder (nudge, then hint, then worked step) on Saathy questions.
3. Level Check: the gate and UI, ported from dhruv-model, results saved to concept mastery in the DB.
4. Start the app on ports 3201/5273 only (Node 24 is on PATH, own DATABASE_PATH copy), log in as student Aarav (any PIN), run the full browser flow with Playwright, and save screenshots to docs/saathy-model/screens/.
Do not run the root typecheck (it stalls); run the api and web typechecks separately and `npx vitest run --pool forks` on the touched tests. Commit after each item and push saathy-model. Update docs/saathy-model/README.md. Rules: notebook look, no emoji, no sound, never show ranks/bands to students. Do not stop to report partial progress; finish all 4 items.


## RESUME NOTE
A previous run of this prompt was cut off mid-way (network drop). Run git status and git diff first, keep the uncommitted work that is good, and continue from where it stopped. Do not redo finished work.

