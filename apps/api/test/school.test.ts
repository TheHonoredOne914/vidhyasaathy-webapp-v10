import { randomUUID } from 'node:crypto';
import {
  AcademicYearSchema, ClaimCodeSchema, ClaimCodeSheetSchema, ClassSchema, InviteTeacherResultSchema,
  MeSchema, ParentLinkSchema, RosterImportResultSchema, SectionSchema, SubjectSchema, TeacherAssignmentSchema,
} from '@vidhyasaathy/contracts';
import { and, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { hashToken } from '../src/auth/security.ts';
import {
  academicYears, claimCodes, classes, invitations, parentLinks, profiles, sections, subjects, teacherAssignments, users,
} from '../src/db/schema.ts';
import { createClaimIssuance } from '../src/school/claims.ts';
import { COOKIE_NAME, ORIGIN, PASSWORD, PIN, cookieFrom, createHarness, type Harness } from './helpers.ts';

let h: Harness;
beforeEach(async () => { h = await createHarness(); });
afterEach(async () => { await h.app.close(); });

async function setup(email?: string) {
  const response = await h.register(email);
  const identity = MeSchema.parse(response.json());
  const cookie = cookieFrom(response.headers);
  const year = await h.post('/admin/academic-years', { name: '2026–27', startsOn: '2026-04-01', endsOn: '2027-03-31' }, cookie);
  expect(year.statusCode).toBe(201);
  const academicYear = AcademicYearSchema.parse(year.json());
  const classResponse = await h.post('/admin/classes', { academicYearId: academicYear.id, name: 'Class 6' }, cookie);
  expect(classResponse.statusCode).toBe(201);
  const schoolClass = ClassSchema.parse(classResponse.json());
  const section = SectionSchema.parse((await h.post('/admin/sections', { classId: schoolClass.id, name: 'A' }, cookie)).json());
  const subject = SubjectSchema.parse((await h.post('/admin/subjects', { classId: schoolClass.id, name: 'Mathematics' }, cookie)).json());
  return { identity, cookie, academicYear, schoolClass, section, subject };
}

async function invite(school: Awaited<ReturnType<typeof setup>>, email = 'teacher@example.test') {
  const response = await h.post('/admin/invite-teacher', {
    email, assignments: [{ sectionId: school.section.id, subjectId: school.subject.id }],
  }, school.cookie);
  expect(response.statusCode).toBe(201);
  return InviteTeacherResultSchema.parse(response.json());
}

describe('teacher invitations and assignment authorization', () => {
  it('accepts once, creates a teacher and hashed password, then permits password login', async () => {
    const school = await setup();
    const invitation = await invite(school);
    const stored = h.database.db.select().from(invitations).get();
    expect(stored?.tokenHash).toBe(hashToken(invitation.token));
    expect(JSON.stringify(stored)).not.toContain(invitation.token);
    const payload = { token: invitation.token, name: 'Test teacher', password: PASSWORD };
    const accepted = await h.post('/auth/accept-invite', payload);
    expect(accepted.statusCode).toBe(201);
    const teacher = MeSchema.parse(accepted.json());
    expect(teacher.school.id).toBe(school.identity.school.id);
    expect(teacher.profile.role).toBe('teacher');
    const user = h.database.db.select().from(users).where(eq(users.id, teacher.profile.userId)).get();
    expect(user?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(h.database.db.select().from(teacherAssignments).get()?.teacherProfileId).toBe(teacher.profile.id);
    expect((await h.post('/auth/accept-invite', payload)).statusCode).toBe(400);
    expect(h.database.db.select().from(profiles).all()).toHaveLength(2);
    expect((await h.post('/auth/login', { email: 'teacher@example.test', password: PASSWORD })).statusCode).toBe(200);
  });

  it('consumes an invitation once when acceptance requests race', async () => {
    const school = await setup();
    const invitation = await invite(school);
    const payload = { token: invitation.token, name: 'Test teacher', password: PASSWORD };
    const responses = await Promise.all([
      h.post('/auth/accept-invite', payload), h.post('/auth/accept-invite', payload),
    ]);
    expect(responses.map((response) => response.statusCode).sort()).toEqual([201, 400]);
    expect(h.database.db.select().from(users).all()).toHaveLength(2);
    expect(h.database.db.select().from(teacherAssignments).all()).toHaveLength(1);
    expect(responses.filter((response) => response.headers['set-cookie'] !== undefined)).toHaveLength(1);
  });

  it('expires at the exact boundary and revokes a superseded invitation', async () => {
    const school = await setup();
    const first = await invite(school);
    const second = await invite(school);
    const payload = { name: 'Test teacher', password: PASSWORD };
    expect((await h.post('/auth/accept-invite', { ...payload, token: first.token })).statusCode).toBe(400);
    h.advance(Date.parse(second.invitation.expiresAt) - h.now());
    expect((await h.post('/auth/accept-invite', { ...payload, token: second.token })).statusCode).toBe(400);
    expect(h.database.db.select().from(profiles).all()).toHaveLength(1);
    expect(h.database.db.select().from(teacherAssignments).all()).toHaveLength(0);
  });

  it('rolls back teacher creation and token consumption if an assignment is no longer valid', async () => {
    const school = await setup();
    const invitation = await invite(school);
    h.database.db.delete(subjects).where(eq(subjects.id, school.subject.id)).run();
    const response = await h.post('/auth/accept-invite', { token: invitation.token, name: 'Test teacher', password: PASSWORD });
    expect(response.statusCode).toBe(404);
    expect(h.database.db.select().from(users).all()).toHaveLength(1);
    expect(h.database.db.select().from(profiles).all()).toHaveLength(1);
    expect(h.database.db.select().from(invitations).get()?.acceptedAt).toBeNull();
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('allows teachers to read only assigned classes, sections and subjects', async () => {
    const school = await setup();
    const otherClass = ClassSchema.parse((await h.post('/admin/classes', { academicYearId: school.academicYear.id, name: 'Class 7' }, school.cookie)).json());
    const otherSection = SectionSchema.parse((await h.post('/admin/sections', { classId: otherClass.id, name: 'A' }, school.cookie)).json());
    const sibling = SectionSchema.parse((await h.post('/admin/sections', { classId: school.schoolClass.id, name: 'B' }, school.cookie)).json());
    await h.post('/admin/subjects', { classId: school.schoolClass.id, name: 'Science' }, school.cookie);
    const invitation = await invite(school);
    const accepted = await h.post('/auth/accept-invite', { token: invitation.token, name: 'Test teacher', password: PASSWORD });
    const cookie = cookieFrom(accepted.headers);
    const get = (url: string) => h.app.inject({ url, headers: { cookie } });
    expect((await get('/classes')).json()).toEqual([school.schoolClass]);
    expect((await get('/sections')).json()).toEqual([school.section]);
    expect((await get('/subjects')).json()).toEqual([school.subject]);
    expect((await get('/academic-years')).json()).toEqual([school.academicYear]);
    expect((await get(`/sections/${school.section.id}`)).statusCode).toBe(200);
    expect((await get(`/classes/${school.schoolClass.id}`)).statusCode).toBe(200);
    for (const id of [sibling.id, otherSection.id]) expect((await get(`/sections/${id}`)).statusCode).toBe(404);
    expect((await get(`/classes/${otherClass.id}`)).statusCode).toBe(404);
    expect((await get('/admin/sections')).statusCode).toBe(403);
    expect((await h.post('/admin/invite-teacher', { email: 'another@example.test', assignments: [] }, cookie)).statusCode).toBe(403);
    const unassigned = h.roleCookie(school.identity.school.id, 'teacher');
    expect((await h.app.inject({ url: '/sections', headers: { cookie: unassigned.cookie } })).json()).toEqual([]);
    expect((await h.app.inject({ url: `/sections/${school.section.id}`, headers: { cookie: unassigned.cookie } })).statusCode).toBe(404);
  });

  it('rejects cross-school targets and class/subject mismatches', async () => {
    const school = await setup();
    const other = await setup('other-admin@example.test');
    const teacher = h.roleCookie(school.identity.school.id, 'teacher');
    const assignment = { teacherProfileId: teacher.profileId, sectionId: school.section.id, subjectId: school.subject.id };
    const created = await h.post('/admin/teacher-assignments', assignment, school.cookie);
    expect(created.statusCode).toBe(201);
    TeacherAssignmentSchema.parse(created.json());
    expect((await h.post('/admin/teacher-assignments', { ...assignment, sectionId: other.section.id }, school.cookie)).statusCode).toBe(404);
    expect((await h.post('/admin/teacher-assignments', assignment, other.cookie)).statusCode).toBe(404);
    expect((await h.post('/admin/invite-teacher', { email: 'cross@example.test', assignments: [{ sectionId: other.section.id, subjectId: other.subject.id }] }, school.cookie)).statusCode).toBe(404);
    const secondClass = ClassSchema.parse((await h.post('/admin/classes', { academicYearId: school.academicYear.id, name: 'Class 8' }, school.cookie)).json());
    const wrongSubject = SubjectSchema.parse((await h.post('/admin/subjects', { classId: secondClass.id, name: 'Science' }, school.cookie)).json());
    expect((await h.post('/admin/teacher-assignments', { ...assignment, subjectId: wrongSubject.id }, school.cookie)).statusCode).toBe(400);
    expect((await h.app.inject({ url: `/sections/${other.section.id}`, headers: { cookie: teacher.cookie } })).statusCode).toBe(404);
  });
});

describe('roster and claim-code sheets', () => {
  it('requires a persistent key, decrypts after service recreation, and rejects tampered ciphertext', async () => {
    const school = await setup();
    const result = RosterImportResultSchema.parse((await h.post('/admin/import-roster', {
      sectionId: school.section.id, csv: 'name,rollNumber,phone\nFirst student,01,9876543210\nSecond student,02,9876543211',
    }, school.cookie)).json());
    const schoolId = school.identity.school.id;
    const disabled = createClaimIssuance(h.database.db, undefined, h.now);
    expect(() => disabled.issue(schoolId, result.imported[0]!.profileId)).toThrow('configure claim-code printing');
    expect(() => disabled.sheet(schoolId, school.section.id)).toThrow('configure claim-code printing');
    expect(h.database.db.select().from(claimCodes).all()).toHaveLength(2);
    const restored = createClaimIssuance(h.database.db, '11'.repeat(32), h.now);
    expect(restored.sheet(schoolId, school.section.id)).toEqual(result.claimCodeSheet);
    const wrongKey = createClaimIssuance(h.database.db, '22'.repeat(32), h.now);
    expect(() => wrongKey.sheet(schoolId, school.section.id)).toThrow('Restore the claim-code encryption key');
    const codes = h.database.db.select().from(claimCodes).all();
    h.database.db.update(claimCodes).set({ encryptedCode: codes[1]!.encryptedCode }).where(eq(claimCodes.id, codes[0]!.id)).run();
    expect(() => restored.sheet(schoolId, school.section.id)).toThrow('Restore the claim-code encryption key');
  });

  it('commits valid rows, reports physical row numbers, and leaves no orphan profiles, users or codes', async () => {
    const school = await setup();
    const csv = 'name,rollNumber,phone\r\n"Test, student",001,9876543210\r\n,002,9876543211\r\nDuplicate,001,9876543212\r\nBad,003,extra,9876543213\r\nbad"quote,004,9876543214\r\nValid,005,9876543215';
    const response = await h.post('/admin/import-roster', { sectionId: school.section.id, csv, strict: false }, school.cookie);
    expect(response.statusCode).toBe(200);
    const result = RosterImportResultSchema.parse(response.json());
    expect(result.imported.map((row) => row.row)).toEqual([2, 7]);
    expect(result.errors.map((row) => row.row)).toEqual([3, 4, 5, 6]);
    expect(result.errors[0]?.fields?.name).toBeDefined();
    expect(h.database.db.select().from(users).all()).toHaveLength(3);
    expect(h.database.db.select().from(profiles).all()).toHaveLength(3);
    expect(h.database.db.select().from(claimCodes).all()).toHaveLength(2);
    const sheetResponse = await h.app.inject({ url: `/admin/claim-codes?sectionId=${school.section.id}`, headers: { cookie: school.cookie } });
    expect(sheetResponse.statusCode).toBe(200);
    expect(sheetResponse.headers['cache-control']).toBe('no-store');
    const sheet = ClaimCodeSheetSchema.parse(sheetResponse.json());
    expect(sheet.entries).toEqual(result.claimCodeSheet.entries);
    for (const entry of sheet.entries) {
      const stored = h.database.db.select().from(claimCodes).where(eq(claimCodes.profileId, entry.profileId)).get();
      expect(stored?.codeHash).toBe(hashToken(entry.code));
      expect(JSON.stringify(stored)).not.toContain(entry.code);
    }
    const repeated = RosterImportResultSchema.parse((await h.post('/admin/import-roster', { sectionId: school.section.id, csv: 'name,rollNumber,phone\nAgain,001,9876543210' }, school.cookie)).json());
    expect(repeated.errors[0]?.row).toBe(2);
    expect(repeated.imported).toEqual([]);
    expect(h.database.db.select().from(users).all()).toHaveLength(3);
  });

  it('issues replacement codes, excludes claimed/expired codes, and permits PIN sign-in after import', async () => {
    const school = await setup();
    const result = RosterImportResultSchema.parse((await h.post('/admin/import-roster', { sectionId: school.section.id, csv: 'name,rollNumber,phone\nStudent,01,9876543210' }, school.cookie)).json());
    const student = result.claimCodeSheet.entries[0]!;
    const issued = await h.post('/admin/claim-codes', { profileId: student.profileId }, school.cookie);
    expect(issued.statusCode).toBe(201);
    const replacement = ClaimCodeSchema.parse(issued.json());
    expect(replacement.code).not.toBe(student.code);
    expect((await h.post('/auth/claim', { code: student.code, pin: PIN })).statusCode).toBe(400);
    expect((await h.post('/auth/claim', { code: replacement.code, pin: PIN })).statusCode).toBe(200);
    expect((await h.post('/auth/pin-login', { profileId: student.profileId, pin: PIN })).statusCode).toBe(200);
    expect((await h.post('/admin/claim-codes', { profileId: student.profileId }, school.cookie)).statusCode).toBe(409);
    const sheet = ClaimCodeSheetSchema.parse((await h.app.inject({ url: `/admin/claim-codes?sectionId=${school.section.id}`, headers: { cookie: school.cookie } })).json());
    expect(sheet.entries).toEqual([]);
    const activeCode = h.database.db.select().from(claimCodes).where(eq(claimCodes.codeHash, hashToken(replacement.code))).get();
    expect(activeCode?.encryptedCode).toBeNull();
    const unclaimed = h.createProfile(school.identity.school.id);
    h.database.db.update(profiles).set({ sectionId: school.section.id, rollNumber: '02' }).where(eq(profiles.id, unclaimed.profileId)).run();
    const expiring = ClaimCodeSchema.parse((await h.post('/admin/claim-codes', { profileId: unclaimed.profileId }, school.cookie)).json());
    h.advance(Date.parse(expiring.expiresAt) - h.now());
    const login = await h.post('/auth/login', { email: 'admin@example.test', password: PASSWORD });
    const expiredSheet = await h.app.inject({ url: `/admin/claim-codes?sectionId=${school.section.id}`, headers: { cookie: cookieFrom(login.headers) } });
    expect(ClaimCodeSheetSchema.parse(expiredSheet.json()).entries).toEqual([]);
  });

  it('rejects bad headers and oversized imports without creating students', async () => {
    const school = await setup();
    for (const csv of ['wrong,header\nStudent,1', 'name,rollNumber,phone\n' + Array.from({ length: 501 }, (_, index) => `Test,${index},9876543210`).join('\n')]) {
      const result = RosterImportResultSchema.parse((await h.post('/admin/import-roster', { sectionId: school.section.id, csv }, school.cookie)).json());
      expect(result.errors.some((error) => error.row === 1)).toBe(true);
      expect(result.imported).toEqual([]);
    }
    expect(h.database.db.select().from(users).all()).toHaveLength(1);
    expect(h.database.db.select().from(claimCodes).all()).toHaveLength(0);
  });

  it('isolates imports, claim issuance and sheets by school and denies teachers access to codes', async () => {
    const school = await setup();
    const other = await setup('other-admin@example.test');
    const student = h.createProfile(other.identity.school.id);
    expect((await h.post('/admin/import-roster', { sectionId: other.section.id, csv: 'name,rollNumber,phone\nStudent,1,9876543210' }, school.cookie)).statusCode).toBe(404);
    expect((await h.post('/admin/claim-codes', { profileId: student.profileId }, school.cookie)).statusCode).toBe(404);
    expect((await h.app.inject({ url: `/admin/claim-codes?sectionId=${other.section.id}`, headers: { cookie: school.cookie } })).statusCode).toBe(404);
    const teacher = h.roleCookie(school.identity.school.id, 'teacher');
    expect((await h.app.inject({ url: `/admin/claim-codes?sectionId=${school.section.id}`, headers: { cookie: teacher.cookie } })).statusCode).toBe(403);
  });
});

describe('school CRUD and role enforcement', () => {
  it('reads, updates and deletes scoped resources and rejects duplicate or referenced records', async () => {
    const school = await setup();
    const resources = [
      ['academic-years', school.academicYear, { name: 'Updated year', startsOn: '2026-04-01', endsOn: '2027-03-31' }],
      ['classes', school.schoolClass, { name: 'Updated class', academicYearId: school.academicYear.id }],
      ['sections', school.section, { name: 'Updated section', classId: school.schoolClass.id }],
      ['subjects', school.subject, { name: 'Updated subject', classId: school.schoolClass.id }],
    ] as const;
    for (const [path, row, payload] of resources) {
      expect((await h.app.inject({ url: `/admin/${path}/${row.id}`, headers: { cookie: school.cookie } })).json()).toEqual(row);
      const updated = await h.app.inject({ method: 'PUT', url: `/admin/${path}/${row.id}`, payload, headers: { cookie: school.cookie, origin: ORIGIN } });
      expect(updated.statusCode).toBe(200);
      expect(updated.json().name).toBe(payload.name);
      expect((await h.post(`/admin/${path}`, { ...payload }, school.cookie)).statusCode).toBe(409);
      expect((await h.app.inject({ url: `/admin/${path}`, headers: { cookie: school.cookie } })).json()).toHaveLength(1);
    }
    expect((await h.app.inject({ method: 'DELETE', url: `/admin/classes/${school.schoolClass.id}`, headers: { cookie: school.cookie, origin: ORIGIN } })).statusCode).toBe(409);
    for (const [path, row] of [...resources].reverse()) {
      expect((await h.app.inject({ method: 'DELETE', url: `/admin/${path}/${row.id}`, headers: { cookie: school.cookie, origin: ORIGIN } })).statusCode).toBe(204);
      expect((await h.app.inject({ url: `/admin/${path}/${row.id}`, headers: { cookie: school.cookie } })).statusCode).toBe(404);
    }
  });

  it('links only a same-school parent and student and enforces roles', async () => {
    const school = await setup();
    const other = await setup('other-admin@example.test');
    const parent = h.roleCookie(school.identity.school.id, 'parent');
    const student = h.createProfile(school.identity.school.id);
    const outsider = h.createProfile(other.identity.school.id);
    const payload = { parentProfileId: parent.profileId, studentProfileId: student.profileId };
    const response = await h.post('/admin/link-parent', payload, school.cookie);
    expect(response.statusCode).toBe(201);
    ParentLinkSchema.parse(response.json());
    expect((await h.post('/admin/link-parent', { ...payload, studentProfileId: outsider.profileId }, school.cookie)).statusCode).toBe(404);
    expect((await h.post('/admin/link-parent', { ...payload, parentProfileId: student.profileId }, school.cookie)).statusCode).toBe(404);
    expect((await h.post('/admin/link-parent', payload, other.cookie)).statusCode).toBe(404);
    expect((await h.post('/admin/link-parent', payload, parent.cookie)).statusCode).toBe(403);
    expect(h.database.db.select().from(parentLinks).all()).toHaveLength(1);
  });

  it('blocks cross-school CRUD identifiers and foreign keys at both API and database boundaries', async () => {
    const school = await setup();
    const other = await setup('other-admin@example.test');
    for (const [path, id] of [['academic-years', other.academicYear.id], ['classes', other.schoolClass.id], ['sections', other.section.id], ['subjects', other.subject.id]]) {
      expect((await h.app.inject({ url: `/admin/${path}`, headers: { cookie: school.cookie } })).json()).toEqual([
        expect.objectContaining({ schoolId: school.identity.school.id }),
      ]);
      expect((await h.app.inject({ url: `/admin/${path}/${id}`, headers: { cookie: school.cookie } })).statusCode).toBe(404);
      expect((await h.app.inject({ method: 'DELETE', url: `/admin/${path}/${id}`, headers: { cookie: school.cookie, origin: ORIGIN } })).statusCode).toBe(404);
    }
    expect((await h.post('/admin/classes', { academicYearId: other.academicYear.id, name: 'Cross-school' }, school.cookie)).statusCode).toBe(404);
    expect((await h.post('/admin/sections', { classId: other.schoolClass.id, name: 'Cross-school' }, school.cookie)).statusCode).toBe(404);
    expect((await h.post('/admin/subjects', { classId: other.schoolClass.id, name: 'Cross-school' }, school.cookie)).statusCode).toBe(404);
    expect(() => h.database.db.insert(classes).values({ id: randomUUID(), schoolId: school.identity.school.id, academicYearId: other.academicYear.id, name: 'Bad' }).run()).toThrow();
    const student = h.createProfile(school.identity.school.id);
    expect(() => h.database.db.update(profiles).set({ sectionId: other.section.id, rollNumber: '1' }).where(eq(profiles.id, student.profileId)).run()).toThrow();
    expect(h.database.db.select().from(sections).all()).toHaveLength(2);
    expect(h.database.db.select().from(academicYears).all()).toHaveLength(2);
  });

  it.each(['teacher', 'student', 'parent'] as const)('denies %s access to every admin resource and mutation', async (role) => {
    const school = await setup();
    const user = h.roleCookie(school.identity.school.id, role);
    for (const path of ['academic-years', 'classes', 'sections', 'subjects']) {
      expect((await h.app.inject({ url: `/admin/${path}`, headers: { cookie: user.cookie } })).statusCode).toBe(403);
      expect((await h.post(`/admin/${path}`, {}, user.cookie)).statusCode).toBe(403);
      expect((await h.app.inject({ method: 'PUT', url: `/admin/${path}/${randomUUID()}`, payload: {}, headers: { cookie: user.cookie, origin: ORIGIN } })).statusCode).toBe(403);
      expect((await h.app.inject({ method: 'DELETE', url: `/admin/${path}/${randomUUID()}`, headers: { cookie: user.cookie, origin: ORIGIN } })).statusCode).toBe(403);
    }
    for (const path of ['invite-teacher', 'import-roster', 'link-parent', 'teacher-assignments', 'claim-codes']) {
      expect((await h.post(`/admin/${path}`, {}, user.cookie)).statusCode).toBe(403);
    }
    if (role === 'student') for (const path of ['classes', 'sections', 'subjects', 'academic-years']) {
      expect((await h.app.inject({ url: `/${path}`, headers: { cookie: user.cookie } })).statusCode).toBe(403);
    }
  });

  it('limits parent academic lookups to linked children and removes access immediately on unlink', async () => {
    const school = await setup();
    const other = await setup('other-admin@example.test');
    const parent = h.roleCookie(school.identity.school.id, 'parent');
    const student = h.createProfile(school.identity.school.id);
    const get = (path: string) => h.app.inject({ url: path, headers: { cookie: parent.cookie } });
    for (const path of ['classes', 'sections', 'subjects', 'academic-years']) {
      expect((await get(`/${path}`)).json()).toEqual([]);
    }
    h.database.db.update(profiles).set({ sectionId: school.section.id, rollNumber: '1' }).where(eq(profiles.id, student.profileId)).run();
    const link = { id: randomUUID(), schoolId: school.identity.school.id, parentProfileId: parent.profileId, studentProfileId: student.profileId };
    h.database.db.insert(parentLinks).values(link).run();
    for (const [path, row] of [['classes', school.schoolClass], ['sections', school.section], ['subjects', school.subject], ['academic-years', school.academicYear]] as const) {
      expect((await get(`/${path}`)).json()).toEqual([row]);
    }
    expect((await get(`/sections/${school.section.id}`)).statusCode).toBe(200);
    expect((await get(`/classes/${school.schoolClass.id}`)).statusCode).toBe(200);
    expect((await get(`/sections/${other.section.id}`)).statusCode).toBe(404);
    expect((await get(`/classes/${other.schoolClass.id}`)).statusCode).toBe(404);
    h.database.db.delete(parentLinks).where(eq(parentLinks.id, link.id)).run();
    expect((await get('/sections')).json()).toEqual([]);
    expect((await get(`/sections/${school.section.id}`)).statusCode).toBe(404);
  });

  it('requires authentication, validates inputs and checks CSRF even for public invite acceptance', async () => {
    const school = await setup();
    expect((await h.app.inject({ url: '/sections' })).statusCode).toBe(401);
    expect((await h.post('/admin/academic-years', { name: 'Bad', startsOn: '2026-04-01', endsOn: '2025-04-01' }, school.cookie)).statusCode).toBe(400);
    expect((await h.app.inject({ method: 'POST', url: '/admin/import-roster', headers: { cookie: school.cookie }, payload: {} })).statusCode).toBe(403);
    expect((await h.app.inject({ method: 'POST', url: '/auth/accept-invite', headers: { origin: 'https://evil.test' }, payload: {} })).statusCode).toBe(403);
    expect((await h.app.inject({ method: 'POST', url: '/admin/claim-codes', headers: { cookie: school.cookie.replace(COOKIE_NAME, 'invalid'), origin: ORIGIN }, payload: {} })).statusCode).toBe(401);
    expect(h.database.db.select().from(profiles).where(and(eq(profiles.schoolId, school.identity.school.id), eq(profiles.role, 'student'))).all()).toHaveLength(0);
  });
});
