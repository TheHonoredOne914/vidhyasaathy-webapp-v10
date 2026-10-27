import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { MeSchema, PinLoginSchema, RosterImportResultSchema } from '@vidhyasaathy/contracts';
import { COOKIE_NAME, ORIGIN, PASSWORD, PIN, cookieFrom, createHarness, type Harness } from './helpers.ts';

let h: Harness;
beforeEach(async () => { h = await createHarness(); });
afterEach(async () => { await h.app.close(); h.database.close(); });

async function school(email = 'admin@example.test') {
  const response = await h.post('/auth/register-school', {
    schoolName: 'Flow school', city: 'Mysuru', board: 'cbse', schoolType: 'private',
    phone: '9876543210', name: 'Administrator', email, password: PASSWORD,
  });
  assert.equal(response.statusCode, 201, response.body);
  return { me: MeSchema.parse(response.json()), cookie: cookieFrom(response.headers) };
}

async function structure(cookie: string) {
  const year = await h.post('/admin/academic-years', { name: '2026–27', startsOn: '2026-06-01', endsOn: '2027-03-31' }, cookie);
  assert.equal(year.statusCode, 201, year.body);
  const schoolClass = await h.post('/admin/classes', { academicYearId: year.json().id, name: 'Class 6' }, cookie);
  assert.equal(schoolClass.statusCode, 201, schoolClass.body);
  const section = await h.post('/admin/sections', { classId: schoolClass.json().id, name: 'A' }, cookie);
  const subject = await h.post('/admin/subjects', { classId: schoolClass.json().id, name: 'Mathematics' }, cookie);
  assert.equal(section.statusCode, 201, section.body);
  assert.equal(subject.statusCode, 201, subject.body);
  return { classId: schoolClass.json().id as string, sectionId: section.json().id as string, subjectId: subject.json().id as string };
}

async function student(cookie: string, sectionId: string) {
  const response = await h.post('/admin/import-roster', { sectionId, csv: 'name,rollNumber,phone\nAsha Rao,01,9876543210\n' }, cookie);
  assert.equal(response.statusCode, 200, response.body);
  const entry = RosterImportResultSchema.parse(response.json()).claimCodeSheet.entries[0];
  assert.ok(entry);
  return entry;
}

function get(url: string, cookie: string) {
  return h.app.inject({ method: 'GET', url, headers: { cookie } });
}

test('registration metadata, duplicate confirmation and school details persist without cross-school reads', async () => {
  const owner = await school();
  const duplicate = {
    schoolName: 'FLOW SCHOOL', city: 'mysuru', name: 'Other administrator',
    email: 'other@example.test', password: PASSWORD,
  };
  const warning = await h.post('/auth/register-school', duplicate);
  assert.equal(warning.statusCode, 409);
  assert.equal(warning.json().code, 'DUPLICATE_SCHOOL');
  const confirmed = await h.post('/auth/register-school', { ...duplicate, confirmDuplicate: true });
  assert.equal(confirmed.statusCode, 201, confirmed.body);
  const details = (await get('/admin/school-details', owner.cookie)).json();
  assert.equal(details.city, 'Mysuru');
  assert.equal(details.phone, '9876543210');
  assert.equal('createdAt' in details, false);
  const saved = await h.app.inject({ method: 'PUT', url: '/admin/school-details', headers: { cookie: owner.cookie, origin: ORIGIN }, payload: {
    name: 'Updated school', city: 'Bengaluru', board: 'cbse', schoolType: 'private',
    address: 'School Road', email: 'office@example.test', phone: '9876543210',
  } });
  assert.equal(saved.statusCode, 200, saved.body);
  assert.equal((await get('/me', owner.cookie)).json().school.name, 'Updated school');
  assert.equal((await get('/admin/school-details', cookieFrom(confirmed.headers))).json().name, 'FLOW SCHOOL');
  const denied = h.roleCookie(owner.me.school.id, 'teacher');
  assert.equal((await get('/admin/school-details', denied.cookie)).statusCode, 403);
});

