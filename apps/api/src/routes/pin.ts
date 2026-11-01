import { PinLoginSchema } from '@vidhyasaathy/contracts';
import { and, eq } from 'drizzle-orm';
import type { FastifyInstance, FastifyReply } from 'fastify';
import type { AuthOptions, AuthService } from '../auth/service.ts';
import { demoLooseAuthEnabled } from '../auth/demo-loose.ts';
import { verifyCredential } from '../auth/security.ts';
import { DEMO_SCHOOL_ID } from '../db/demo.ts';
import type { Db } from '../db/index.ts';
import { profiles, users } from '../db/schema.ts';
import { ApiException, parseInput } from '../errors.ts';

const looseAuth = demoLooseAuthEnabled;

function pinLocked(reply: FastifyReply, lockedUntil: number, now: number): ApiException {
  reply.header('Retry-After', Math.max(1, Math.ceil((lockedUntil - now) / 1000)));
  return new ApiException(429, 'PIN_LOCKED', 'Too many incorrect PINs. Ask a parent or teacher for help, or try again after the lockout ends.');
}

export function registerPinRoute(app: FastifyInstance, db: Db, auth: AuthService, options: AuthOptions, dummyHash: string): void {
  app.get('/auth/demo/students', { config: { public: true } }, async () => {
    if (!looseAuth()) throw new ApiException(404, 'NOT_FOUND', 'Not available.');
    const rows = db.select({ id: profiles.id, name: profiles.name, school: profiles.schoolId }).from(profiles)
      .where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.role, 'student'))).all();
    return { students: rows };
  });

  app.post('/auth/pin-login', { config: { public: true } }, async (request, reply) => {
    const body = typeof request.body === 'object' && request.body !== null ? request.body as Record<string, unknown> : {};
    const input = looseAuth()
      ? { profileId: typeof body.profileId === 'string' ? body.profileId : '', pin: typeof body.pin === 'string' ? body.pin : 'demo' }
      : parseInput(PinLoginSchema, request.body);
    const record = db.select({ user: users, role: profiles.role }).from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id)).where(eq(profiles.id, input.profileId)).get();
    const user = record?.role === 'student' ? record.user : undefined;
    if (!looseAuth() && user?.pinLockedUntil && user.pinLockedUntil > options.now()) throw pinLocked(reply, user.pinLockedUntil, options.now());
    if (looseAuth() && user) {
      return auth.startSession(request, reply, 'auth.pin-login', () => auth.identityForProfile(input.profileId));
    }
    const valid = await verifyCredential(user?.pinHash ?? dummyHash, input.pin);
    if (!user?.pinHash) throw new ApiException(401, 'INVALID_CREDENTIALS', 'The credentials are incorrect.');

    if (!valid) {
      const lockedUntil = db.transaction(() => {
        const current = db.select().from(users).where(eq(users.id, user.id)).get();
        if (!current) throw new ApiException(401, 'INVALID_CREDENTIALS', 'The credentials are incorrect.');
        if (current.pinLockedUntil && current.pinLockedUntil > options.now()) return current.pinLockedUntil;
        const attempts = (current.pinLockedUntil !== null ? 0 : current.failedPinAttempts) + 1;
        const until = attempts >= 3 ? options.now() + options.pinLockoutMs : null;
        db.update(users).set({ failedPinAttempts: attempts, pinLockedUntil: until }).where(eq(users.id, user.id)).run();
        return until;
      });
      if (lockedUntil !== null) {
        throw pinLocked(reply, lockedUntil, options.now());
      }
      throw new ApiException(401, 'INVALID_CREDENTIALS', 'The credentials are incorrect.');
    }

    return auth.startSession(request, reply, 'auth.pin-login', () => {
      const current = db.select().from(users).where(eq(users.id, user.id)).get();
      if (current?.pinLockedUntil && current.pinLockedUntil > options.now()) throw pinLocked(reply, current.pinLockedUntil, options.now());
      if (!current || current.pinHash !== user.pinHash) throw new ApiException(401, 'INVALID_CREDENTIALS', 'The credentials are incorrect.');
      db.update(users).set({ failedPinAttempts: 0, pinLockedUntil: null }).where(eq(users.id, user.id)).run();
      return auth.identityForProfile(input.profileId);
    });
  });
}
