import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { seedDemo, DEMO_SCHOOL_ID } from '../src/db/demo.ts';
import { ensureNotebookDemo } from '../src/db/notebook-seed.ts';
import { seedPhase4 } from '../src/db/seed-phase4.ts';
import { profiles, sessions } from '../src/db/schema.ts';
import { generateSessionToken, hashToken } from '../src/auth/security.ts';
import { createHarness, PASSWORD, PIN, type Harness } from './helpers.ts';
import { offerQuickTry } from '../src/ai/ask-quick.ts';

let h: Harness, cookie: string;
beforeEach(async () => {
  h = await createHarness();
  await seedDemo(h.database.db, { password: PASSWORD, pin: PIN }, h.now(), { rich: true });
  ensureNotebookDemo(h.database.db, DEMO_SCHOOL_ID, h.now());
  await seedPhase4(h.database, h.now);
  const pupil = h.database.db.select().from(profiles).where(eq(profiles.name, 'Aarav')).get()!;
  const token = generateSessionToken();
  h.database.db.insert(sessions).values({ tokenHash: hashToken(token), profileId: pupil.id, schoolId: pupil.schoolId, createdAt: h.now(), expiresAt: h.now() + 3 * 86400000 }).run();
  cookie = `vidhyasaathy_session=${token}`;
});
afterEach(async () => { await h.app.close(); });

it('scores frozen real checkpoints once, writes light evidence and finishes with a historical best', async () => {
  const payload = { clientEventId: randomUUID() };
  const started = await h.post('/games/motion/sessions', payload, cookie);
  expect(started.statusCode).toBe(200);
  expect((await h.post('/games/motion/sessions', payload, cookie)).body).toBe(started.body);
  const { sessionId, checkpoints } = started.json();
  expect(JSON.stringify(checkpoints)).not.toMatch(/correctOption|explanation|answer/);
  expect(Object.keys(checkpoints)).toHaveLength(4);
  const url = `/games/motion/sessions/${sessionId}`;
  expect((await h.post(`${url}/finish`, { clientEventId: randomUUID() }, cookie)).statusCode).toBe(409);
  for (const checkpointKey of Object.keys(checkpoints)) {
    const row = h.database.sqlite.prepare('SELECT content FROM game_session_item WHERE session_id=? AND checkpoint_key=?').get(sessionId, checkpointKey) as { content: string };
    const frozen = JSON.parse(row.content) as { options: string[]; answer: string };
    const right = String(frozen.options.indexOf(frozen.answer));
    const wrong = right === '0' ? '1' : '0';
    const input = { clientEventId: randomUUID(), checkpointKey, answer: { optionId: right }, confidence: 'sure', timeMs: 4000 };
    const answer = await h.post(`${url}/answer`, input, cookie);
    expect(answer.statusCode).toBe(200);
    expect(answer.json().correct).toBe(true);
    expect((await h.post(`${url}/answer`, input, cookie)).body).toBe(answer.body);
    expect((await h.post(`${url}/answer`, { ...input, answer: { optionId: wrong } }, cookie)).statusCode).toBe(409);
    expect((await h.post(`${url}/answer`, { ...input, clientEventId: randomUUID() }, cookie)).statusCode).toBe(409);
  }
  const rows = h.database.sqlite.prepare("SELECT weight,source FROM answer_evidence WHERE source='game:motion'").all();
  expect(rows).toHaveLength(4);
  expect(rows).toEqual(Array.from({ length: 4 }, () => ({ weight: 0.5, source: 'game:motion' })));
  const finishInput = { clientEventId: randomUUID() };
  const finished = await h.post(`${url}/finish`, finishInput, cookie);
  expect(finished.statusCode).toBe(200);
  expect(finished.json()).toMatchObject({ answered: 4, correct: 4, personalBest: true, best: { kind: 'score', label: 'Best 4/4' } });
  expect((await h.post(`${url}/finish`, finishInput, cookie)).body).toBe(finished.body);
});

it('rejects wrong owners, game/session mismatches, unsupported games and non-students', async () => {
  const started = await h.post('/games/motion/sessions', { clientEventId: randomUUID() }, cookie);
  const id = started.json().sessionId;
  const input = { clientEventId: randomUUID() };
  expect((await h.post(`/games/newton/sessions/${id}/finish`, input, cookie)).statusCode).toBe(404);
  const other = h.roleCookie(DEMO_SCHOOL_ID, 'student');
  expect((await h.post(`/games/motion/sessions/${id}/finish`, input, other.cookie)).statusCode).toBe(404);
  expect((await h.post('/games/not-a-game/sessions', input, cookie)).statusCode).toBe(404);
  for (const role of ['teacher', 'parent', 'admin'] as const) {
    expect((await h.post('/games/motion/sessions', input, h.roleCookie(DEMO_SCHOOL_ID, role).cookie)).statusCode).toBe(403);
  }
});

