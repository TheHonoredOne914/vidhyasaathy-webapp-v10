# VidhyaSaathy: Technical Requirements Document

Team draft v1 | 13 October 2026 | Vikrant University Junior Hackathon 2026

Status key: **FIXED** = decided in this document. **ASSUMED** = depends on something we have not verified. **OPEN** = needs a team decision.

## 1. Purpose and scope

VidhyaSaathy is an online workspace for each school class. Students study at home through teacher-published notes, self-study sessions, quizzes and games. Teachers see, through a simple interface, which students and which concepts need help. This document defines the technology, architecture and requirements to build it.

**In scope:** Android student app, Windows teacher app, shared backend, content and game engine, AI doubt resolver, data analytics, sync for weak networks.

**Out of scope:** computer vision, live video classes, AR/VR, voice learning, multi-language UI, public leaderboards.

**Core loop the whole system must support:** teacher publishes a lesson, student studies and is checked, the system detects the missed concept, the student gets a targeted plan, the teacher sees the class-level gap.

## 2. Functional requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| F1 | School, class, section, teacher and student structure with claim-code onboarding (students claim accounts, not create them) | Must |
| F2 | Teacher publishes notes, self-study sessions (one idea per slide) and quizzes per chapter | Must |
| F3 | Slides unlock sequentially; a session is complete only after its check | Must |
| F4 | Every item is tagged to a concept (learning objective); concepts have prerequisites | Must |
| F5 | Micro-remediation: a failed concept unlocks a short lesson plus a 2-question check before continuing | Must |
| F6 | Interleaved practice: 2 new items to 1 review item from earlier weeks | Should |
| F7 | Five game formats plus interactive simulations, all consuming the same item schema | Should |
| F8 | AI doubt resolver that answers only from teacher material, gives hints before answers, and cites the source note | Must |
| F9 | Teacher dashboard: completion, concept-gap view, misconception patterns, doubt batching | Must |
| F10 | Parent actionable alerts (push or WhatsApp) naming the concept and linking to help | Could |
| F11 | Shared-device profile switching with per-student isolation | Should |
| F12 | Focus mode: navigation locked during a practice set, exit interstitial | Should |
| F13 | Streaks reward correct concept practice, never logins or time spent | Should |
| F14 | Offline use: cached chapters, queued answers, background sync | Must |

## 3. Non-functional requirements (targets)

