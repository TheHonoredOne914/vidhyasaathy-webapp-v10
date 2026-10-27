import { randomUUID } from 'node:crypto';
import { ApiErrorSchema, MeSchema } from '@vidhyasaathy/contracts';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { hashToken } from '../src/auth/security.ts';
import { auditLogs, claimCodes, schools, sessions, users } from '../src/db/schema.ts';
import { COOKIE_NAME, ORIGIN, PASSWORD, PIN, cookieFrom, createHarness, type Harness } from './helpers.ts';

let h: Harness;
beforeEach(async () => { h = await createHarness(); });
afterEach(async () => { await h.app.close(); });

describe('password authentication and sessions', () => {
  it('registers an admin, logs out, and signs in with normalized email', async () => {
    const registered = await h.register();
    expect(registered.statusCode).toBe(201);
    const identity = MeSchema.parse(registered.json());
    expect(identity.profile.role).toBe('admin');
    expect(identity.profile.schoolId).toBe(identity.school.id);
    const cookie = cookieFrom(registered.headers);
    const setCookie = String(registered.headers['set-cookie']);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Secure');
    expect(registered.headers['cache-control']).toBe('no-store');
    const user = h.database.db.select().from(users).get();
    expect(user?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(user?.passwordHash).not.toBe(PASSWORD);
    expect(JSON.stringify(registered.json())).not.toContain('Hash');
    const token = cookie.slice(COOKIE_NAME.length + 1);
    expect(h.database.db.select().from(sessions).get()?.tokenHash).toBe(hashToken(token));

    const me = await h.app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toEqual(identity);
    const logout = await h.post('/auth/logout', undefined, cookie);
    expect(logout.statusCode).toBe(204);
    expect(logout.body).toBe('');
    expect(String(logout.headers['set-cookie'])).toContain('Max-Age=0');
    expect((await h.app.inject({ url: '/me', headers: { cookie } })).statusCode).toBe(401);

    const login = await h.post('/auth/login', { email: ' ADMIN@example.test ', password: PASSWORD });
    expect(login.statusCode).toBe(200);
    expect(login.json()).toEqual(identity);
    expect(cookieFrom(login.headers)).not.toBe(cookie);
    const actions = h.database.db.select().from(auditLogs).all().map((entry) => entry.action);
    expect(actions).toEqual(expect.arrayContaining(['auth.register-school', 'auth.login', 'auth.logout']));
    expect(JSON.stringify(actions)).not.toContain(PASSWORD);
  });

  it('rotates the previous session on login', async () => {
    const cookie = cookieFrom((await h.register()).headers);
    const login = await h.post('/auth/login', { email: 'admin@example.test', password: PASSWORD }, cookie);
    expect(login.statusCode).toBe(200);
    expect((await h.app.inject({ url: '/me', headers: { cookie } })).statusCode).toBe(401);
    expect((await h.app.inject({ url: '/me', headers: { cookie: cookieFrom(login.headers) } })).statusCode).toBe(200);
    expect(h.database.db.select().from(sessions).all()).toHaveLength(1);
  });

  it('rejects duplicate emails without leaving an orphan school', async () => {
    await h.register();
    const duplicate = await h.register('ADMIN@example.test');
    expect(duplicate.statusCode).toBe(409);
    expect(ApiErrorSchema.parse(duplicate.json()).code).toBe('EMAIL_IN_USE');
    expect(h.database.db.select().from(schools).all()).toHaveLength(1);
    expect(h.database.db.select().from(users).all()).toHaveLength(1);
  });

  it.each(['admin@example.test', 'unknown@example.test'])('rejects incorrect credentials for %s', async (email) => {
    await h.register();
    const response = await h.post('/auth/login', { email, password: 'An incorrect password' });
    expect(response.statusCode).toBe(401);
    expect(ApiErrorSchema.parse(response.json()).code).toBe('INVALID_CREDENTIALS');
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('expires sessions at the exact server-side boundary', async () => {
    const cookie = cookieFrom((await h.register()).headers);
    h.advance(604800000);
    const response = await h.app.inject({ url: '/me', headers: { cookie } });
    expect(response.statusCode).toBe(401);
    expect(h.database.db.select().from(sessions).all()).toHaveLength(0);
  });
});

describe('one-time claim redemption', () => {
  it('claims a student once, hashes the PIN, and permits later PIN login', async () => {
    const admin = MeSchema.parse((await h.register()).json());
    const student = h.createProfile(admin.school.id);
    const claim = await h.post('/auth/claim', { code: student.code.toLowerCase(), pin: PIN });
    expect(claim.statusCode).toBe(200);
    const identity = MeSchema.parse(claim.json());
    expect(identity.profile.id).toBe(student.profileId);
    expect(identity.profile.role).toBe('student');
    expect((await h.app.inject({ url: `/schools/${admin.school.id}`, headers: { cookie: cookieFrom(claim.headers) } })).statusCode).toBe(403);
    expect(h.database.db.select().from(users).where(eq(users.id, student.userId)).get()?.pinHash).toMatch(/^\$argon2id\$/);
    expect(h.database.db.select().from(claimCodes).where(eq(claimCodes.id, student.claimId)).get()?.redeemedAt).toBe(h.now());
    const repeat = await h.post('/auth/claim', { code: student.code, pin: '9999' });
    expect(repeat.statusCode).toBe(400);
    expect(ApiErrorSchema.parse(repeat.json()).code).toBe('INVALID_CLAIM_CODE');
    expect((await h.post('/auth/logout', undefined, cookieFrom(claim.headers))).statusCode).toBe(204);
    const login = await h.post('/auth/pin-login', { profileId: student.profileId, pin: PIN });
    expect(login.statusCode).toBe(200);
    expect(login.json()).toEqual(identity);
    expect(h.database.db.select().from(auditLogs).all().map((entry) => entry.action)).toContain('auth.claim');
  });

  it('allows only one winner when two claims race', async () => {
    const admin = MeSchema.parse((await h.register()).json());
    const student = h.createProfile(admin.school.id);
    const results = await Promise.all([
      h.post('/auth/claim', { code: student.code, pin: PIN }),
      h.post('/auth/claim', { code: student.code, pin: '9999' }),
    ]);
    expect(results.map((response) => response.statusCode).sort()).toEqual([200, 400]);
    expect(h.database.db.select().from(sessions).all()).toHaveLength(2);
  });

  it.each([-1, 0])('rejects codes expiring at now + %i without activating the profile', async (offset) => {
    const admin = MeSchema.parse((await h.register()).json());
    const student = h.createProfile(admin.school.id, 'student', h.now() + offset);
    const response = await h.post('/auth/claim', { code: student.code, pin: PIN });
    expect(response.statusCode).toBe(400);
    expect(ApiErrorSchema.parse(response.json()).code).toBe('INVALID_CLAIM_CODE');
    expect(h.database.db.select().from(users).where(eq(users.id, student.userId)).get()?.pinHash).toBeNull();
    expect(h.database.db.select().from(claimCodes).where(eq(claimCodes.id, student.claimId)).get()?.redeemedAt).toBeNull();
  });

  it('rejects unknown codes and codes for non-student profiles', async () => {
    const admin = MeSchema.parse((await h.register()).json());
    const teacher = h.createProfile(admin.school.id, 'teacher');
    for (const code of ['ABCD2345EFGH', teacher.code]) {
      const response = await h.post('/auth/claim', { code, pin: PIN });
      expect(response.statusCode).toBe(400);
      expect(ApiErrorSchema.parse(response.json()).code).toBe('INVALID_CLAIM_CODE');
    }
  });

  it('cannot use a second code to overwrite an activated PIN', async () => {
    const admin = MeSchema.parse((await h.register()).json());
    const student = h.createProfile(admin.school.id);
    await h.post('/auth/claim', { code: student.code, pin: PIN });
    const secondId = randomUUID();
    h.database.db.insert(claimCodes).values({
      id: secondId, codeHash: hashToken('ABCD2345EFGH'), schoolId: admin.school.id,
      profileId: student.profileId, expiresAt: h.now() + 60000, createdAt: h.now(),
    }).run();
    expect((await h.post('/auth/claim', { code: 'ABCD2345EFGH', pin: '9999' })).statusCode).toBe(400);
    expect(h.database.db.select().from(claimCodes).where(eq(claimCodes.id, secondId)).get()?.redeemedAt).toBeNull();
    expect((await h.post('/auth/pin-login', { profileId: student.profileId, pin: PIN })).statusCode).toBe(200);
  });
});

describe('PIN lockout', () => {
  it('locks after three failures, survives correct PINs during lockout, and resets after expiry', async () => {
    const admin = MeSchema.parse((await h.register()).json());
    const student = h.createProfile(admin.school.id);
    await h.post('/auth/claim', { code: student.code, pin: PIN });
    for (let attempt = 1; attempt <= 3; attempt++) {
      const response = await h.post('/auth/pin-login', { profileId: student.profileId, pin: '9999' });
      expect(response.statusCode).toBe(attempt < 3 ? 401 : 429);
    }
    const locked = await h.post('/auth/pin-login', { profileId: student.profileId, pin: PIN });
    expect(locked.statusCode).toBe(429);
    expect(ApiErrorSchema.parse(locked.json()).code).toBe('PIN_LOCKED');
    expect(h.database.db.select().from(users).where(eq(users.id, student.userId)).get()?.failedPinAttempts).toBe(3);
    h.advance(900000);
    expect((await h.post('/auth/pin-login', { profileId: student.profileId, pin: PIN })).statusCode).toBe(200);
    const reset = h.database.db.select().from(users).where(eq(users.id, student.userId)).get();
    expect(reset?.failedPinAttempts).toBe(0);
    expect(reset?.pinLockedUntil).toBeNull();
  });

  it('does not lose failures when PIN requests run concurrently', async () => {
    const admin = MeSchema.parse((await h.register()).json());
    const student = h.createProfile(admin.school.id);
    await h.post('/auth/claim', { code: student.code, pin: PIN });
    const results = await Promise.all(Array.from({ length: 3 }, () => h.post('/auth/pin-login', { profileId: student.profileId, pin: '9999' })));
    expect(results.map((response) => response.statusCode).sort()).toEqual([401, 401, 429]);
    expect((await h.post('/auth/pin-login', { profileId: student.profileId, pin: PIN })).statusCode).toBe(429);
  });

  it('rejects unknown and unclaimed student profiles', async () => {
    const admin = MeSchema.parse((await h.register()).json());
    const student = h.createProfile(admin.school.id);
    for (const profileId of [randomUUID(), student.profileId, admin.profile.id]) {
      const response = await h.post('/auth/pin-login', { profileId, pin: PIN });
      expect(response.statusCode).toBe(401);
      expect(ApiErrorSchema.parse(response.json()).code).toBe('INVALID_CREDENTIALS');
    }
  });
});

describe('authorization and tenant isolation', () => {
  it('allows an administrator to read their school but denies cross-school reads', async () => {
    const registered = await h.register();
    const admin = MeSchema.parse(registered.json());
    const other = MeSchema.parse((await h.register('other@example.test')).json());
    const cookie = cookieFrom(registered.headers);
    const own = await h.app.inject({ url: `/schools/${admin.school.id}`, headers: { cookie } });
    expect(own.statusCode).toBe(200);
    expect(own.json()).toEqual(admin.school);
    const cross = await h.app.inject({ url: `/schools/${other.school.id}`, headers: { cookie } });
    expect(cross.statusCode).toBe(403);
    expect(ApiErrorSchema.parse(cross.json()).code).toBe('SCHOOL_FORBIDDEN');
    expect(cross.body).not.toContain(other.school.id);
  });

  it.each(['admin', 'teacher', 'student', 'parent'] as const)('enforces the %s role on every school read', async (role) => {
    const admin = MeSchema.parse((await h.register()).json());
    const actor = h.roleCookie(admin.school.id, role);
    const me = await h.app.inject({ url: '/me', headers: { cookie: actor.cookie } });
    expect(MeSchema.parse(me.json()).profile.role).toBe(role);
    const school = await h.app.inject({ url: `/schools/${admin.school.id}`, headers: { cookie: actor.cookie } });
    expect(school.statusCode).toBe(role === 'admin' ? 200 : 403);
    if (role !== 'admin') expect(ApiErrorSchema.parse(school.json()).code).toBe('FORBIDDEN');
  });

  it('protects new routes by default and rejects anonymous and forged sessions', async () => {
    h.app.get('/unclassified', async () => ({ protected: true }));
    for (const url of ['/unclassified', '/me', `/schools/${randomUUID()}`]) {
      const response = await h.app.inject({ url });
      expect(response.statusCode).toBe(401);
      expect(ApiErrorSchema.parse(response.json()).code).toBe('UNAUTHENTICATED');
    }
    for (const token of ['bad-cookie', 'a'.repeat(43)]) {
      expect((await h.app.inject({ url: '/me', headers: { cookie: `${COOKIE_NAME}=${token}` } })).statusCode).toBe(401);
    }
  });

  it('enforces school consistency in claim and session foreign keys', async () => {
    const admin = MeSchema.parse((await h.register()).json());
    const other = MeSchema.parse((await h.register('other@example.test')).json());
    const student = h.createProfile(admin.school.id);
    expect(() => h.database.db.insert(claimCodes).values({
      id: randomUUID(), codeHash: hashToken('ABCD2345EFGH'), profileId: student.profileId,
      schoolId: other.school.id, expiresAt: h.now() + 60000, createdAt: h.now(),
    }).run()).toThrow();
    expect(() => h.database.db.insert(sessions).values({
      tokenHash: hashToken('forged'), profileId: student.profileId, schoolId: other.school.id,
      expiresAt: h.now() + 60000, createdAt: h.now(),
    }).run()).toThrow();
  });
});

describe('request hardening', () => {
  it.each([undefined, 'https://attacker.test', `${ORIGIN}/`])('rejects a missing or incorrect Origin (%s)', async (origin) => {
    const response = await h.app.inject({
      method: 'POST', url: '/auth/register-school',
      headers: origin ? { origin } : {},
      payload: { schoolName: 'Test school', name: 'Admin', email: 'admin@example.test', password: PASSWORD },
    });
    expect(response.statusCode).toBe(403);
    expect(ApiErrorSchema.parse(response.json()).code).toBe('CSRF_ORIGIN');
    expect(h.database.db.select().from(users).all()).toHaveLength(0);
  });

  it('rejects cross-origin logout without revoking the session', async () => {
    const cookie = cookieFrom((await h.register()).headers);
    const response = await h.app.inject({ method: 'POST', url: '/auth/logout', headers: { cookie, origin: 'https://attacker.test' } });
    expect(response.statusCode).toBe(403);
    expect((await h.app.inject({ url: '/me', headers: { cookie } })).statusCode).toBe(200);
  });

  it('returns structured field errors and rejects role injection', async () => {
    const response = await h.post('/auth/register-school', {
      schoolName: '', name: '', email: 'not-an-email', password: 'short', role: 'admin',
    });
    expect(response.statusCode).toBe(400);
    const error = ApiErrorSchema.parse(response.json());
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.fields?.email).toBeDefined();
    expect(error.fields?.password).toBeDefined();
    expect(error.fields?._root).toBeDefined();
  });

  it('uses consistent JSON errors for malformed JSON, oversized bodies, and missing routes', async () => {
    const malformed = await h.app.inject({ method: 'POST', url: '/auth/login', headers: { origin: ORIGIN, 'content-type': 'application/json' }, payload: '{' });
    expect(malformed.statusCode).toBe(400);
    expect(ApiErrorSchema.parse(malformed.json()).code).toBe('INVALID_REQUEST');
    const oversized = await h.post('/auth/login', { email: 'a'.repeat(17000), password: PASSWORD });
    expect(oversized.statusCode).toBe(413);
    expect(ApiErrorSchema.parse(oversized.json()).code).toBe('PAYLOAD_TOO_LARGE');
    const cookie = cookieFrom((await h.register()).headers);
    const missing = await h.app.inject({ url: '/not-a-route', headers: { cookie } });
    expect(missing.statusCode).toBe(404);
    expect(ApiErrorSchema.parse(missing.json()).code).toBe('NOT_FOUND');
  });
});
