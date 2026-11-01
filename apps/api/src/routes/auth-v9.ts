import { randomInt, randomUUID } from 'node:crypto';
import { StudentLookupSchema, StudentActivateSchema, OtpVerifySchema, SetPinSchema, ParentOtpRequestSchema } from '@vidhyasaathy/contracts';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { demoLooseAuthEnabled } from '../auth/demo-loose.ts';
import type { AuthOptions, AuthService } from '../auth/service.ts';
import { hashCredential, hashToken, generateSessionToken } from '../auth/security.ts';
import type { Db } from '../db/index.ts';
import { claimCodes, otpChallenges, parentLinks, profiles, schools, users } from '../db/schema.ts';
import { DEMO_SCHOOL_ID } from '../db/demo.ts';
import { ApiException, parseInput } from '../errors.ts';

const OTP_TTL = 10 * 60 * 1000;
const phoneMask = (phone: string) => phone ? `${'*'.repeat(Math.max(0, phone.length - 4))}${phone.slice(-4)}` : 'a parent phone number';
const otpCode = () => String(randomInt(100000, 1000000));
const token = () => generateSessionToken();
/** Prototype convenience: when DEMO_LOOSE_AUTH=true, any phone falls back to the demo parent and any OTP is accepted. */
const looseAuth = demoLooseAuthEnabled;
/**
 * student_verify challenges move through three stages. The stage lives in code_hash so no migration is needed:
 * lookup rows hold LOOKUP_PREFIX + claim-code hash, OTP rows hold the OTP hash (hex), and PIN grants hold PIN_GRANT.
 * None of these values can collide: hashes are 64 hex chars and the markers contain ':'.
 */
const LOOKUP_PREFIX = 'stage:lookup:';
const PIN_GRANT = 'stage:pin-grant';
const isOtpStage = (codeHash: string) => /^[0-9a-f]{64}$/.test(codeHash);

