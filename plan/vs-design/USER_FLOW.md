# VidhyaSaathy Web App: User Flow (definitive)
Sources: TRD.md (Team draft v1, 13 Oct 2026; the authority on technical flow), Product Blueprint PDF (feature IDs, sections 05 to 09, 18, 19), the "VidhyaSaathy Backend Design" Page, DESIGN_SPEC.md and refs/01 to 07, and plan/SPEC_SUMMARY.md. On claim, PIN, sessions, roles, sync and AI, the TRD wins. Its FIXED stack items (Kotlin, Android, Postgres, R2, FCM) were overridden by the user's web-only, local-stack decision; the TRD's own fallbacks (§6 browser dashboard, R1 TypeScript backend) allow this. Anything the docs don't cover is marked NOT IN DOCS. [OPEN] means the docs list it as an open decision.
Refs: 01 landing · 02 sign-in · 03 registration · 04 student home · 05 Saathy viva · 06 student desktop shell · 07 learning profile.

## 0. Global rules (all roles)
1. After sign-in, each user lands only on their own role's home (6.6). Every list item opens a detail screen with a single back path.
2. Access is checked on the server, filtering by school, then role, then relationship. Changing a role label in the browser never grants access (5.2, SEC-01).
3. Session expiry sends the user back to sign-in with a short message. Sign-out ends the session on that device (AUTH-07).
4. Each learning screen has one primary action. Any screen has a help link (STU-12).
5. Never blank (TRD §3, §9): if the network fails, any screen shows cached data with an "updated at" stamp. Failed calls never produce a blank screen. Retries use exponential backoff with jitter.
6. Offline (TRD F14): synced chapters and quizzes stay usable. Answers are written locally with a unique client_event_id and synced later. The server inserts them idempotently, so retries never double-count. Pulls are differential, by cursor.
7. Metrics shown to anyone are concept pass rates, never time spent (TRD §12).
8. Theme: refs 01 and 02 use the navy surface, ref 03 the light surface, and the product screens the warm surface (DESIGN_SPEC 0).

## 1. Public entry: landing to sign-in or registration
1. **Landing (LAND-01), ref 01.** Purpose: the school-to-home promise. Sections in this order: hero, role use cases, learning loop, session and AI preview, how grounding works, privacy, school contact or onboarding button, sign-in link. Actions: "Sign in to your school" goes to 2; "Register a school" goes to 3. Rule: never claim proven results, partnerships or unbuilt features. Empty, error and denied states: none (static page).
2. **Sign-in (AUTH-06), ref 02, `/signin`.** Staff and parents use email or school ID plus password. Students use the PIN path (section 4.6). Next: role check, then the role home. Error on wrong credentials: NOT IN DOCS (wording). "Forgot password?" goes to recovery. Google and Microsoft buttons appear only if SSO exists; the Page adds SSO as a design choice that the PDF doesn't include. "Register a school" goes to 3.
3. **Account recovery (ONB-04).** Staff and parents get a time-limited reset link by email or phone. Students get a PIN reset approved by a parent or teacher. Recovery never reveals whether an account exists. Next: sign-in. Screen layout: NOT IN DOCS (use the ref 02 style).
4. **Accept invitation**, which leads to role-specific onboarding (6.1); see section 3.

## 2. School admin
Entry points: Landing "Register a school" (new school), or sign-in, then Admin home (SCH-10).
Features: AUTH-01, SCH-01 to 12, SCH-14, AUTH-08 (NEXT), ONB-05.

### 2a. Registration (AUTH-01), ref 03, `/register`
1. The representative enters the school name, board (CBSE, ICSE or state board), city and admin contact details.
   - Ref 03 shows "Step 1 of 4" with School Name, School Type, Board, Email and Phone, followed by "Next: Admin Information".
   - Steps 2 to 4 of registration: NOT IN DOCS (only step 1 is in the image).
2. Platform verification of the representative. Method [OPEN].
3. Error on a duplicate school name in the same city: show a warning and ask the user to confirm.
4. Denied state: an unverified representative sees a pending screen with no school data. Pending screen copy: NOT IN DOCS.
5. Success: confirmation, then the school profile is created, the representative becomes the first admin, and the setup wizard opens.
6. Prototype: a preconfigured demo school may replace registration (Section 29).

