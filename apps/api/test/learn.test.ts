import { LessonViewSchema, RevisionQueuedSchema } from '@vidhyasaathy/contracts';
import { and, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEMO_SCHOOL_ID, seedDemo } from '../src/db/demo.ts';
import { concepts, profiles, revisionHooks } from '../src/db/schema.ts';
import { cookieFrom, createHarness, PASSWORD, PIN, type Harness } from './helpers.ts';

describe('concept lessons', () => {
  let h: Harness;
  beforeEach(async () => {
    h = await createHarness();
    await seedDemo(h.database.db, { password: PASSWORD, pin: PIN }, h.now(), { rich: true });
  });
  afterEach(async () => { await h.app.close(); h.database.close(); });

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
