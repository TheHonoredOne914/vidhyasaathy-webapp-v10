import { ClaimSchema } from '@vidhyasaathy/contracts';
import { isClaimCodeExpired } from '@vidhyasaathy/core/claim';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import type { AuthService } from '../auth/service.ts';
import { hashCredential, hashToken } from '../auth/security.ts';
import type { Db } from '../db/index.ts';
import { claimCodes, users } from '../db/schema.ts';
import { ApiException, parseInput } from '../errors.ts';

function invalidClaim(): ApiException {
  return new ApiException(400, 'INVALID_CLAIM_CODE', 'The activation code is invalid, expired, or already used.');
}

export function registerClaimRoute(app: FastifyInstance, db: Db, auth: AuthService, now: () => number): void {
  app.post('/auth/claim', { config: { public: true } }, async (request, reply) => {
    const input = parseInput(ClaimSchema, request.body);
    const codeHash = hashToken(input.code);
    const code = db.select().from(claimCodes).where(eq(claimCodes.codeHash, codeHash)).get();
    if (!code || code.redeemedAt !== null || isClaimCodeExpired(code.expiresAt, now())) throw invalidClaim();
    const pinHash = await hashCredential(input.pin);
    return auth.startSession(request, reply, 'auth.claim', () => {
      const identity = auth.identityForProfile(code.profileId);
      if (identity.profile.role !== 'student' || identity.school.id !== code.schoolId) throw invalidClaim();
      const redeemed = db.update(claimCodes).set({ redeemedAt: now(), encryptedCode: null }).where(and(
        eq(claimCodes.id, code.id), isNull(claimCodes.redeemedAt), gt(claimCodes.expiresAt, now()),
      )).run();
      if (redeemed.changes !== 1) throw invalidClaim();
      const activated = db.update(users).set({ pinHash, failedPinAttempts: 0, pinLockedUntil: null })
        .where(and(eq(users.id, identity.profile.userId), isNull(users.pinHash), isNull(users.passwordHash))).run();
      if (activated.changes !== 1) throw invalidClaim();
      return identity;
    });
  });
}
