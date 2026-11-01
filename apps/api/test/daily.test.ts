import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { istDay } from '@vidhyasaathy/core/streak';
import {
  CatchupSchema, DailyChallengeSchema, StudentHomeSchema,
} from '@vidhyasaathy/contracts';
import { DEMO_SCHOOL_ID, seedDemo } from '../src/db/demo.ts';
import { answerEvidence, badgeAwards, dushmanEntries, profiles, streakTouches } from '../src/db/schema.ts';
import { applyLearningAwards } from '../src/daily/awards.ts';
import { cookieFrom, createHarness, PASSWORD, PIN, type Harness } from './helpers.ts';

const BANNED = new Set(['correct', 'answerKey', 'key', 'band', 'rank']);

function leaks(value: unknown, path = '$'): string[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => leaks(item, `${path}[${index}]`));
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, item]) => [
    ...(BANNED.has(key) ? [`${path}.${key}`] : []),
    ...leaks(item, `${path}.${key}`),
  ]);
}

describe('daily loop API', () => {
  let h: Harness;
  const cookies = new Map<string, string>();
  const get = (url: string, name: string) => h.app.inject({ url, headers: { cookie: cookies.get(name) ?? '' } });
  const post = (url: string, name: string, payload: Record<string, unknown>) => h.app.inject({
    method: 'POST', url, payload, headers: { origin: 'https://school.test', cookie: cookies.get(name) ?? '' },
  });

  beforeEach(async () => {
    h = await createHarness();
    await seedDemo(h.database.db, { password: PASSWORD, pin: PIN }, h.now(), { rich: true });
    for (const name of ['Aarav', 'Priya', 'Rohan']) {
      const profile = h.database.db.select().from(profiles).where(and(
        eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.name, name),
      )).get();
      if (!profile) throw new Error(`Missing ${name}`);
      cookies.set(name, cookieFrom((await h.post('/auth/pin-login', { profileId: profile.id, pin: PIN })).headers));
    }
  });
  afterEach(async () => { await h.app.close(); h.database.close(); });

  it('serves one home payload for the three seeded stories', async () => {
    const aarav = StudentHomeSchema.parse((await get('/student/home', 'Aarav')).json());
    const priya = StudentHomeSchema.parse((await get('/student/home', 'Priya')).json());
    const rohan = StudentHomeSchema.parse((await get('/student/home', 'Rohan')).json());
    expect(aarav.warmup).toBeNull();
    expect(aarav.nextAction).toMatchObject({ kind: 'new', title: 'Acceleration', estMinutes: 14 });
    expect(priya.warmup?.conceptName).toMatch(/Distance/);
    expect(priya.nextAction).toMatchObject({ kind: 'revision', estMinutes: 10 });
    expect(priya.nextAction?.title).toMatch(/Speed/);
    expect(rohan.nextAction).toMatchObject({
      kind: 'catchup', estMinutes: 20, title: "Good to see you. Let's take this in small steps.",
    });
    expect(rohan.catchUp?.estMinutes).toBe(20);
    expect(aarav.streak.currentDays).toBe(12);
    expect(priya.streak.currentDays).toBe(5);
    expect(rohan.streak.week).toHaveLength(7);
    expect(JSON.stringify(aarav)).not.toMatch(/atom forge|atom workshop/i);
    expect(aarav.todaysGame?.gameId).not.toMatch(/atom/i);
    for (const home of [aarav, priya, rohan]) expect(leaks(home)).toEqual([]);
  });

  it('keeps catch-up near 20 minutes and hides the warm-up after a skip', async () => {
    const catchup = CatchupSchema.parse((await get('/student/catchup', 'Rohan')).json());
    expect(catchup.estMinutes).toBeGreaterThanOrEqual(15);
    expect(catchup.estMinutes).toBeLessThanOrEqual(25);
    expect(catchup.steps.reduce((sum, step) => sum + step.estMinutes, 0)).toBe(catchup.estMinutes);
    expect(catchup.copy).toBe("Good to see you. Let's take this in small steps.");
    const before = StudentHomeSchema.parse((await get('/student/home', 'Priya')).json());
    expect(before.warmup).not.toBeNull();
    expect((await post('/student/warmup/skip', 'Priya', { clientEventId: randomUUID() })).statusCode).toBe(200);
    const after = StudentHomeSchema.parse((await get('/student/home', 'Priya')).json());
    expect(after.warmup).toBeNull();
    h.advance(24 * 60 * 60 * 1000);
    const priya = h.database.db.select().from(profiles).where(and(
      eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.name, 'Priya'),
    )).get()!;
    cookies.set('Priya', cookieFrom((await h.post('/auth/pin-login', { profileId: priya.id, pin: PIN })).headers));
    expect(StudentHomeSchema.parse((await get('/student/home', 'Priya')).json()).warmup).not.toBeNull();
  });

  it('closes an untried challenge after the five minutes without XP or a streak touch', async () => {
    const served = DailyChallengeSchema.parse((await get('/student/daily-challenge', 'Aarav')).json());
    expect((await post(`/student/daily-challenge/${served.id}/finish`, 'Aarav', {})).statusCode).toBe(409);
    h.advance(5 * 60 * 1000 + 1000);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const finish = await post(`/student/daily-challenge/${served.id}/finish`, 'Aarav', {});
      expect(finish.statusCode).toBe(200);
      expect(finish.json()).toEqual({ status: 'expired', xp: 0, answered: 0 });
    }
    const again = DailyChallengeSchema.parse((await get('/student/daily-challenge', 'Aarav')).json());
    expect(again.id).toBe(served.id);
    expect(again.status).toBe('expired');
    const touches = h.database.db.select().from(streakTouches).all().filter((row) => row.sourceEventId === served.id);
    expect(touches).toEqual([]);
  });

  it('serves one daily challenge per day and one streak row for a double tap', async () => {
    const first = DailyChallengeSchema.parse((await get('/student/daily-challenge', 'Aarav')).json());
    const second = DailyChallengeSchema.parse((await get('/student/daily-challenge', 'Aarav')).json());
    expect(second.id).toBe(first.id);
    expect(first.items.length).toBeGreaterThan(0);
    expect(first.items.length).toBeLessThanOrEqual(5);
    expect((await post(`/student/daily-challenge/${first.id}/finish`, 'Aarav', {})).statusCode).toBe(409);
    expect(leaks(first)).toEqual([]);
    const item = first.items[0]!;
    const answer = item.type === 'mcq' ? item.options[0] : '1';
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await post(`/student/daily-challenge/${first.id}/answer`, 'Aarav', {
        clientEventId: randomUUID(), itemId: item.id, answer, confidence: 'sure', timeMs: 1000,
      });
      expect(response.statusCode).toBe(200);
      expect(leaks(response.json())).toEqual([]);
    }
    const profile = h.database.db.select().from(profiles).where(and(
      eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.name, 'Aarav'),
    )).get()!;
    const today = istDay(h.now());
    expect(h.database.db.select().from(answerEvidence).where(and(
      eq(answerEvidence.profileId, profile.id), eq(answerEvidence.source, 'game:daily_challenge'),
    )).all()).toHaveLength(1);
    expect(h.database.db.select().from(streakTouches).where(and(
      eq(streakTouches.profileId, profile.id), eq(streakTouches.day, today),
    )).all()).toHaveLength(1);
  });

  it('retires a mastered Dushman and awards its badge only once', () => {
    const entry = h.database.db.select().from(dushmanEntries).get()!;
    const input = { schoolId: DEMO_SCHOOL_ID, profileId: entry.profileId, conceptId: entry.conceptId,
      evidenceId: 'audit-mastery-event', fromLevel: 2, toLevel: 3, now: h.now() };
    applyLearningAwards(h.database.db, input);
    applyLearningAwards(h.database.db, input);
    expect(h.database.db.select().from(dushmanEntries).where(eq(dushmanEntries.id, entry.id)).get()?.status).toBe('retired');
    const awards = h.database.db.select().from(badgeAwards).where(and(
      eq(badgeAwards.profileId, entry.profileId), eq(badgeAwards.badgeId, 'dushman_slayer'),
    )).all();
    expect(awards).toHaveLength(1);
    expect(awards[0]?.triggerEventId).toBe(input.evidenceId);
  });

  it('refuses parent and teacher tokens on student routes', async () => {
    for (const role of ['teacher', 'parent'] as const) {
      const { cookie } = h.roleCookie(DEMO_SCHOOL_ID, role);
      for (const url of ['/student/home', '/student/catchup', '/student/daily-challenge', '/student/dushman', '/student/streak', '/student/badges', '/student/homework']) {
        expect((await h.app.inject({ url, headers: { cookie } })).statusCode).toBe(403);
      }
    }
  });
});
