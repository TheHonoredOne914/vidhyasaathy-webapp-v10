# VidhyaSaathy — Full App Test Report & Tweak List

> Generated: 1 Nov 2026 · Build: `atom-kz` @ `bd16524` · 10 parallel test agents + live browser verification
> Method: every agent tested code + live API (positive AND negative probes) against the Product Master File rules. Demo school was seeded; all four roles exercised end-to-end.

---

## Overall Verdict

| Area | Verdict |
|---|---|
| Security / permission matrix | ✅ **STRONG PASS** — 26 negative probes, 0 leaks (answer keys, cross-role, cross-tenant, parent→chats all rejected server-side) |
| Quiz engine (scoring, ladder, Error DNA, mastery) | ✅ Solid — server-scored, confidence + time logged, ladder live-verified, 13/13 unit tests green |
| Sessions, streaks, catch-up, bridge paths | ✅ Solid — idempotent, resume-safe, honest failure language |
| Student UI (home, subjects, lessons, flashcards) | ✅ Wired & beautiful |
| Next-Action routing | 🔴 **BROKEN** — app's most important card dead-ends (S1) |
| Games & motivation | 🟡 Half-built — 5 engines exist, but key routes/screens dead, Boss Level missing |
| Teacher world | 🟡 Good bones — heatmap matrix, reteach push, session preview missing |
| Parent world | 🟡 Data ready, graphs/report missing |
| Admin world | 🟡 Works until claim codes; approvals/permission-matrix/demo-reset missing |
| AI companion | 🟡 Honest stub (no key configured) — band depth, Hindi, streaming missing |
| i18n (Hindi) | 🔴 0 Hindi strings — language switch is a placebo |
| PWA / offline READ | 🔴 SW caches 3 files only — airplane-mode fails; offline WRITE (outbox) works |

**Counts: 62 ✅ works · 24 🔴 broken/high · 30 ⬜ missing vs Master File · ~35 polish tweaks**

---

## S1 — Fix First (app visibly broken for users)

