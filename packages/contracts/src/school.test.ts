import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  AcceptInviteSchema, ImportRosterSchema, InviteTeacherSchema, LinkParentSchema,
  RosterImportResultSchema, RosterImportRowSchema, SaveAcademicYearSchema, SaveClassSchema,
} from './index.ts';

describe('school setup contracts', () => {
  it('validates dates, scoped identifiers and rejects authority supplied by clients', () => {
    expect(SaveAcademicYearSchema.safeParse({ name: 'Year', startsOn: '2026-02-30', endsOn: '2027-03-01' }).success).toBe(false);
    expect(SaveAcademicYearSchema.safeParse({ name: 'Year', startsOn: '2026-04-01', endsOn: '2026-04-01' }).success).toBe(false);
    expect(SaveClassSchema.safeParse({ academicYearId: randomUUID(), name: 'Class', schoolId: randomUUID() }).success).toBe(false);
    expect(LinkParentSchema.safeParse({ parentProfileId: randomUUID(), studentProfileId: 'bad' }).success).toBe(false);
  });

  it('requires assignments and a strong password without accepting an email or role at redemption', () => {
    const assignment = { sectionId: randomUUID(), subjectId: randomUUID() };
    expect(InviteTeacherSchema.parse({ email: ' TEACHER@example.test ', assignments: [assignment] }).email).toBe('teacher@example.test');
    expect(InviteTeacherSchema.safeParse({ email: 'teacher@example.test', assignments: [] }).success).toBe(false);
    expect(InviteTeacherSchema.safeParse({ email: 'teacher@example.test', assignments: [assignment, assignment] }).success).toBe(false);
    expect(AcceptInviteSchema.safeParse({ token: 'a'.repeat(43), name: 'Teacher', password: 'short' }).success).toBe(false);
    expect(AcceptInviteSchema.safeParse({ token: 'a'.repeat(43), name: 'Teacher', password: 'long test password', role: 'admin' }).success).toBe(false);
  });

  it('normalizes roster rows without losing roll-number zeroes and validates physical error rows', () => {
    expect(RosterImportRowSchema.parse({ name: ' Test student ', rollNumber: ' 001 ', phone: ' 9876543210 ' })).toEqual({ name: 'Test student', rollNumber: '001', phone: '9876543210' });
    expect(ImportRosterSchema.safeParse({ sectionId: randomUUID(), csv: 'x'.repeat(262145) }).success).toBe(false);
    const result = { imported: [], errors: [{ row: 3, message: 'Missing name' }], claimCodeSheet: { schoolId: randomUUID(), sectionId: randomUUID(), entries: [] } };
    expect(RosterImportResultSchema.parse(result).errors[0]?.row).toBe(3);
    expect(RosterImportResultSchema.safeParse({ ...result, errors: [{ row: 0, message: 'bad' }] }).success).toBe(false);
  });
});