### 2b. Setup wizard (SCH-01), ref 03 card and stepper, `/setup`
The wizard runs once and can be revisited from settings. Each step saves on its own, so the admin can leave and resume. A step completes only when validation passes. Validation errors are listed before completion: missing required fields, duplicate roll numbers and invalid phones.
1. **School profile (SCH-02):** name, board, city, logo (plus address and contact). Admin only. Next: 2.
2. **Academic year (SCH-03):** start and end dates. Copying the previous year's structure is supported. Next: 3.
3. **Classes and sections (SCH-04):** for example 9-A and 9-B, plus streams. Next: 4.
4. **Subjects per class (SCH-05):** for example Physics or Maths. Linking to the board chapter structure is LES-10 (NEXT). Next: 5.
5. **Teacher assignments (SCH-06):** teacher × subject × class. Reassignment updates access immediately and keeps history. Next: 6.
6. **Student list (SCH-07):** CSV upload or manual entry.
   - Validation: duplicate rolls, missing parent numbers, wrong class names.
   - Show a preview before confirming. Who uploads is [OPEN] (Decision 3).
   - Next: 7.
7. **Parent contacts (SCH-08):** a phone number per student. A guardian may be the contact, subject to school policy [OPEN]. Error: invalid phone. Next: 8.
8. **Activation:**
   - One-time codes are generated and the distribution sheet is downloaded. Class workspaces go live.
   - Page: this is one transaction that also sends teacher invites and writes an audit event.
   - Next: Admin home.

Empty state for each step (no rows yet): NOT IN DOCS. Use DESIGN_SPEC 7: one line of text plus one navy button.

### 2c. Admin home and ongoing screens (desktop shell, ref 06 style; nav per DESIGN_SPEC 7)
1. **Admin home (SCH-10).** Shows classes, teachers, enrolment counts, activation status, parent-linking status and published resources. No rankings and no AI chats.
2. **Invitations (SCH-09).** Tracks accepted invites. Actions: resend or cancel. Expired invites are clearly marked.
3. **Parent links (SCH-08).** Shows who is linked to whom, verification status, one parent with several children, and guardians. Correcting a link requires a logged reason.
4. **Manual approval (AUTH-08, NEXT).** Approve or reject a pending student or parent, with a reason. Used when OTP fails.
5. **Content permissions (SCH-11)** and **School settings (SCH-12):** recordings, doubt visibility, parent update frequency, AI on or off, competition (default off).
6. **Activity log (SCH-14).** Records enrolment, link and permission changes. Viewable by the platform admin.
7. **Denied:** the admin never sees individual AI chats or student rankings (5.2).

## 3. Teacher
Entry points: an invitation (SCH-09) for first use, then sign-in, then Teacher home (TCH-01).
Features: AUTH-02, ONB-02, TCH-01 to 04, plus the teacher map in 6.3.

### 3a. Invite and accept (AUTH-02)
1. The admin assigns the teacher (SCH-06), and the system sends an invite (SCH-09). Channel: NOT IN DOCS (email or phone implied by AUTH-06).
2. **Accept-invite screen:** the teacher sets a password and confirms their identity. How identity is confirmed: NOT IN DOCS.
   - Error on an expired invite: "Ask your school admin to resend."
   - Error on an already-used invite: NOT IN DOCS.
3. **Short profile.** Fields: NOT IN DOCS.
4. **Teacher onboarding (ONB-02):** shows the assigned classes and subjects, a guide to publishing a resource, a guide to creating a session, and a demo class with a demo lesson.
5. Next: Teacher home.

Reference image for 3a: none. Use the ref 03 light card style (DESIGN_SPEC 5 says to reuse it for onboarding).

### 3b. Daily screens (desktop shell, ref 06 style)
1. **Teacher home (TCH-01):** today's sessions, the review queue, tests, the concept heat map, student questions, and quick actions (upload, create session, assign).
2. **Class list, then class detail (TCH-02), then roster (TCH-03):** the roster shows enrolment and activation status for each student. The TRD (§6) puts roster and claim-code CSV import on the teacher's screens too; who uploads is still [OPEN] (Decision 3).
3. **Resource library:** upload (LES-02), tag (LES-04), publish (TCH-04).
4. **AI drafts (TRD §11):** the AI drafts a session and quiz from an uploaded note. The teacher must approve before anything is published; no AI content reaches students unreviewed.
5. **Class concept-gap view (TRD F9):** completion, gaps, misconception patterns (wrong-option counts) and doubt batches. Show a confidence indicator or a minimum attempt count, never a bare percentage. Names or counts only is [OPEN] (TRD open decision 7).
6. **Session builder (SES-03), assignment builder (ASM-02), review queue (ASM-05), insights (ANA-01 to 04), announcements (COM-02) and settings (TCH-10).**
7. **Denied:** a teacher never sees unassigned classes or student records. Opening one shows ONB-05. Insights use counts by default.
8. **Empty states:** no classes assigned yet: NOT IN DOCS.