| # | Issue | Where | Fix |
|---|---|---|---|
| 1 | **Next-Action "Continue" → AccessDenied.** API emits hrefs the router doesn't have: `/student/concepts/:id`, `/student/homework/:id`, `/student/catchup`, `/student/warmup`, `/student/challenge`, `/student/dushman` | `apps/api/src/daily/service.ts:250,265,273,308,333,337,338,377,394,508` vs `apps/web/src/App.tsx:141-157` | Emit routes that exist (`/student/chapters/:chapterId/concepts/:cid`, `/student/assignments/:id`) + add screens for catchup/warmup/challenge/dushman (or render inline on HomeDesk) |
| 2 | **Roster import + activation codes 503** (`CLAIM_CODES_NOT_CONFIGURED`) on live instance — `CLAIM_CODE_ENCRYPTION_KEY` was missing from env. *(FIXED in preview during this test run — key added to `apps/api/.env`; ensure it's set in every deployment)* | `apps/api/src/school/claims.ts:17-20`, `roster.ts:42` | Keep key in env; also move `requireKey()` after CSV parsing so bad CSVs aren't masked by 503 |
| 3 | **Session window 18:00–08:00 not enforced server-side** — product law, zero code. `windowOpen` hardcoded true | `apps/api/src/daily/service.ts:243,252,274,280,297` | Implement the window check with server time + "unlocks at 6 pm" card state |
| 4 | **Home advertises future sessions → tap gives 403.** `tonightSession` treats later-today release as available | `daily/service.ts:173` vs `content/access.ts:46-51` | Align availability or show "Unlocks at 18:00" state |
| 5 | **Daily challenge can brick the day**: 0-item pool still persists a `served` row → all-day 400/409 | `daily/service.ts:583-601`, `core/daily-challenge.ts:62-67` | Don't persist empty rows; backfill from unfiltered pool |
| 6 | **Diagnostic skip → Band-1 instead of Band-2** (dead fallback branch) | `packages/core/learning.ts:124-133` | Reorder so all-skip → level 2 |
| 7 | **Demo seed releases session at 18:00 server-UTC** (23:30 IST) — flagship Motion session invisible most of the demo day. *(FIXED in preview: live row released + `demo.ts:219` patched)* | `apps/api/src/db/demo.ts:219-222` | Ship the seed fix (already patched in working tree — commit it) |

## S2 — Broken / Law Violations

1. **Confidence buttons missing on homework worksheet + one game path** — server silently defaults `'unsure'` → corrupts Error DNA (law: confidence on EVERY question). `apps/web/src/student/notebook/screens/polish3b/Worksheet.tsx:65`, `apps/web/src/games/engine/progress.ts:53-56`, `apps/api/src/assessment/service.ts:139`
2. **Dushman re-skin is fake** — `?concept=&skin=dushman` params never read by `PracticePlay.tsx`; queue keeps mastered L4 concepts active (retire check only runs on new evidence). `apps/api/src/daily/service.ts:669-705`
3. **Warm-up can't complete** — `POST /student/warmup/:id/complete` called by no screen. Match-the-Concept has **0 playable items** in seed (131 mcq / 26 flashcard / 12 short_answer, no match_pairs).
4. **Content publishing leaks across sections of the same class** — chapter create checks assignment without sectionId; note publish notifies every section. `content/access.ts:22-28`, `content.ts:154-161`
5. **Boss Level + Streak Challenge games missing**; 70% gate unverifiable; `boss_buster` badge never awardable.
6. **i18n placebo** — SettingsPage writes localStorage nobody reads; student settings admits "not available yet". 0 Hindi strings in the app.
7. **SW caches 3 files** — no app-shell precache, no offline read. Outbox (write path) is genuinely good.
8. **`/student/games` dead link** in AtomForgeVideo ("Back to games"). → `/student?panel=games`
9. **Rate limits keyed by IP behind proxy** — `trustProxy:false` makes 120/min a global budget (self-DoS risk on real deployment). `app.ts:56,116`
10. **Ladder transitions not append-only** (upserted in place); difficulty tag drift 1–5 vs L1–L3.

## ⬜ Missing vs Master File (build needed, not tweaks)

| Group | Missing |
|---|---|
| Auth | Forgot-password flow (all roles); DOB in student activation; parent-link OTP→approval queue + revocation; staff-ID on invites; global logout (all devices) |
| Teacher | Student×concept heatmap matrix; one-tap reteach push to struggling subset; "3 reddest cells" + ONE suggested action on morning dashboard; session builder student preview; quiz auto-selection; question-bank filters (concept/difficulty/format); close-window on sessions |
| Parent | Weekly graphs (effort bars, mastery trend, streak health, readiness lamp); "Ask This" grounded card; printable report. (API `/parents/children/:id/home` already returns the data — orphaned, no screen consumes it) |
| Admin | Approvals queue UI, Permission Matrix page, Demo Reset script, standalone People page |
| AI | Band-depth answers (chapterBands table exists, unused by /ask); EN/HI/Hinglish handling (Hinglish queries wrongly return "not in your notes" — Hindi stopwords sink coverage); SSE streaming; 11-step sequence is ~6 steps; `not_configured` status never emitted though UI handles it |
| Content | Chapter summary one-pager PDF; Rapid Revision mode; YouTube player + watch-engagement logging (data contract works, zero UI, zero seeded videos); teacher note form missing type/timestamps; key-term highlighting; school-notes band variants (schema has single body) |
| Platform | Hindi parity; data-saver mode; "synced late" outbox flag; install prompt; dynamic `<html lang>`; Scholar-Indigo tokens (366 hardcoded hex, two competing token systems); per-game evidence source; server-side game deadline |

## 🧹 Cleanup (test residue in demo DB)

QA schools "QA Test Public School" ×2, "QA9 Security Probe School" + admin `qa9-admin@probe.test`; teacher-created notes "QA7 probe" (draft) and "QA7 probe: motion video" (published); chapter "Intruder"; announcement "QA4 test announcement"; reteach decision `8efe8baa`. No delete endpoints — needs SQL cleanup or demo reseed.

## ✅ What Is Genuinely Great (keep & build on)

- **Security posture**: every negative probe rejected; uploads sandboxed; audit log complete; append-only evidence trail; unit-tested lockout/claims races.
- **Honest-gap pattern**: instead of fake data, the app says "isn't available yet" — exactly the Master File tone.
- **Session/streak/bridge mechanics**: idempotent, resume-safe, server-authoritative, shame-free copy.
- **Offline outbox**: real IndexedDB, dedupe, backoff, server-echo validation.
- **No-leaderboard law**: enforced by a regex test; only positive framing found.
