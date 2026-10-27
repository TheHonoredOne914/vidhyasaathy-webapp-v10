import { randomUUID } from 'node:crypto';
import {
  ClaimCodeSchema, ClaimCodeSheetQuerySchema, ImportRosterSchema, IssueClaimCodeSchema,
  RosterImportResultSchema, RosterImportRowSchema, type RosterImportError, type RosterImportResult,
} from '@vidhyasaathy/contracts';
import { parseRosterCsv } from '@vidhyasaathy/core/roster';
import { and, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import type { AuthService } from '../auth/service.ts';
import type { Db } from '../db/index.ts';
import { profiles, sections, users } from '../db/schema.ts';
import { parseInput } from '../errors.ts';
import { found, mutate, scope } from '../school/access.ts';
import type { ClaimIssuance } from '../school/claims.ts';

export function registerRosterRoutes(app: FastifyInstance, db: Db, auth: AuthService, claims: ClaimIssuance, now: () => number): void {
  const adminOptions = { preHandler: requireRole('admin') };
  app.post('/admin/claim-codes', adminOptions, async (request, reply) => {
    const { profileId } = parseInput(IssueClaimCodeSchema, request.body);
    const result = mutate(() => db.transaction(() => {
      const code = claims.issue(requireAuth(request).school.id, profileId);
      auth.audit(request, 'school.issue-claim-code');
      return ClaimCodeSchema.parse(code);
    }));
    return reply.code(201).send(result);
  });
  app.get('/admin/claim-codes', adminOptions, async (request) => {
    const { sectionId } = parseInput(ClaimCodeSheetQuerySchema, request.query);
    const schoolId = requireAuth(request).school.id;
    found(db.select().from(sections).where(scope(sections, schoolId, sectionId)).get());
    return db.transaction(() => {
      const sheet = claims.sheet(schoolId, sectionId);
      auth.audit(request, 'school.read-claim-codes');
      return sheet;
    });
  });
  app.post('/admin/import-roster', { ...adminOptions, bodyLimit: 300000 }, async (request) => {
    const { sectionId, csv, strict } = parseInput(ImportRosterSchema, request.body);
    const schoolId = requireAuth(request).school.id;
    found(db.select().from(sections).where(scope(sections, schoolId, sectionId)).get());
    claims.requireKey();
    const parsed = parseRosterCsv(csv);
    const header = parsed.records.shift();
    const result: RosterImportResult = {
      imported: [], errors: [...parsed.errors], claimCodeSheet: { schoolId, sectionId, entries: [] },
    };
    if (!header || header.fields.length !== 3 || !['name', 'rollNumber', 'phone'].every((field) => header.fields.includes(field))
      || parsed.errors.some((error) => error.row < header.row)) {
      result.errors.push({ row: 1, message: 'CSV header must contain exactly name,rollNumber,phone (in any order).' });
      return RosterImportResultSchema.parse(result);
    }
    if (parsed.records.length + parsed.errors.length > 500) {
      result.errors.push({ row: 1, message: 'Import at most 500 students at a time.' });
      return RosterImportResultSchema.parse(result);
    }
    const nameIndex = header.fields.indexOf('name');
    const rollIndex = header.fields.indexOf('rollNumber');
    const phoneIndex = header.fields.indexOf('phone');
    const valid: { row: number; data: { name: string; rollNumber: string; phone: string } }[] = [];
    const seen = new Set<string>();
    for (const record of parsed.records) {
      if (record.fields.length !== 3) { result.errors.push({ row: record.row, message: 'Expected exactly three CSV fields.' }); continue; }
      const row = RosterImportRowSchema.safeParse({ name: record.fields[nameIndex], rollNumber: record.fields[rollIndex], phone: record.fields[phoneIndex] });
      if (!row.success) {
        const fields: NonNullable<RosterImportError['fields']> = {};
        for (const issue of row.error.issues) (fields[issue.path.join('.')] ??= []).push(issue.message);
        result.errors.push({ row: record.row, message: 'Check the student name, roll number, and parent phone.', fields }); continue;
      }
      if (seen.has(row.data.rollNumber.toLowerCase()) || db.select({ id: profiles.id }).from(profiles).where(and(
        eq(profiles.schoolId, schoolId), eq(profiles.sectionId, sectionId), eq(profiles.rollNumber, row.data.rollNumber),
      )).get()) { result.errors.push({ row: record.row, message: 'This roll number already exists in the section.' }); continue; }
      seen.add(row.data.rollNumber.toLowerCase()); valid.push({ row: record.row, data: row.data });
    }
    result.errors.sort((left, right) => left.row - right.row);
    if (strict && result.errors.length) return RosterImportResultSchema.parse(result);
    return mutate(() => db.transaction(() => {
      for (const record of valid) {
          const entry = (() => {
            const userId = randomUUID();
            const profileId = randomUUID();
            const createdAt = now();
            db.insert(users).values({ id: userId, createdAt }).run();
            db.insert(profiles).values({
              ...record.data, id: profileId, userId, schoolId, sectionId, role: 'student', createdAt,
            }).run();
            const code = claims.issue(schoolId, profileId);
            return { name: record.data.name, rollNumber: record.data.rollNumber, profileId, code: code.code, expiresAt: code.expiresAt };
          })();
          result.imported.push({ row: record.row, profileId: entry.profileId });
          result.claimCodeSheet.entries.push(entry);
      }
      result.errors.sort((left, right) => left.row - right.row);
      auth.audit(request, 'school.import-roster');
      return RosterImportResultSchema.parse(result);
    }));
  });
}