it('scores an owned Ask quick try once and keeps opted-in teacher replies after text expires', async () => {
  const { sqlite } = h.database;
  const pupil = sqlite.prepare("SELECT * FROM profile WHERE name='Aarav'").get() as { id: string; section_id: string };
  const item = sqlite.prepare("SELECT * FROM item WHERE id LIKE 'game-bank:%' LIMIT 1").get() as { id: string; concept_id: string; chapter_id: string };
  const threadId = randomUUID(), messageId = randomUUID();
  sqlite.prepare('INSERT INTO ask_thread (id,school_id,profile_id,chapter_id,concept_id,title,style,mode,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(threadId, DEMO_SCHOOL_ID, pupil.id, item.chapter_id, item.concept_id, 'A science doubt', 'hints', 'learn', h.now(), h.now());
  sqlite.prepare('INSERT INTO ask_message (id,school_id,thread_id,role,text,client_event_id,metadata,created_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(messageId, DEMO_SCHOOL_ID, threadId, 'saathy', 'Think about the idea in your notes.', randomUUID(), '[]', h.now());
  sqlite.prepare('INSERT INTO ask_message (id,school_id,thread_id,role,text,client_event_id,metadata,created_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(randomUUID(), DEMO_SCHOOL_ID, threadId, 'student', 'A private question about this idea', randomUUID(), '{}', h.now());
  const quick = offerQuickTry(h.database, threadId, DEMO_SCHOOL_ID, pupil.id, item.chapter_id, item.concept_id, h.now());
  expect(quick).not.toBeNull();
  expect(quick).not.toHaveProperty('answer');
  const detail = await h.app.inject({ url: `/ask/threads/${threadId}`, headers: { cookie } });
  expect(detail.json().concept).toMatchObject({ id: item.concept_id });
  const input = { threadId, clientEventId: randomUUID(), optionId: '1' };
  expect((await h.post('/ask/quick-try/not-this-item/answer', input, cookie)).statusCode).toBe(404);
  const result = await h.post(`/ask/quick-try/${quick!.itemId}/answer`, input, cookie);
  expect(result.statusCode, result.body).toBe(200);
  expect(result.json()).toMatchObject({ correct: false, evidenceSaved: true });
  expect(result.json().xp).toEqual(expect.any(Number));
  expect((await h.post('/ask/quick-try/answer', input, cookie)).body).toBe(result.body);
  expect((await h.post('/ask/quick-try/answer', { ...input, clientEventId: randomUUID() }, cookie)).statusCode).toBe(409);
  expect(sqlite.prepare("SELECT weight FROM answer_evidence WHERE source_detail='ask'").all()).toEqual([{ weight: 0.5 }]);
  expect(sqlite.prepare("SELECT id FROM followup_item WHERE reason='quick_try'").all()).toHaveLength(1);
  const other = h.roleCookie(DEMO_SCHOOL_ID, 'student');
  expect((await h.post('/ask/escalate', { messageId, alsoTellTeacher: true }, other.cookie)).statusCode).toBe(404);
  const escalation = await h.post('/ask/escalate', { messageId, alsoTellTeacher: true }, cookie);
  expect(escalation.statusCode, escalation.body).toBe(200);
  const teacher = sqlite.prepare('SELECT teacher_id FROM doubt_escalation WHERE id=?').get(escalation.json().escalationId) as { teacher_id: string };
  const token = generateSessionToken();
  h.database.db.insert(sessions).values({ tokenHash: hashToken(token), profileId: teacher.teacher_id, schoolId: DEMO_SCHOOL_ID, createdAt: h.now(), expiresAt: h.now() + 3 * 86400000 }).run();
  const teacherCookie = `vidhyasaathy_session=${token}`;
  expect((await h.post(`/teacher/escalations/${escalation.json().escalationId}/reply`, { text: 'Review the distance travelled in equal intervals.' }, teacherCookie)).statusCode).toBe(200);
  h.advance(25 * 3600000);
  const expired = await h.app.inject({ url: `/ask/threads/${threadId}`, headers: { cookie } });
  expect(expired.statusCode).toBe(200);
  expect(expired.json().messages).toEqual([]);
  expect(sqlite.prepare('SELECT count,snippets FROM doubt_cluster_counter WHERE concept_id=?').get(item.concept_id)).toEqual({ count: 1, snippets: '[]' });
  expect(expired.json().teacherReplies).toHaveLength(1);
  const listed = await h.app.inject({ url: '/teacher/escalations', headers: { cookie: teacherCookie } });
  expect(listed.json().items).toHaveLength(1);
});