## 4. Student
Entry points: an activation code from the school's distribution sheet for first use; after that, PIN sign-in.
Features: AUTH-03, AUTH-04, AUTH-09 (NEXT), ONB-01, STU-01 to 12, AI-01, PRG-01.

### 4a. Claim (TRD F1 FIXED, AUTH-03)
Students claim accounts the school created; they never create one. The school-issued one-time claim code leads to a per-profile token (TRD §7).
1. **Find enrolment.** The student, or a parent helping, enters the school, roll or admission number, class and section.
   - The system finds the matching record without revealing any details.
   - Error when there's no match: NOT IN DOCS (it must not leak whether the student exists).
2. **Claim code.** The student enters the one-time claim code (the Blueprint calls it the "activation code").
   - Error: wrong code. Five wrong attempts lock activation for 15 minutes.
   - Error: expired code. Expiry is set by the school [OPEN].
3. **Parent OTP.** A one-time code goes to the parent's registered phone. Method [OPEN] (Decision 2).
   - Fallback when the phone is unreachable: admin manual approval (AUTH-08). Pending screen: NOT IN DOCS.
4. **Set a 4-digit PIN (AUTH-04).** The confirm-PIN step: NOT IN DOCS.
5. **Welcome (ONB-01):**
   1. Cloud mascot with "Let's learn!"
   2. Confirm class and section.
   3. Choose an explanation language, if offered.
   4. Show today's first activity.
   5. Explain how to ask Saathy.
   6. "Start learning".

   The whole flow should take under 2 minutes. Reference image: NOT IN DOCS (use the ref 04 warm mobile style).
6. Next: Student home.

Rule: nobody can join a class just by knowing its name.

### 4b. Daily sign-in (AUTH-04)
1. The student signs in with their PIN. The roll number is never a password. Each profile has its own PIN (or avatar unlock) and its own token; tokens are never shared across profiles (TRD §5).
2. Error: three wrong PINs trigger a short wait and a prompt to ask a parent or teacher. Resetting the PIN needs their approval.
3. Shared devices (AUTH-09, TRD F11 "Should"): a profile chooser. Local data is keyed by profile_id, so students are isolated from each other. Switching takes two taps.
4. PIN screen layout: NOT IN DOCS. Ref 02 covers staff sign-in only.

### 4c. Student screens
1. **Home (STU-01).** Ref 04 for mobile, ref 06 for desktop.
   - Top to bottom: greeting with the mascot, next-action card (one primary action), today's plan (STU-02), continue card (STU-03), concepts map, announcements, upcoming work.
   - Anything due today, or a missed-class recovery, moves to the top.
   - Empty state: "Nothing due today. Explore your subjects." with a subject link.
   - Ref 04 adds Daily 5 and Streak cards. Streaks are PRG-05, a NEXT feature (see conflicts).
2. **Today's plan (STU-02).** Teacher items are marked required; AI items are marked optional. The AI never changes deadlines.
3. **Continue (STU-03).** Resumes at the same slide or question. A session left midway also returns here (6.6).
4. **My classes: subject, then chapter, then concept (STU-04 to 06).** Chapter status is not started, in progress or completed. Past chapters stay open.
5. **Session player (SES-02, TRD F3):**
   - Full-screen; the main navigation is hidden until the session ends or is saved.
   - Slides unlock one at a time. A session is complete only after its check.
6. **Micro-remediation (TRD F5):**
   - A failed concept unlocks a short lesson plus a 2-question check before the student continues.
   - The lesson targets the earliest weak prerequisite (TRD §7).
   - Pass on the second attempt is the success metric.
7. **Focus mode (TRD F12, "Should"):**
   - Navigation is locked during a practice set.
   - Exiting shows a "you are 80% done" interstitial.
   - It locks the app's own navigation only; it doesn't block other apps.
8. **Assignments (STU-07).** Shows due date, status and teacher.
9. **Ask Saathy (STU-08, AI-01, TRD F8).** Ref 05 for the mobile viva, ref 06 for the desktop.
   - Answers come only from the class's notes: hint first, with a visible citation of the source note.
   - If no relevant note is found, it says so instead of answering from general knowledge.
   - Chats are private to the student. Requests are rate-limited per profile.