| Area | Target |
| --- | --- |
| Reference device | Redmi 9A / Moto G Power class: 2GB RAM, 32GB storage, spotty 4G |
| Android APK | Under 15MB base install (App Bundle); media and chapter bundles downloaded on demand |
| Cold start | Under 3 seconds on the reference device |
| Animation | 60fps for core interactions, 30fps acceptable for decorative effects |
| Data use | Text and SVG first; video defaults to 360p and loads only on tap |
| Offline | Previously synced chapters, quizzes and games fully usable offline; answers queue and sync later |
| Never blank | Any screen shows cached data with an "updated at" stamp if the network fails |
| Accessibility | WCAG AA contrast, large tap targets |
| Windows | Windows 10 or newer (ASSUMED; verify the pilot school's PCs) |
| Availability | 99% for the pilot; no multi-region requirement |

## 4. Architecture

**Principle: thin clients, one shared contract, heavy work on the server.**

| Layer | Choice | Status |
| --- | --- | --- |
| Shared core | Kotlin Multiplatform: domain models, API client, sync engine, game rules, simulation math | FIXED |
| Android student app | Kotlin + Jetpack Compose, minSdk 24 | FIXED |
| Windows teacher app | Compose Multiplatform Desktop | FIXED, see risk R2 |
| Local database | SQLDelight (SQLite), shared by both clients | FIXED |
| Backend API | Ktor (Kotlin) | FIXED |
| Primary database | PostgreSQL with pgvector | FIXED |
| Job queue | Redis-backed queue, or a Postgres-based queue to reduce infrastructure | OPEN |
| Object storage and CDN | Cloudflare R2 | FIXED |
| AI | Hosted LLM behind our own interface | FIXED |
| Push | Firebase Cloud Messaging | FIXED |
| Parent messaging | WhatsApp Cloud API through a business solution provider | Roadmap; mocked in the demo |
| Analytics workers | Python (pandas, scikit-learn) via the job queue | Later phase |

**Why Kotlin end to end:** it is the lightest option on a 2GB phone that still supports rich animation, and sharing models, sync logic and game rules across Android, Windows and the server removes a whole class of integration bugs.

**Flow:** Client (Android or Windows) talks to the Ktor API over HTTPS. The API reads and writes Postgres, enqueues jobs (AI drafts, notifications, aggregation), and hands out signed URLs for chapter bundles stored on R2.

## 5. Android student app

* **UI:** Jetpack Compose with a single-activity navigation graph. Focus mode disables back navigation inside a practice set and shows the "you are 80% done" interstitial on exit.
* **Local data:** Room-style tables via SQLDelight, keyed by profile\_id so several students can share one phone. Each profile has its own PIN or avatar unlock and its own token; tokens are never shared across profiles.
* **Sync:** WorkManager triggers the shared sync engine when connectivity returns.
* **Images:** Coil, SVG for diagrams, no heavy PNGs.
* **Push:** FCM for homework reminders and teacher nudges.
* **Build hygiene:** R8 shrinking, App Bundle, Baseline Profiles for cold start, strict dependency policy (every new library needs a size justification).
* **Timers:** use a monotonic clock and keep timer state isolated so a countdown does not recompose the whole screen.
* **Limit:** Android does not let a normal app block other apps. Focus mode locks our own navigation and logs when the app is backgrounded. It is not enforcement.

## 6. Windows teacher app

* Compose Multiplatform Desktop sharing the Kotlin core and SQLDelight cache.
* Screens: class roster and claim-code import (CSV), content publishing, session and quiz builder, class concept-gap view, doubt batches, student drill-down.
* Works offline for preparing content, and syncs on reconnect.
* Installer size is roughly 60 to 100MB and RAM use is higher than a Tauri or web app (see R2).
* A browser-based teacher dashboard against the same API is the fallback for school PCs that cannot run the desktop app. The API is client-agnostic, so this costs no backend work.

## 7. Backend (Ktor)

* REST API described by an OpenAPI spec; DTOs are the shared Kotlin models.
* Modules: auth and claim codes, school structure, content, sessions and quizzes, attempts and sync, concepts and prerequisites, AI, analytics, notifications.
* **Auth:** school-issued claim code, then a per-profile token. Parent accounts link to a verified child. Role-based access: a parent can read only their own child, a teacher only their assigned classes.
* **Remediation logic:** a recursive query over concept\_prereq finds the earliest weak prerequisite when a student fails a concept.
* **Jobs:** AI session and quiz drafts from uploaded notes (teacher approves before publish), review scheduling, notification sends, materialized view refresh.

## 8. Data model (core tables)

| Table | Key fields |
| --- | --- |
| school, class, section | structure and ownership |
| user, profile, claim\_code | roles, shared-device profiles, one-time claim codes |
| subject, chapter, concept | learning objectives |
| concept\_prereq | concept\_id, prereq\_id |
| note, session, slide | teacher content, sequential slides |
| item | type (mcq, match\_pairs, short\_answer, flashcard), concept\_id, difficulty, options, source\_ref |
| attempt | client\_event\_id (unique), profile\_id, item\_id, concept\_id, correct, chosen\_option, time\_ms, client\_ts, server\_ts |
| student\_concept\_state | profile\_id, concept\_id, Leitner box, next\_review, attempt count |
| doubt | profile\_id, question, answer, source\_note\_id, concept\_id |
| note\_chunk | text and vector embedding for retrieval |

## 9. Sync design

* **Outbox pattern:** the client writes every attempt locally with a unique client\_event\_id and queues it. The server inserts idempotently, so retries never double-count.
* **Differential pull:** each table has a cursor. The client sends its last cursor and the server returns only what changed (new items, updated scores).
* **Ordering:** store client timestamp and server receipt time. Late and out-of-order events are expected.
* **Retry:** exponential backoff with jitter. Failed calls never produce a blank screen.
* **Risk:** custom sync is the highest-risk component. PowerSync is the buy option if it consumes too much time.

## 10. Content, games and simulations

**One contract for everything.** Games never carry their own questions. They consume items and emit attempts.

* **Chapter bundle:** one compressed JSON per chapter (items, concepts, slides, simulation config) plus SVG assets, fetched once and cached.
* **GameModule interface:** id, acceptedItemTypes, start(items, config), onAnswer(), result(). Game rules live in a pure Kotlin module with no UI code, so they are unit-testable and shared.
* **Output:** every game emits the same Attempt event (item, concept, correct, time). Remediation, streaks, interleaving and teacher analytics all read from it.

| Game format | Presentation tool |
| --- | --- |
| Timed concept challenge, MCQ rush, quick revision quiz | Compose animation APIs, graphicsLayer |
| Match the concept | Compose drag and snap animation |
| Chapter progress challenge | Compose, with unlock sequences |
| Interactive simulations (for example Class 10 light and lenses: drag the object, the ray diagram updates) | Compose Canvas driven by a pure-Kotlin physics or optics model, configured per chapter |
| Mascot and reaction animation | Rive (.riv) state machines, driven by correct or wrong inputs |
| Real sprite or physics game (only if needed later) | libGDX module |

**Avoid** Unity and Godot (APK size and RAM cost on a 2GB device) and heavy Lottie (CPU cost on weak phones).

**Design rules:** animate feedback on understanding (a correct match, a concept unlocking). Do not attach reward animations to speed or time spent, which contradicts the product principle of intent over entertainment. Animated assets live in chapter bundles, not in the APK.

**For teammates prebuilding games:** build against the item JSON schema and the GameModule contract first. Games built with hardcoded questions will need rewriting.

## 11. AI requirements

* **Doubt resolver:** retrieval over the class's own notes (pgvector). The system prompt forces hint-first answers and a visible source citation. If no relevant note is found, it says so rather than answering from general knowledge.
* **Draft generation:** AI drafts a session and quiz from an uploaded note. The teacher must approve before publishing. No AI content reaches students unreviewed.
* **Study plan:** built from concept state and prerequisites, linking to teacher material.
* **Model interface:** one internal interface so the hosted model can change without touching clients.
* **Guardrails:** AI chats are private to the student and not visible to parents. Log prompts and sources for debugging, with minimal retention.
* **Cost control:** cache answers by note and question, rate-limit per profile.

## 12. Data analytics

Analytics is a layer on the same Postgres, not a separate data platform.

| Analytic | Method |
| --- | --- |
| Concept mastery per student | Recency-weighted accuracy from attempt; Bayesian Knowledge Tracing later |
| Class concept-gap view | Materialized view grouped by class, concept and day, refreshed on a schedule |
| Misconception patterns | Count of wrong-option picks per MCQ; no ML needed |
| Parent actionables | Query over recent attempts feeding the notification template |
| Remediation effectiveness | Pass rate on the second attempt after a micro-lesson (the doc's success metric) |
| Product analytics | PostHog (anonymised) for funnels and retention |
| At-risk prediction | Later: logistic regression in a Python worker |

* **Capture:** one append-only event table with idempotent inserts.
* **Scale path:** ClickHouse or DuckDB fed from Postgres only when queries slow down. The event schema does not change.
* **Internal dashboards:** Metabase or Superset on a read replica.
* **Rules:** headline metrics are concept pass rates, not time spent. Teachers see a confidence indicator or a minimum attempt count, never a bare percentage from a handful of attempts. Prediction is descriptive-first, because a new class has no history.

## 13. Security and privacy

* All traffic over TLS. Tokens stored in Android Keystore and the Windows credential store.
* Role-based access enforced on the server; parents see only their own child.
* Data minimisation: collect only what the learning loop needs.
* Children's data: India's DPDP Act 2023 requires verifiable parental consent for children's data and restricts behavioural tracking of children, with some exemptions for educational institutions. Have a qualified person review consent flow and retention before the pilot. We are not giving legal advice here.
* Product analytics anonymised; no device-level tracking of students.
* Backups of Postgres daily; retention policy defined before pilot.

## 14. Performance and testing

* Real-device testing on a Redmi 9A-class phone; emulators misreport GPU performance.
* Macrobenchmark in CI for cold start and scroll; Firebase Test Lab on low-end devices.
* Compose recomposition counts and the Android Studio profiler for animations.
* APK size gate in CI at 15MB.
* Unit tests for game rules, remediation logic and sync conflict cases.
* Throttled-network tests (slow 4G, offline, flapping connection) on every release candidate.

## 15. Delivery phases

| Phase | Deliverable |
| --- | --- |
| 0 | Item JSON schema, concept and prerequisite spreadsheet for one chapter, API contract. Unblocks teammates building games. |
| 1 | Backend core, claim codes, content publishing, attempts, sync. Android loop: session, quiz, concept flag, plan. |
| 2 | Teacher app: concept-gap view, roster import. AI doubt resolver. |
| 3 | Five game formats, one simulation, Rive reactions. Interleaving and streaks. |
| 4 | Analytics views, parent alerts, hardening and device testing. |

The hackathon demo must show Phase 0 to 2 working end to end on one chapter. Anything beyond that is shown as roadmap, not claimed as built.

## 16. Risks

| ID | Risk | Mitigation |
| --- | --- | --- |
| R1 | Team Kotlin skill: if only one or two people know Kotlin and Compose, the plan slips | Confirm skills now; fallback is a TypeScript backend with shared JSON schema, losing only shared models |
| R2 | Compose Desktop is a JVM app: larger installer, more RAM, no Windows 7/8 support | Verify pilot school PCs; ship a browser dashboard in parallel if needed |
| R3 | Custom sync is complex | Keep to outbox plus cursors; consider PowerSync |
| R4 | Concept tagging quality caps every analytic and the remediation loop | Hand-tag one chapter first; teacher review of tags |
| R5 | Animation art needs a designer | Compose-only animation is the fallback and covers all five games |
| R6 | Focus mode cannot block other apps | Position it as in-app navigation lock plus backgrounding log |
| R7 | WhatsApp needs Meta template approval, business verification and per-message cost | Mock for the demo; use FCM first |
| R8 | Timed and streak games can contradict intent over entertainment | Tie rewards to correct answers on needed concepts |
| R9 | Retrieval quality: wrong citations break trust in the AI | Evaluate on a real chapter before building UI |
| R10 | Children's data compliance | Legal review before pilot; data minimisation |

## 17. Open decisions

1. Job queue: Redis or Postgres-based.
2. Windows: desktop app, browser dashboard, or both.
3. Sync: build custom or adopt PowerSync.
4. Hosting region and provider for Ktor and Postgres.
5. Who owns art and animation.
6. Minimum attempts before a concept is flagged weak (links to product decision #4).
7. Class insights show student names or counts only (product decision #6).
8. Pilot school and its device and PC inventory.