export function registerAuthV9Routes(app: FastifyInstance, db: Db, auth: AuthService, options: AuthOptions): void {
  function issueOtp(input: { schoolId: string; profileId: string; phone: string; purpose: 'student_verify' | 'parent_login' | 'teacher_pin'; claimCodeId?: string }) {
    const rawToken = token(); const code = otpCode(); const now = options.now();
    // A resend invalidates earlier live codes so each new request cannot add more guesses.
    db.update(otpChallenges).set({ expiresAt: now }).where(and(eq(otpChallenges.profileId, input.profileId), eq(otpChallenges.purpose, input.purpose), gt(otpChallenges.expiresAt, now))).run();
    db.insert(otpChallenges).values({ id: randomUUID(), tokenHash: hashToken(rawToken), schoolId: input.schoolId, profileId: input.profileId, claimCodeId: input.claimCodeId ?? null, phone: input.phone, purpose: input.purpose, codeHash: hashToken(code), expiresAt: now + OTP_TTL, attempts: 0 }).run();
    // Never log or return OTP values in production; only local development shows them.
    const disclose = process.env.NODE_ENV !== 'production';
    if (disclose) console.info(`[DEV OTP] ${input.purpose}: ${code}`);
    return { otpToken: rawToken, otp: disclose ? code : undefined };
  }
  app.post('/auth/student/lookup', { config: { public: true } }, async (request) => {
    const input = parseInput(StudentLookupSchema, request.body);
    const school = input.schoolId ? db.select().from(schools).where(eq(schools.id, input.schoolId)).get() : db.select().from(schools).where(eq(schools.name, input.slug!)).get();
    if (!school) throw new ApiException(404, 'STUDENT_NOT_FOUND', 'We could not find that student.');
    const matches = db.select({ profile: profiles, claim: claimCodes }).from(profiles).leftJoin(claimCodes, and(eq(claimCodes.profileId, profiles.id), eq(claimCodes.schoolId, school.id), isNull(claimCodes.redeemedAt), gt(claimCodes.expiresAt, options.now()))).where(and(eq(profiles.schoolId, school.id), eq(profiles.role, 'student'), eq(profiles.rollNumber, input.rollNo), input.sectionId ? eq(profiles.sectionId, input.sectionId) : undefined)).all();
    // Roll numbers are unique per section only; never guess between two students.
    if (new Set(matches.map((m) => m.profile.id)).size > 1) throw new ApiException(409, 'STUDENT_AMBIGUOUS', 'More than one student has that roll number. Choose your class and section.');
    const row = matches[0];
    if (!row || !row.profile.phone || !row.claim) throw new ApiException(404, 'STUDENT_NOT_FOUND', 'We could not find an activatable student record.');
    const lookup = token();
    db.insert(otpChallenges).values({ id: randomUUID(), tokenHash: hashToken(lookup), schoolId: school.id, profileId: row.profile.id, claimCodeId: row.claim.id, phone: row.profile.phone, purpose: 'student_verify', codeHash: `${LOOKUP_PREFIX}${row.claim.codeHash}`, expiresAt: options.now() + OTP_TTL, attempts: 0 }).run();
    return { lookupToken: lookup, name: row.profile.name, school: school.name, maskedParentPhone: phoneMask(row.profile.phone), needsActivation: true };
  });
  app.post('/auth/student/activate', { config: { public: true } }, async (request) => {
    const input = parseInput(StudentActivateSchema, request.body); const row = db.select().from(otpChallenges).where(and(eq(otpChallenges.tokenHash, hashToken(input.lookupToken)), eq(otpChallenges.purpose, 'student_verify'), gt(otpChallenges.expiresAt, options.now()))).get();
    if (!row || !row.codeHash.startsWith(LOOKUP_PREFIX) || row.attempts >= 5) throw new ApiException(400, 'INVALID_ACTIVATION', 'The activation code is invalid or expired.');
    if (`${LOOKUP_PREFIX}${hashToken(input.activationCode)}` !== row.codeHash) { db.update(otpChallenges).set({ attempts: row.attempts + 1 }).where(eq(otpChallenges.id, row.id)).run(); throw new ApiException(400, 'INVALID_ACTIVATION', 'The activation code is invalid or expired.'); }
    const result = issueOtp({ schoolId: row.schoolId, profileId: row.profileId!, phone: row.phone, purpose: 'student_verify', claimCodeId: row.claimCodeId! });
    db.delete(otpChallenges).where(eq(otpChallenges.id, row.id)).run();
    return { ...result, maskedParentPhone: phoneMask(row.phone) };
  });
  app.post('/auth/student/verify-otp', { config: { public: true } }, async (request) => verifyOtp(db, request.body, 'student_verify', options.now(), 'PIN_REQUIRED'));
  app.post('/auth/student/set-pin', { config: { public: true } }, async (request, reply) => {
    const input = parseInput(SetPinSchema, request.body); const row = db.select().from(otpChallenges).where(and(eq(otpChallenges.tokenHash, hashToken(input.pinToken)), eq(otpChallenges.purpose, 'student_verify'), gt(otpChallenges.expiresAt, options.now()))).get();
    if (!row || !row.profileId) throw new ApiException(400, 'INVALID_PIN_TOKEN', 'This PIN setup link has expired.');
    // Only a verified, single-use PIN grant may set a PIN. Lookup and unverified OTP tokens never qualify.
    if (row.codeHash !== PIN_GRANT) throw new ApiException(400, 'INVALID_PIN_TOKEN', 'This PIN setup link has expired.');
    const profile = db.select().from(profiles).where(and(eq(profiles.id, row.profileId), eq(profiles.role, 'student'))).get(); if (!profile) throw new ApiException(400, 'INVALID_PIN_TOKEN', 'This PIN setup link has expired.');
    const pinHash = await hashCredential(input.pin);
    const invalid = () => new ApiException(400, 'INVALID_PIN_TOKEN', 'This PIN setup link has expired.');
    db.transaction(() => {
      // Re-check after the async hash: consume the grant atomically so concurrent requests cannot both succeed.
      const consumed = db.delete(otpChallenges).where(and(eq(otpChallenges.id, row.id), eq(otpChallenges.codeHash, PIN_GRANT), gt(otpChallenges.expiresAt, options.now()))).run();
      if (consumed.changes !== 1) throw invalid();
      if (row.claimCodeId) {
        const claimed = db.update(claimCodes).set({ redeemedAt: options.now(), encryptedCode: null }).where(and(eq(claimCodes.id, row.claimCodeId), eq(claimCodes.profileId, profile.id), isNull(claimCodes.redeemedAt), gt(claimCodes.expiresAt, options.now()))).run();
        if (claimed.changes !== 1) throw invalid();
      }
      const updated = db.update(users).set({ pinHash, failedPinAttempts: 0, pinLockedUntil: null }).where(and(eq(users.id, profile.userId), isNull(users.pinHash))).run();
      if (updated.changes !== 1) throw invalid();
    });
    return auth.startSession(request, reply, 'auth.student.set-pin', () => auth.identityForProfile(profile.id));
  });
  app.post('/auth/teacher/set-pin', { config: { public: true } }, async (request, reply) => {
    const input = parseInput(SetPinSchema, request.body); const row = db.select().from(otpChallenges).where(and(eq(otpChallenges.tokenHash, hashToken(input.pinToken)), eq(otpChallenges.purpose, 'teacher_pin'), gt(otpChallenges.expiresAt, options.now()))).get();
    if (!row?.profileId) throw new ApiException(400, 'INVALID_PIN_TOKEN', 'This PIN setup link has expired.');
    const profile = db.select().from(profiles).where(and(eq(profiles.id, row.profileId), eq(profiles.role, 'teacher'))).get();
    if (!profile) throw new ApiException(400, 'INVALID_PIN_TOKEN', 'This PIN setup link has expired.');
    const pinHash = await hashCredential(input.pin);
    db.transaction(() => {
      const consumed = db.delete(otpChallenges).where(and(eq(otpChallenges.id, row.id), gt(otpChallenges.expiresAt, options.now()))).run();
      if (consumed.changes !== 1) throw new ApiException(400, 'INVALID_PIN_TOKEN', 'This PIN setup link has expired.');
      const updated = db.update(users).set({ pinHash, failedPinAttempts: 0, pinLockedUntil: null }).where(and(eq(users.id, profile.userId), isNull(users.pinHash))).run();
      if (updated.changes !== 1) throw new ApiException(400, 'INVALID_PIN_TOKEN', 'This PIN setup link has expired.');
    });
    return auth.startSession(request, reply, 'auth.teacher.set-pin', () => auth.identityForProfile(profile.id));
  });
  app.post('/auth/parent/request-otp', { config: { public: true } }, async (request) => {
    const values = typeof request.body === 'object' && request.body !== null ? request.body as Record<string, unknown> : {};
    const { phone } = looseAuth() ? { phone: typeof values.phone === 'string' ? values.phone : '' } : parseInput(ParentOtpRequestSchema, request.body);
    let row = db.select({ profile: profiles, school: schools }).from(profiles).innerJoin(schools, eq(schools.id, profiles.schoolId)).where(and(eq(profiles.role, 'parent'), eq(profiles.phone, phone))).get();
    if (!row && looseAuth()) row = db.select({ profile: profiles, school: schools }).from(profiles).innerJoin(schools, eq(schools.id, profiles.schoolId)).where(and(eq(profiles.role, 'parent'), eq(profiles.schoolId, DEMO_SCHOOL_ID))).get();
    if (!row || !db.select({ id: parentLinks.id }).from(parentLinks).where(and(eq(parentLinks.parentProfileId, row.profile.id), eq(parentLinks.schoolId, row.school.id))).get()) throw new ApiException(404, 'PARENT_NOT_FOUND', 'No parent account uses that phone number.');
    return issueOtp({ schoolId: row.school.id, profileId: row.profile.id, phone: row.profile.phone, purpose: 'parent_login' });
  });
  app.post('/auth/parent/verify-otp', { config: { public: true } }, async (request, reply) => { const result = await verifyOtp(db, request.body, 'parent_login', options.now(), 'OTP_VERIFIED'); return auth.startSession(request, reply, 'auth.parent.otp', () => auth.identityForProfile(result.profileId)); });
}

