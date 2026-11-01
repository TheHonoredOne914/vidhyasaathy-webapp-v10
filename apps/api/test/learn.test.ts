import { CheckpointResultSchema, LessonViewSchema, RevisionQueuedSchema } from '@vidhyasaathy/contracts';
import { and, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEMO_SCHOOL_ID, seedDemo } from '../src/db/demo.ts';
import { answerEvidence, concepts, profiles, revisionHooks } from '../src/db/schema.ts';
import { cookieFrom, createHarness, PASSWORD, PIN, type Harness } from './helpers.ts';

describe('concept lessons', () => {
  let h: Harness;
  beforeEach(async () => {
    h = await createHarness();
    await seedDemo(h.database.db, { password: PASSWORD, pin: PIN }, h.now(), { rich: true });
  });
  afterEach(async () => { await h.app.close(); h.database.close(); });

  it('loads Distance & Displacement with source-based content and server-checked answers', async () => {
    const aarav = h.database.db.select().from(profiles).where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.name, 'Aarav'))).get()!;
    const student = cookieFrom((await h.post('/auth/pin-login', { profileId: aarav.id, pin: PIN })).headers);
    const concept = h.database.db.select().from(concepts).where(and(eq(concepts.schoolId, DEMO_SCHOOL_ID), eq(concepts.title, 'Distance & Displacement'))).get()!;
    const view = LessonViewSchema.parse((await h.app.inject({ url: `/concepts/${concept.id}/lesson`, headers: { cookie: student } })).json());
    expect(view.found).toBe(true);
    if (!view.found) return;
    expect(view.steps).toHaveLength(3);
    expect(view.flashcards).toHaveLength(6);
    expect(view.worked.prompt).toContain('30 m east');
    expect(view.worked.hinted.join(' ')).toContain('40 m');
    expect(view.summary.formulas).toContain('Displacement = final position - initial position');
    expect(JSON.stringify(view)).not.toMatch(/"(?:answer|answers|pairs|gapAnswers)":/);
      const result = await h.post(`/concepts/${concept.id}/lesson/checkpoint`, { itemId: view.steps[0]!.checkpoint.id, answer: '0 m', confidence: 'sure', timeMs: 1000 }, student);
    expect(CheckpointResultSchema.parse(result.json()).correct).toBe(true);
    const simple = LessonViewSchema.parse((await h.app.inject({ url: `/concepts/${concept.id}/lesson?simpler=1`, headers: { cookie: student } })).json());
    expect(simple.found && simple.note).toContain('विस्थापन');
  });

  it('saves a correct retry as new evidence and keeps a replayed attempt idempotent (UX01)', async () => {
    const aarav = h.database.db.select().from(profiles).where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.name, 'Aarav'))).get()!;
    const student = cookieFrom((await h.post('/auth/pin-login', { profileId: aarav.id, pin: PIN })).headers);
    const concept = h.database.db.select().from(concepts).where(and(eq(concepts.schoolId, DEMO_SCHOOL_ID), eq(concepts.title, 'Distance & Displacement'))).get()!;
    const view = LessonViewSchema.parse((await h.app.inject({ url: `/concepts/${concept.id}/lesson`, headers: { cookie: student } })).json());
    if (!view.found) throw new Error('lesson missing');
    const step = view.steps[0]!;
    const wrongAnswer = step.checkpoint.options.find((option) => option !== '0 m')!;
    const url = `/concepts/${concept.id}/lesson/checkpoint`;
    const wrong = await h.post(url, { attemptId: 'attempt-wrong-1', itemId: step.checkpoint.id, answer: wrongAnswer, confidence: 'sure', timeMs: 1000 }, student);
    expect(CheckpointResultSchema.parse(wrong.json()).correct).toBe(false);
    const retry = { attemptId: 'attempt-right-2', itemId: step.checkpoint.id, answer: '0 m', confidence: 'sure', timeMs: 900 };
    expect(CheckpointResultSchema.parse((await h.post(url, retry, student)).json()).correct).toBe(true);
    expect((await h.post(url, retry, student)).statusCode).toBe(200);
    const rows = h.database.db.select().from(answerEvidence)
      .where(and(eq(answerEvidence.profileId, aarav.id), eq(answerEvidence.itemId, step.checkpoint.id))).all();
    expect(rows.map((row) => row.correct).sort()).toEqual([false, true]);
    expect(rows.find((row) => row.correct)?.answer).toBe('0 m');
  });

  it('serves a Motion lesson without answer keys and queues 1, 3 and 7 day revision', async () => {
    const aarav = h.database.db.select().from(profiles).where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.name, 'Aarav'))).get()!;
    const student = cookieFrom((await h.post('/auth/pin-login', { profileId: aarav.id, pin: PIN })).headers);
    const concept = h.database.db.select().from(concepts).where(and(eq(concepts.schoolId, DEMO_SCHOOL_ID), eq(concepts.title, 'Speed & Velocity'))).get()!;
    const view = LessonViewSchema.parse((await h.app.inject({ url: `/concepts/${concept.id}/lesson?simpler=1`, headers: { cookie: student } })).json());
    expect(view.found).toBe(true);
    if (!view.found) return;
    expect(view.variant).toBe('simple');
    expect(view.note).toContain('चाल');
    expect(JSON.stringify(view)).not.toContain('gapAnswers');
    expect(JSON.stringify(view)).not.toContain('"answer"');
    expect(view.blocks.some((block) => block.kind === 'moving_object' && block.vehicle === 'car')).toBe(true);
    expect(view.blocks.some((block) => block.kind === 'drag_label' && !('pairs' in block))).toBe(true);
    const queued = await h.post(`/concepts/${concept.id}/lesson/revision`, {}, student);
    expect(RevisionQueuedSchema.parse(queued.json()).days).toEqual([1, 3, 7]);
    const hooks = h.database.db.select().from(revisionHooks).where(eq(revisionHooks.profileId, aarav.id)).all();
    expect(hooks.map((hook) => hook.intervalDays).sort()).toEqual([1, 3, 7]);
  });
});