test('teacher roster and student subjects use server-side assignment and school scopes', async () => {
  const owner = await school();
  const assigned = await structure(owner.cookie);
  const entry = await student(owner.cookie, assigned.sectionId);
  const teacher = h.roleCookie(owner.me.school.id, 'teacher');
  assert.equal((await get(`/sections/${assigned.sectionId}/students`, teacher.cookie)).statusCode, 404);
  const assignment = await h.post('/admin/teacher-assignments', { teacherProfileId: teacher.profileId, sectionId: assigned.sectionId, subjectId: assigned.subjectId }, owner.cookie);
  assert.equal(assignment.statusCode, 201, assignment.body);
  const roster = (await get(`/sections/${assigned.sectionId}/students`, teacher.cookie)).json();
  assert.deepEqual(roster, [{ id: entry.profileId, name: 'Asha Rao', rollNumber: '01', activated: false }]);
  const outsider = h.roleCookie((await h.register('foreign@example.test')).json().school.id, 'admin');
  assert.equal((await get(`/sections/${assigned.sectionId}/students`, outsider.cookie)).statusCode, 404);
  const claimed = await h.post('/auth/claim', { code: entry.code, pin: PIN });
  assert.equal(claimed.statusCode, 200, claimed.body);
  const cookie = cookieFrom(claimed.headers);
  assert.deepEqual((await get('/student/enrollment', cookie)).json(), { className: 'Class 6', sectionName: 'A' });
  const subjects = (await get('/student/subjects', cookie)).json();
  assert.equal(subjects.length, 1);
  assert.equal(subjects[0].id, assigned.subjectId);
  assert.equal((await get('/admin/summary', cookie)).statusCode, 403);
  assert.equal((await get(`/sections/${assigned.sectionId}/students`, cookie)).statusCode, 403);
  assert.equal((await get(`/sections/${assigned.sectionId}/students`, teacher.cookie)).json()[0].activated, true);
  assert.deepEqual((await get('/admin/summary', owner.cookie)).json(), { classes: 1, teachers: 1, students: 1, activated: 1, parentLinks: 0 });
  const unassigned = h.roleCookie(owner.me.school.id, 'student');
  assert.deepEqual((await get('/student/subjects', unassigned.cookie)).json(), []);
  assert.deepEqual((await get('/student/enrollment', unassigned.cookie)).json(), { className: null, sectionName: null });
});

test('parent reads only linked children; cross-school links and other role endpoints are denied', async () => {
  const owner = await school();
  const assigned = await structure(owner.cookie);
  const child = await student(owner.cookie, assigned.sectionId);
  const parent = h.roleCookie(owner.me.school.id, 'parent');
  const otherParent = h.roleCookie(owner.me.school.id, 'parent');
  assert.deepEqual((await get('/parent/children', parent.cookie)).json(), []);
  assert.equal((await h.post('/admin/link-parent', { parentProfileId: parent.profileId, studentProfileId: child.profileId }, owner.cookie)).statusCode, 201);
  assert.deepEqual((await get('/parent/children', parent.cookie)).json(), [{ id: child.profileId, name: 'Asha Rao', className: 'Class 6', sectionName: 'A' }]);
  assert.deepEqual((await get('/parent/children', otherParent.cookie)).json(), []);
  const foreign = h.createProfile((await h.register('foreign@example.test')).json().school.id);
  assert.equal((await h.post('/admin/link-parent', { parentProfileId: parent.profileId, studentProfileId: foreign.profileId }, owner.cookie)).statusCode, 404);
  assert.equal((await get('/student/subjects', parent.cookie)).statusCode, 403);
  assert.equal((await get('/parent/children', owner.cookie)).statusCode, 403);
});

test('four-digit PIN, three-attempt lockout and current-device logout', async () => {
  const owner = await school();
  const child = h.createProfile(owner.me.school.id);
  assert.equal(PinLoginSchema.safeParse({ profileId: child.profileId, pin: '12345' }).success, false);
  assert.equal((await h.post('/auth/claim', { code: child.code, pin: PIN })).statusCode, 200);
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const failed = await h.post('/auth/pin-login', { profileId: child.profileId, pin: '9999' });
    assert.equal(failed.statusCode, attempt === 3 ? 429 : 401);
    if (attempt === 3) {
      assert.equal(failed.json().code, 'PIN_LOCKED');
      assert.match(failed.json().message, /parent or teacher/);
      assert.ok(Number(failed.headers['retry-after']) > 0);
    }
  }
  assert.equal((await h.post('/auth/pin-login', { profileId: child.profileId, pin: PIN })).statusCode, 429);
  h.advance(16 * 60 * 1000);
  const first = await h.post('/auth/pin-login', { profileId: child.profileId, pin: PIN });
  const second = await h.post('/auth/pin-login', { profileId: child.profileId, pin: PIN });
  assert.equal(first.statusCode, 200, first.body);
  assert.equal(second.statusCode, 200, second.body);
  const firstCookie = cookieFrom(first.headers);
  const secondCookie = cookieFrom(second.headers);
  assert.notEqual(firstCookie, secondCookie);
  assert.equal((await h.post('/auth/logout', undefined, firstCookie)).statusCode, 204);
  assert.equal((await get('/me', firstCookie)).statusCode, 401);
  assert.equal((await get('/me', secondCookie)).statusCode, 200);
  assert.equal((await get('/admin/summary', `${COOKIE_NAME}=invalid`)).statusCode, 401);
});
