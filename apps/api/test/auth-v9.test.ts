import { randomUUID } from 'node:crypto';
import { generateClaimCode } from '@vidhyasaathy/core/claim';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { hashToken } from '../src/auth/security.ts';
import { academicYears, claimCodes, classes, profiles, sections, users } from '../src/db/schema.ts';
import { cookieFrom, createHarness, type Harness } from './helpers.ts';

let h: Harness;
let schoolId: string;
const previousMode = process.env.NODE_ENV;
const previousFlag = process.env.DEMO_LOOSE_AUTH;

beforeEach(async () => {
  delete process.env.DEMO_LOOSE_AUTH;
  h = await createHarness();
  schoolId = (await h.register()).json().school.id;
});
afterEach(async () => {
  await h.app.close();
  if (previousMode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousMode;
  if (previousFlag === undefined) delete process.env.DEMO_LOOSE_AUTH; else process.env.DEMO_LOOSE_AUTH = previousFlag;
});

function section(name: string) {
  const db = h.database.db;
  let year = db.select().from(academicYears).where(eq(academicYears.schoolId, schoolId)).get();
  if (!year) { year = { id: randomUUID(), schoolId, name: '2026', startsOn: '2026-04-01', endsOn: '2027-03-31' }; db.insert(academicYears).values(year).run(); }
  let klass = db.select().from(classes).where(eq(classes.schoolId, schoolId)).get();
  if (!klass) { klass = { id: randomUUID(), schoolId, academicYearId: year.id, name: '9' }; db.insert(classes).values(klass).run(); }
  const id = randomUUID();
  db.insert(sections).values({ id, schoolId, classId: klass.id, name }).run();
  return id;
}

function activatable(rollNumber: string, sectionId: string = section(`S${rollNumber}`)) {
  const db = h.database.db;
  const userId = randomUUID(); const profileId = randomUUID(); const code = generateClaimCode();
  db.insert(users).values({ id: userId, createdAt: h.now() }).run();
  db.insert(profiles).values({ id: profileId, userId, schoolId, name: `Student ${rollNumber}`, role: 'student', sectionId, rollNumber, phone: '9876543210', createdAt: h.now() }).run();
  db.insert(claimCodes).values({ id: randomUUID(), codeHash: hashToken(code), schoolId, profileId, expiresAt: h.now() + 3_600_000, createdAt: h.now() }).run();
  return { userId, profileId, code };
}

describe('student activation (production mode, no demo shortcuts)', () => {
  it('rejects a lookup token used directly as a PIN token and issues no session (S01)', async () => {
    process.env.NODE_ENV = 'production';
    const student = activatable('7');
    const lookup = await h.post('/auth/student/lookup', { schoolId, rollNo: '7' });
    expect(lookup.statusCode).toBe(200);
    const setPin = await h.post('/auth/student/set-pin', { pinToken: lookup.json().lookupToken, pin: '1357' });
    expect(setPin.statusCode).toBe(400);
    expect(setPin.headers['set-cookie']).toBeUndefined();
    expect(h.database.db.select().from(users).where(eq(users.id, student.userId)).get()?.pinHash).toBeNull();
  });

  it('rejects an unverified OTP token as a PIN token and never returns the OTP in production', async () => {
    process.env.NODE_ENV = 'production';
    const student = activatable('8');
    const lookup = await h.post('/auth/student/lookup', { schoolId, rollNo: '8' });
    const activate = await h.post('/auth/student/activate', { lookupToken: lookup.json().lookupToken, activationCode: student.code });
    expect(activate.statusCode).toBe(200);
    expect(activate.json().otp).toBeUndefined();
    const setPin = await h.post('/auth/student/set-pin', { pinToken: activate.json().otpToken, pin: '1357' });
    expect(setPin.statusCode).toBe(400);
    expect(setPin.headers['set-cookie']).toBeUndefined();
  });

  it('does not accept a lookup token as an OTP token', async () => {
    process.env.NODE_ENV = 'production';
    activatable('9');
    const lookup = await h.post('/auth/student/lookup', { schoolId, rollNo: '9' });
    const verify = await h.post('/auth/student/verify-otp', { otpToken: lookup.json().lookupToken, otp: '123456' });
    expect(verify.statusCode).toBe(400);
  });

  it('completes the legitimate flow once; the PIN grant cannot be reused', async () => {
    process.env.NODE_ENV = 'test';
    const student = activatable('10');
    const lookup = await h.post('/auth/student/lookup', { schoolId, rollNo: '10' });
    const activate = await h.post('/auth/student/activate', { lookupToken: lookup.json().lookupToken, activationCode: student.code });
    const verify = await h.post('/auth/student/verify-otp', { otpToken: activate.json().otpToken, otp: activate.json().otp });
    expect(verify.statusCode).toBe(200);
    const { pinToken } = verify.json();
    const [first, second] = await Promise.all([
      h.post('/auth/student/set-pin', { pinToken, pin: '1357' }),
      h.post('/auth/student/set-pin', { pinToken, pin: '2468' }),
    ]);
    expect([first.statusCode, second.statusCode].sort()).toEqual([200, 400]);
    const winner = first.statusCode === 200 ? first : second;
    const me = await h.app.inject({ url: '/me', headers: { cookie: cookieFrom(winner.headers) } });
    expect(me.json().profile.id).toBe(student.profileId);
    const again = await h.post('/auth/student/lookup', { schoolId, rollNo: '10' });
    expect(again.statusCode).toBe(404);
  });

  it('refuses to guess between two students with the same roll number (S05)', async () => {
    const a = section('A'); const b = section('B');
    activatable('1', a); const second = activatable('1', b);
    const ambiguous = await h.post('/auth/student/lookup', { schoolId, rollNo: '1' });
    expect(ambiguous.statusCode).toBe(409);
    const exact = await h.post('/auth/student/lookup', { schoolId, sectionId: b, rollNo: '1' });
    expect(exact.statusCode).toBe(200);
    expect(exact.json().name).toBe(`Student 1`);
    void second;
  });
});

describe('demo loose auth flag', () => {
  it('is off unless DEMO_LOOSE_AUTH=true, and always off in production', async () => {
    const { demoLooseAuthEnabled } = await import('../src/auth/demo-loose.ts');
    process.env.NODE_ENV = 'development'; delete process.env.DEMO_LOOSE_AUTH;
    expect(demoLooseAuthEnabled()).toBe(false);
    process.env.DEMO_LOOSE_AUTH = 'true';
    expect(demoLooseAuthEnabled()).toBe(true);
    process.env.NODE_ENV = 'production';
    expect(demoLooseAuthEnabled()).toBe(false);
  });

  it('rejects a wrong password when the flag is unset', async () => {
    process.env.NODE_ENV = 'development';
    const login = await h.post('/auth/login', { email: 'admin@example.test', password: 'wrong password here' });
    expect(login.statusCode).toBe(401);
  });
});