async function verifyOtp(db: Db, body: unknown, purpose: 'student_verify' | 'parent_login', now: number, successCode: string) {
  const values = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
  const input = looseAuth()
    ? { otpToken: typeof values.otpToken === 'string' ? values.otpToken : '', otp: typeof values.otp === 'string' ? values.otp : '' }
    : parseInput(OtpVerifySchema, body);
  const row = db.select().from(otpChallenges).where(and(eq(otpChallenges.tokenHash, hashToken(input.otpToken)), eq(otpChallenges.purpose, purpose), gt(otpChallenges.expiresAt, now))).get();
  const otpOk = looseAuth() || (row && isOtpStage(row.codeHash) && hashToken(input.otp) === row.codeHash);
  if (!row || (!looseAuth() && row.attempts >= 5) || !otpOk) { if (row && !looseAuth()) db.update(otpChallenges).set({ attempts: row.attempts + 1 }).where(eq(otpChallenges.id, row.id)).run(); throw new ApiException(400, 'INVALID_OTP', 'That OTP is incorrect or expired.'); }
  if (purpose === 'student_verify') { const next = token(); db.update(otpChallenges).set({ tokenHash: hashToken(next), codeHash: PIN_GRANT, expiresAt: now + OTP_TTL }).where(eq(otpChallenges.id, row.id)).run(); return { pinToken: next, profileId: row.profileId!, code: successCode }; }
  db.delete(otpChallenges).where(eq(otpChallenges.id, row.id)).run(); return { profileId: row.profileId!, code: successCode };
}