10. **Progress (STU-09).** Ref 07 learning profile card.
11. **Profile and settings (STU-10).** Language, reduced motion, sign-out, change PIN.
12. **Denied:** a student can't open teacher or admin pages by changing the URL. They get ONB-05.

## 5. Parent
Entry point: after the child claims their account, the parent receives the message "Your child has joined VidhyaSaathy. Download the app and sign in with this number." Then they sign in. Parent alerts (TRD F10, "Could") name the concept and link to help; WhatsApp is mocked in the demo.
Features: AUTH-05, ONB-03, PAR-01 to 04, PAR-06, PAR-08, plus PAR-05 and 07 (NEXT).

### 5a. Link flow (AUTH-05)
1. The parent's phone number is already on the enrolment (it was entered in wizard step 7).
2. **Verify phone:** the parent enters a one-time code. Wrong or expired OTP error: NOT IN DOCS. The Page says sign-in, code and OTP attempts are rate-limited.
3. **Confirm child:** the parent confirms the child's name, class and section. What happens if the details are wrong: request a correction through the school (PAR-06).
4. The link becomes active.
5. **Parent onboarding (ONB-03):** confirm the child, explain progress and notifications, explain that private chats are not shown, and offer one first action.
6. Next: Parent home.

Rule: a parent can never find a child by searching a name or a list. Reference image for parent screens: NOT IN DOCS (use the warm app style).

### 5b. Parent screens
1. **Parent home (PAR-01):**
   - Shows the child's name, class and school; current focus; assigned work and deadlines; completed work; the latest result; concepts needing practice; teacher updates; one support action.
   - Empty state: NOT IN DOCS.
2. **Child view (PAR-02), progress summary (PAR-03) and assignments (PAR-04, read-only).**
   - The summary is labelled in four parts: observed result, AI interpretation, teacher confirmed, suggested action.
3. **Linked children (PAR-06):** switch between children, see each link's verification status, and request a correction.
4. **Denied (PAR-08):** parents never see Saathy chats, other students, rankings or unlinked children. Attempts show ONB-05.

## 6. Access-denied rules (ONB-05)
1. Shown whenever a user opens a page their account can't access. The message says the page isn't available for this account and offers a "Go home" button. No student data is shown.
2. The same state covers not-yet-available features.
3. Triggers:
   - Student on a teacher or admin URL.
   - Teacher on an unassigned class.
   - Parent on an unlinked child.
   - Any role on a private AI chat. Everyone is denied by default (Decision 7).
   - Admin on individual chats or rankings.
4. Unverified school representative: the pending screen, not ONB-05 (AUTH-01).
5. Reference image: NOT IN DOCS. Use the warm card style with one navy button.

## 7. Conflicts between sources
1. **"Activation code" vs "claim code":** the PDF says "activation code"; the TRD (F1, FIXED) says "claim code". They are the same step. Use the TRD's "claim" in code and the API; in UI copy, "claim code" is suggested (no doc decides this).
2. **Registration fields:** ref 03 uses 4 steps (type, email, phone), while AUTH-01 lists name, board, city and contact. The image wins on layout, so include city as well.
3. **SSO:** the Page adds Google and Microsoft sign-in, which the PDF doesn't include. DESIGN_SPEC says to hide the buttons unless SSO exists.
4. **"Download the app":** the AUTH-05 message assumes a native app, but this build is web-only. Adjust the wording to "open VidhyaSaathy".
5. **Streaks:** ref 04 shows a Streak card. TRD F13 ("Should", Phase 3) says streaks reward correct concept practice only, never logins or time spent. Show the card only when that feature is built, and count correct practice only.
6. **PIN binding:** resolved. The TRD makes the PIN per profile with its own token, which agrees with the Page.
7. **Wizard step 8 sending teacher invites:** this is from the Page only. The PDF only says the admin assigns teachers and they receive an invite.
8. **Stack:** the TRD's FIXED Kotlin, Android, Windows desktop, Postgres/pgvector, R2 and FCM stack conflicts with the user's web-only, no-Supabase local stack (SPEC_SUMMARY). The user's decision wins.
9. **Out of scope:** the TRD lists multi-language UI as out of scope, while the Blueprint offers a language choice (ONB-01, IND-03). Show the language step only "if offered".
10. **Who imports the roster:** the TRD puts claim-code CSV import in the teacher app; the Blueprint puts it in admin wizard step 6. Build both behind role checks (Decision 3 is [OPEN]).
11. **Demo scope:** the TRD says the demo shows Phases 0 to 2 end to end on one chapter, and anything beyond that is shown as roadmap, never claimed as built.
