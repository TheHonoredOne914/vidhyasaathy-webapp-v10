# Atom route integration fix

- Restored `/student/games/atom` in the integrated application router. The missing route fell through to the student access-denied screen even for an authenticated student.
- Kept the student role guard and mounted the existing lazy-loaded game outside the workspace shell for its full-screen layout. No game, account permissions or data changed.
- Verified real Aarav PIN sign-in followed by direct game navigation in Playwright: Enter the atom appeared; no browser exceptions.
- Web typecheck passed. Atom unit tests passed: 5 files, 24 tests (`--configLoader native --pool forks`).
