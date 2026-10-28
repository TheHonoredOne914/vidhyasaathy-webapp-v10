import { AskResponseSchema } from '@vidhyasaathy/contracts';
import { and, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { verifyCredential } from '../src/auth/security.ts';
import { DEMO_SCHOOL_ID, resetDemoLogins, seedDemo } from '../src/db/demo.ts';
import { chapters, learningSessions, notes, profiles, slides, users } from '../src/db/schema.ts';
import { PASSWORD, PIN, cookieFrom, createHarness, type Harness } from './helpers.ts';

describe('demo Motion content and notes-only Ask Saathy', () => {
  let h: Harness, student: string, chapterId: string;
  const ask = (question: string, extra: Record<string, unknown> = {}) => h.post('/ask', { chapterId, question, ...extra }, student);

  beforeEach(async () => {
    h = await createHarness();
    await seedDemo(h.database.db, { password: PASSWORD, pin: PIN }, h.now(), { rich: true });
    const aarav = h.database.db.select().from(profiles).where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.name, 'Aarav'))).get()!;
    student = cookieFrom((await h.post('/auth/pin-login', { profileId: aarav.id, pin: PIN })).headers);
    chapterId = h.database.db.select().from(chapters).where(eq(chapters.title, 'Motion')).get()!.id;
  });
  afterEach(async () => { await h.app.close(); h.database.close(); });

  it('seeds Motion notes and Session 3 slides once, without touching accounts on re-seed', async () => {
    const session = h.database.db.select().from(learningSessions).where(eq(learningSessions.chapterId, chapterId)).get()!;
    expect(h.database.db.select().from(notes).where(eq(notes.chapterId, chapterId)).all()).toHaveLength(3);
    expect(h.database.db.select().from(slides).where(eq(slides.sessionId, session.id)).all()).toHaveLength(4);
    const accounts = h.database.db.select().from(users).all();
    // Simulates an older demo database that predates the Motion content.
    h.database.db.delete(slides).where(eq(slides.sessionId, session.id)).run();
    expect((await seedDemo(h.database.db, { password: PASSWORD, pin: PIN }, h.now(), { rich: true })).created).toBe(false);
    expect(h.database.db.select().from(notes).where(eq(notes.chapterId, chapterId)).all()).toHaveLength(3);
    expect(h.database.db.select().from(slides).where(eq(slides.sessionId, session.id)).all()).toHaveLength(4);
    expect(h.database.db.select().from(users).all()).toEqual(accounts);
  });

  it('resets only demo staff passwords on explicit request', async () => {
    const before = h.database.db.select().from(users).all();
    expect(await resetDemoLogins(h.database.db, `${PASSWORD}!`)).toBe(4);
    for (const row of h.database.db.select().from(users).all()) {
      const old = before.find((entry) => entry.id === row.id)!;
      if (row.passwordHash) expect(await verifyCredential(row.passwordHash, `${PASSWORD}!`)).toBe(true);
      expect(row.pinHash).toEqual(old.pinHash);
    }
    await expect(resetDemoLogins(h.database.db, 'short')).rejects.toThrow();
  });

  it('answers in-syllabus questions by quoting released notes and refuses the rest', async () => {
    const answer = AskResponseSchema.parse((await ask('What is the difference between distance and displacement?')).json());
    expect(answer.status).toBe('answered');
    expect(answer.message).toContain('distance and displacement');
    expect(answer.citations.length).toBeGreaterThan(0);
    const note = h.database.db.select().from(notes).where(eq(notes.id, answer.citations[0]!.noteId)).get()!;
    for (const citation of answer.citations) expect(note.body).toContain(citation.quote);
    expect(AskResponseSchema.parse((await ask('What is acceleration?')).json()).status).toBe('answered');
    expect(AskResponseSchema.parse((await ask('What is the difference between distance and displacement?', { hintLevel: 2 })).json()).status).toBe('answered');
    expect((await ask('What is acceleration?', { hintLevel: 3 })).statusCode).toBe(409);
    const socratic = AskResponseSchema.parse((await ask('Explain velocity', { socratic: true })).json());
    expect(socratic.message).toContain('how would you answer');
    for (const outside of ['Explain volcanoes', 'What time is it on Mars?', 'Who won the cricket world cup?', 'How does photosynthesis work in leaves?']) {
      expect(AskResponseSchema.parse((await ask(outside)).json()).status).toBe('not_in_notes');
    }
  });
});
