import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto';
import type { ClaimCode, ClaimCodeSheet } from '@vidhyasaathy/contracts';
import { CLAIM_CODE_TTL_MS, generateClaimCode } from '@vidhyasaathy/core/claim';
import { and, eq, gt, isNotNull, isNull } from 'drizzle-orm';
import { hashToken } from '../auth/security.ts';
import type { Db } from '../db/index.ts';
import { claimCodes, profiles, users } from '../db/schema.ts';
import { ApiException } from '../errors.ts';
import { found, profileWithRole } from './access.ts';

export function createClaimIssuance(db: Db, encryptionKey: string | undefined, now: () => number) {
  if (encryptionKey !== undefined && !/^[a-fA-F0-9]{64}$/.test(encryptionKey)) {
    throw new Error('CLAIM_CODE_ENCRYPTION_KEY must contain 64 hexadecimal characters.');
  }
  const key = encryptionKey === undefined ? undefined : Buffer.from(encryptionKey, 'hex');

  function requireKey() {
    if (!key) throw new ApiException(503, 'CLAIM_CODES_NOT_CONFIGURED', 'Ask the administrator to configure claim-code printing.');
    return key;
  }

  function issue(schoolId: string, profileId: string): ClaimCode {
    return db.transaction(() => {
      const profile = profileWithRole(db, schoolId, profileId, 'student');
      const encryptionKey = requireKey();
      const user = found(db.select().from(users).where(eq(users.id, profile.userId)).get());
      if (user.pinHash !== null || user.passwordHash !== null) {
        throw new ApiException(409, 'ALREADY_CLAIMED', 'This student has already activated their account.');
      }
      const id = randomUUID();
      const code = generateClaimCode();
      const createdAt = now();
      const expiresAt = createdAt + CLAIM_CODE_TTL_MS;
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
      cipher.setAAD(Buffer.from(`${schoolId}:${profileId}:${id}`));
      const ciphertext = Buffer.concat([cipher.update(code, 'utf8'), cipher.final()]);
      const encryptedCode = [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.');
      db.update(claimCodes).set({ redeemedAt: createdAt, encryptedCode: null }).where(and(
        eq(claimCodes.schoolId, schoolId), eq(claimCodes.profileId, profileId), isNull(claimCodes.redeemedAt),
      )).run();
      db.insert(claimCodes).values({
        id, schoolId, profileId, codeHash: hashToken(code), encryptedCode, expiresAt, createdAt,
      }).run();
      return { schoolId, profileId, code, expiresAt: new Date(expiresAt).toISOString() };
    });
  }

  function sheet(schoolId: string, sectionId: string): ClaimCodeSheet {
    const encryptionKey = requireKey();
    const rows = db.select({
      id: claimCodes.id, profileId: profiles.id, name: profiles.name, rollNumber: profiles.rollNumber,
      encryptedCode: claimCodes.encryptedCode, expiresAt: claimCodes.expiresAt,
    }).from(claimCodes).innerJoin(profiles, and(eq(profiles.id, claimCodes.profileId), eq(profiles.schoolId, claimCodes.schoolId)))
      .innerJoin(users, eq(users.id, profiles.userId)).where(and(
        eq(claimCodes.schoolId, schoolId), eq(profiles.sectionId, sectionId), eq(profiles.role, 'student'),
        isNull(claimCodes.redeemedAt), gt(claimCodes.expiresAt, now()), isNotNull(claimCodes.encryptedCode),
        isNull(users.pinHash), isNull(users.passwordHash),
      )).orderBy(profiles.rollNumber).all();
    const entries = rows.map((row) => {
      let code: string;
      try {
        const [iv, tag, ciphertext] = (row.encryptedCode ?? '').split('.');
        if (!iv || !tag || !ciphertext) throw new Error('Invalid encrypted claim code.');
        const decipher = createDecipheriv('aes-256-gcm', encryptionKey, Buffer.from(iv, 'base64url'));
        decipher.setAAD(Buffer.from(`${schoolId}:${row.profileId}:${row.id}`));
        decipher.setAuthTag(Buffer.from(tag, 'base64url'));
        code = Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8');
      } catch {
        throw new ApiException(503, 'CLAIM_CODE_KEY_UNAVAILABLE', 'Restore the claim-code encryption key or reissue the affected codes.');
      }
      return { profileId: row.profileId, name: row.name, rollNumber: row.rollNumber ?? '', code, expiresAt: new Date(row.expiresAt).toISOString() };
    });
    return { schoolId, sectionId, entries };
  }

  return { requireKey, issue, sheet };
}

export type ClaimIssuance = ReturnType<typeof createClaimIssuance>;
