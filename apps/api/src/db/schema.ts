import { RoleSchema, type AiDraft, type Answer, type AskResponse, type ConceptLesson, type NotificationChannel, type RemediationResult, type SaveItem } from '@vidhyasaathy/contracts';
import { sql } from 'drizzle-orm';
import { check, foreignKey, index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
export * from './schema-phase4.ts';

export const schools = sqliteTable('school', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  city: text('city').notNull().default(''),
  board: text('board').notNull().default(''),
  schoolType: text('school_type').notNull().default(''),
  address: text('address').notNull().default(''),
  recordingsAllowed: integer('recordings_allowed', { mode: 'boolean' }).notNull().default(false),
  email: text('email').notNull().default(''),
  phone: text('phone').notNull().default(''),
  createdAt: integer('created_at').notNull(),
});

export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  pinHash: text('pin_hash'),
  failedPinAttempts: integer('failed_pin_attempts').notNull().default(0),
  pinLockedUntil: integer('pin_locked_until'),
  createdAt: integer('created_at').notNull(),
}, (table) => [
  check('user_pin_attempts_nonnegative', sql`${table.failedPinAttempts} >= 0`),
]);

export const profiles = sqliteTable('profile', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id),
  schoolId: text('school_id').notNull().references(() => schools.id),
  name: text('name').notNull(),
  role: text('role', { enum: RoleSchema.options }).notNull(),
  sectionId: text('section_id').references(() => sections.id),
  rollNumber: text('roll_number'),
  phone: text('phone').notNull().default(''),
  createdAt: integer('created_at').notNull(),
}, (table) => [
  uniqueIndex('profile_id_school_unique').on(table.id, table.schoolId),
  index('profile_school_idx').on(table.schoolId),
  check('profile_role_valid', sql`${table.role} in ('admin', 'teacher', 'student', 'parent')`),
  uniqueIndex('profile_section_roll_unique').on(table.schoolId, table.sectionId, table.rollNumber),
  // Migration triggers enforce same-school student enrollment without rebuilding P1 profiles.
]);

export const claimCodes = sqliteTable('claim_code', {
  id: text('id').primaryKey(),
  codeHash: text('code_hash').notNull().unique(),
  encryptedCode: text('encrypted_code'),
  schoolId: text('school_id').notNull().references(() => schools.id),
  profileId: text('profile_id').notNull(),
  expiresAt: integer('expires_at').notNull(),
  redeemedAt: integer('redeemed_at'),
  createdAt: integer('created_at').notNull(),
}, (table) => [
  foreignKey({ columns: [table.profileId, table.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  index('claim_code_profile_idx').on(table.profileId),
]);

export const sessions = sqliteTable('session', {
  tokenHash: text('token_hash').primaryKey(),
  profileId: text('profile_id').notNull(),
  schoolId: text('school_id').notNull().references(() => schools.id),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at').notNull(),
}, (table) => [
  foreignKey({ columns: [table.profileId, table.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  index('session_expiry_idx').on(table.expiresAt),
  index('session_profile_idx').on(table.profileId),
]);

export const auditLogs = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').references(() => schools.id),
  profileId: text('profile_id').references(() => profiles.id),
  action: text('action').notNull(),
  requestId: text('request_id').notNull(),
  createdAt: integer('created_at').notNull(),
}, (table) => [index('audit_log_school_time_idx').on(table.schoolId, table.createdAt)]);

export const rateLimits = sqliteTable('rate_limit', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, (table) => [index('rate_limit_expiry_idx').on(table.expiresAt)]);

export const academicYears = sqliteTable('academic_year', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id),
  name: text('name').notNull(),
  startsOn: text('starts_on').notNull(),
  endsOn: text('ends_on').notNull(),
}, (table) => [
  uniqueIndex('academic_year_id_school_unique').on(table.id, table.schoolId),
  uniqueIndex('academic_year_name_unique').on(table.schoolId, table.name),
  check('academic_year_dates_valid', sql`${table.endsOn} > ${table.startsOn}`),
]);

export const classes = sqliteTable('class', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id),
  academicYearId: text('academic_year_id').notNull(),
  name: text('name').notNull(),
}, (table) => [
  uniqueIndex('class_id_school_unique').on(table.id, table.schoolId),
  uniqueIndex('class_name_unique').on(table.schoolId, table.academicYearId, table.name),
  foreignKey({ columns: [table.academicYearId, table.schoolId], foreignColumns: [academicYears.id, academicYears.schoolId] }),
]);

export const sections = sqliteTable('section', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id),
  classId: text('class_id').notNull(),
  name: text('name').notNull(),
}, (table) => [
  uniqueIndex('section_id_school_unique').on(table.id, table.schoolId),
  uniqueIndex('section_id_class_school_unique').on(table.id, table.classId, table.schoolId),
  uniqueIndex('section_name_unique').on(table.schoolId, table.classId, table.name),
  foreignKey({ columns: [table.classId, table.schoolId], foreignColumns: [classes.id, classes.schoolId] }),
]);

export const subjects = sqliteTable('subject', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id),
  classId: text('class_id').notNull(),
  name: text('name').notNull(),
}, (table) => [
  uniqueIndex('subject_id_school_unique').on(table.id, table.schoolId),
  uniqueIndex('subject_id_class_school_unique').on(table.id, table.classId, table.schoolId),
  uniqueIndex('subject_name_unique').on(table.schoolId, table.classId, table.name),
  foreignKey({ columns: [table.classId, table.schoolId], foreignColumns: [classes.id, classes.schoolId] }),
]);

export const teacherAssignments = sqliteTable('teacher_assignment', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id),
  teacherProfileId: text('teacher_profile_id').notNull(),
  sectionId: text('section_id').notNull(),
  subjectId: text('subject_id').notNull(),
  classId: text('class_id').notNull(),
}, (table) => [
  uniqueIndex('teacher_assignment_unique').on(table.schoolId, table.teacherProfileId, table.sectionId, table.subjectId),
  foreignKey({ columns: [table.teacherProfileId, table.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [table.sectionId, table.classId, table.schoolId], foreignColumns: [sections.id, sections.classId, sections.schoolId] }),
  foreignKey({ columns: [table.subjectId, table.classId, table.schoolId], foreignColumns: [subjects.id, subjects.classId, subjects.schoolId] }),
]);

export const parentLinks = sqliteTable('parent_link', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id),
  parentProfileId: text('parent_profile_id').notNull(),
  studentProfileId: text('student_profile_id').notNull(),
}, (table) => [
  uniqueIndex('parent_link_unique').on(table.schoolId, table.parentProfileId, table.studentProfileId),
  foreignKey({ columns: [table.parentProfileId, table.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [table.studentProfileId, table.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
]);

export const invitations = sqliteTable('invitation', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  assignments: text('assignments', { mode: 'json' }).notNull().$type<{ sectionId: string; subjectId: string }[]>(),
  expiresAt: integer('expires_at').notNull(),
  acceptedAt: integer('accepted_at'),
  createdAt: integer('created_at').notNull(),
}, (table) => [index('invitation_school_email_idx').on(table.schoolId, table.email)]);

export const chapters = sqliteTable('chapter', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(),
  subjectId: text('subject_id').notNull(), title: text('title').notNull(), position: integer('position').notNull(),
}, (t) => [
  uniqueIndex('chapter_id_school_unique').on(t.id, t.schoolId),
  index('chapter_subject_idx').on(t.schoolId, t.subjectId, t.position),
  foreignKey({ columns: [t.subjectId, t.schoolId], foreignColumns: [subjects.id, subjects.schoolId] }),
  check('chapter_position_valid', sql`${t.position} >= 0`),
]);

export const concepts = sqliteTable('concept', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), chapterId: text('chapter_id').notNull(),
  title: text('title').notNull(), description: text('description').notNull(),
  sourceClass: integer('source_class'),
}, (t) => [
  uniqueIndex('concept_id_school_unique').on(t.id, t.schoolId),
  uniqueIndex('concept_id_chapter_school_unique').on(t.id, t.chapterId, t.schoolId),
  index('concept_chapter_idx').on(t.schoolId, t.chapterId),
  foreignKey({ columns: [t.chapterId, t.schoolId], foreignColumns: [chapters.id, chapters.schoolId] }),
]);

export const conceptPrereqs = sqliteTable('concept_prereq', {
  schoolId: text('school_id').notNull(), conceptId: text('concept_id').notNull(), prereqId: text('prereq_id').notNull(),
}, (t) => [
  uniqueIndex('concept_prereq_unique').on(t.conceptId, t.prereqId),
  foreignKey({ columns: [t.conceptId, t.schoolId], foreignColumns: [concepts.id, concepts.schoolId] }),
  foreignKey({ columns: [t.prereqId, t.schoolId], foreignColumns: [concepts.id, concepts.schoolId] }),
  check('concept_prereq_not_self', sql`${t.conceptId} <> ${t.prereqId}`),
]);

export const notes = sqliteTable('note', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), chapterId: text('chapter_id').notNull(),
  title: text('title').notNull(), body: text('body').notNull(),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  releaseAt: integer('release_at'), updatedAt: integer('updated_at').notNull(),
  fileKey: text('file_key'), filename: text('filename'), contentType: text('content_type'), fileSize: integer('file_size'),
  type: text('type', { enum: ['pdf', 'ppt', 'image', 'youtube', 'recording'] }).notNull().default('pdf'),
  startSec: integer('start_sec'), endSec: integer('end_sec'),
}, (t) => [
  uniqueIndex('note_id_chapter_school_unique').on(t.id, t.chapterId, t.schoolId),
  index('note_chapter_release_idx').on(t.schoolId, t.chapterId, t.status, t.releaseAt),
  foreignKey({ columns: [t.chapterId, t.schoolId], foreignColumns: [chapters.id, chapters.schoolId] }),
  check('note_status_valid', sql`${t.status} in ('draft', 'published')`),
]);

export const recordings = sqliteTable('recording', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), chapterId: text('chapter_id').notNull(), title: text('title').notNull(),
  fileKey: text('file_key'), filename: text('filename'), contentType: text('content_type'), fileSize: integer('file_size'),
  releaseAt: integer('release_at'), updatedAt: integer('updated_at').notNull(),
}, (t) => [index('recording_chapter_release_idx').on(t.schoolId, t.chapterId, t.releaseAt),
  foreignKey({ columns: [t.chapterId, t.schoolId], foreignColumns: [chapters.id, chapters.schoolId] })]);
export const recordingSegments = sqliteTable('recording_segment', {
  id: text('id').primaryKey(), recordingId: text('recording_id').notNull(), schoolId: text('school_id').notNull(), chapterId: text('chapter_id').notNull(),
  conceptId: text('concept_id').notNull(), title: text('title').notNull(), startSec: integer('start_sec').notNull(), endSec: integer('end_sec').notNull(),
}, (t) => [index('recording_segment_concept_idx').on(t.schoolId, t.conceptId), foreignKey({ columns: [t.recordingId], foreignColumns: [recordings.id] }),
  foreignKey({ columns: [t.conceptId, t.chapterId, t.schoolId], foreignColumns: [concepts.id, concepts.chapterId, concepts.schoolId] }),
  check('recording_segment_times_valid', sql`${t.startSec} >= 0 and ${t.endSec} > ${t.startSec}`)]);

export const noteConcepts = sqliteTable('note_concept', {
  noteId: text('note_id').notNull(), conceptId: text('concept_id').notNull(),
  chapterId: text('chapter_id').notNull(), schoolId: text('school_id').notNull(),
}, (t) => [
  uniqueIndex('note_concept_unique').on(t.noteId, t.conceptId),
  foreignKey({ columns: [t.noteId, t.chapterId, t.schoolId], foreignColumns: [notes.id, notes.chapterId, notes.schoolId] }),
  foreignKey({ columns: [t.conceptId, t.chapterId, t.schoolId], foreignColumns: [concepts.id, concepts.chapterId, concepts.schoolId] }),
]);

// P1's `session` stores authentication cookies; learning sessions are distinct.
export const learningSessions = sqliteTable('learning_session', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), chapterId: text('chapter_id').notNull(),
  sectionId: text('section_id').notNull(), title: text('title').notNull(),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  releaseAt: integer('release_at'), updatedAt: integer('updated_at').notNull(),
}, (t) => [
  uniqueIndex('learning_session_id_school_unique').on(t.id, t.schoolId),
  uniqueIndex('learning_session_id_chapter_school_unique').on(t.id, t.chapterId, t.schoolId),
  index('learning_session_chapter_release_idx').on(t.schoolId, t.chapterId, t.sectionId, t.status, t.releaseAt),
  foreignKey({ columns: [t.chapterId, t.schoolId], foreignColumns: [chapters.id, chapters.schoolId] }),
  foreignKey({ columns: [t.sectionId, t.schoolId], foreignColumns: [sections.id, sections.schoolId] }),
  check('learning_session_status_valid', sql`${t.status} in ('draft', 'published')`),
]);

export const slides = sqliteTable('slide', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), chapterId: text('chapter_id').notNull(),
  sessionId: text('session_id').notNull(), conceptId: text('concept_id').notNull(), noteId: text('note_id'),
  position: integer('position').notNull(), title: text('title').notNull(), body: text('body').notNull(),
}, (t) => [
  uniqueIndex('slide_session_position_unique').on(t.sessionId, t.position),
  foreignKey({ columns: [t.sessionId, t.chapterId, t.schoolId], foreignColumns: [learningSessions.id, learningSessions.chapterId, learningSessions.schoolId] }),
  foreignKey({ columns: [t.conceptId, t.chapterId, t.schoolId], foreignColumns: [concepts.id, concepts.chapterId, concepts.schoolId] }),
  foreignKey({ columns: [t.noteId, t.chapterId, t.schoolId], foreignColumns: [notes.id, notes.chapterId, notes.schoolId] }),
  check('slide_position_valid', sql`${t.position} >= 0`),
]);

export const items = sqliteTable('item', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), chapterId: text('chapter_id').notNull(),
  sessionId: text('session_id'), conceptId: text('concept_id').notNull(),
  position: integer('position').notNull(), content: text('content', { mode: 'json' }).notNull().$type<SaveItem>(),
}, (t) => [
  uniqueIndex('item_session_position_unique').on(t.sessionId, t.position),
  uniqueIndex('item_id_chapter_school_unique').on(t.id, t.chapterId, t.schoolId),
  uniqueIndex('item_id_concept_school_unique').on(t.id, t.conceptId, t.schoolId),
  foreignKey({ columns: [t.sessionId, t.chapterId, t.schoolId], foreignColumns: [learningSessions.id, learningSessions.chapterId, learningSessions.schoolId] }),
  foreignKey({ columns: [t.conceptId, t.chapterId, t.schoolId], foreignColumns: [concepts.id, concepts.chapterId, concepts.schoolId] }),
  check('item_position_valid', sql`${t.position} >= 0`),
  check('item_content_valid', sql`json_valid(${t.content})`),
]);

export const sessionProgress = sqliteTable('session_progress', {
  sessionId: text('session_id').notNull(), profileId: text('profile_id').notNull(), schoolId: text('school_id').notNull(),
  viewedSlides: integer('viewed_slides').notNull().default(0),
  checkSubmittedAt: integer('check_submitted_at'), completedAt: integer('completed_at'),
  lastReview: text('last_review'),
}, (t) => [
  uniqueIndex('session_progress_unique').on(t.sessionId, t.profileId),
  index('session_progress_profile_idx').on(t.schoolId, t.profileId),
  foreignKey({ columns: [t.sessionId, t.schoolId], foreignColumns: [learningSessions.id, learningSessions.schoolId] }),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  check('session_progress_viewed_valid', sql`${t.viewedSlides} >= 0`),
  check('session_progress_check_required', sql`${t.completedAt} is null or ${t.checkSubmittedAt} is not null`),
]);

export const assignments = sqliteTable('assignment', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), chapterId: text('chapter_id').notNull(),
  sectionId: text('section_id').notNull(), teacherId: text('teacher_id').notNull(), title: text('title').notNull(),
  kind: text('kind', { enum: ['homework', 'quiz'] }).notNull(), dueAt: integer('due_at').notNull(), lateUntil: integer('late_until'),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  publishedAt: integer('published_at'), updatedAt: integer('updated_at').notNull(),
}, (t) => [
  uniqueIndex('assignment_id_school_unique').on(t.id, t.schoolId),
  uniqueIndex('assignment_id_chapter_school_unique').on(t.id, t.chapterId, t.schoolId),
  index('assignment_section_idx').on(t.schoolId, t.sectionId, t.status),
  foreignKey({ columns: [t.chapterId, t.schoolId], foreignColumns: [chapters.id, chapters.schoolId] }),
  foreignKey({ columns: [t.sectionId, t.schoolId], foreignColumns: [sections.id, sections.schoolId] }),
  foreignKey({ columns: [t.teacherId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  check('assignment_kind_valid', sql`${t.kind} in ('homework', 'quiz')`),
  check('assignment_status_valid', sql`(${t.status} = 'draft' and ${t.publishedAt} is null) or (${t.status} = 'published' and ${t.publishedAt} is not null)`),
  check('assignment_due_valid', sql`${t.dueAt} >= 0`),
]);

export const assignmentItems = sqliteTable('assignment_item', {
  assignmentId: text('assignment_id').notNull(), itemId: text('item_id').notNull(),
  schoolId: text('school_id').notNull(), chapterId: text('chapter_id').notNull(), position: integer('position').notNull(),
}, (t) => [
  uniqueIndex('assignment_item_unique').on(t.assignmentId, t.itemId, t.schoolId),
  uniqueIndex('assignment_item_position_unique').on(t.assignmentId, t.position),
  foreignKey({ columns: [t.assignmentId, t.chapterId, t.schoolId], foreignColumns: [assignments.id, assignments.chapterId, assignments.schoolId] }),
  foreignKey({ columns: [t.itemId, t.chapterId, t.schoolId], foreignColumns: [items.id, items.chapterId, items.schoolId] }),
  check('assignment_item_position_valid', sql`${t.position} >= 0`),
]);

export const attempts = sqliteTable('attempt', {
  id: text('id').primaryKey(), clientEventId: text('client_event_id').notNull().unique(), schoolId: text('school_id').notNull(),
  // Null denotes optional practice; assignment attempts retain their item-membership FK.
  assignmentId: text('assignment_id'), profileId: text('profile_id').notNull(), itemId: text('item_id').notNull(),
  conceptId: text('concept_id').notNull(), answer: text('answer', { mode: 'json' }).notNull().$type<Answer>(),
  correct: integer('correct', { mode: 'boolean' }), needsReview: integer('needs_review', { mode: 'boolean' }).notNull(),
  timeMs: integer('time_ms').notNull(), clientTs: integer('client_ts').notNull(), serverTs: integer('server_ts').notNull(),
  updatedAt: integer('updated_at').notNull(), gradedBy: text('graded_by'), gradedAt: integer('graded_at'),
}, (t) => [
  uniqueIndex('attempt_assignment_profile_item_unique').on(t.assignmentId, t.profileId, t.itemId),
  index('attempt_concept_profile_idx').on(t.schoolId, t.profileId, t.conceptId),
  foreignKey({ columns: [t.assignmentId, t.itemId, t.schoolId], foreignColumns: [assignmentItems.assignmentId, assignmentItems.itemId, assignmentItems.schoolId] }),
  foreignKey({ columns: [t.itemId, t.conceptId, t.schoolId], foreignColumns: [items.id, items.conceptId, items.schoolId] }),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.gradedBy, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  check('attempt_answer_valid', sql`json_valid(${t.answer})`),
  check('attempt_mark_valid', sql`(${t.needsReview} = 1 and ${t.correct} is null) or (${t.needsReview} = 0 and ${t.correct} in (0, 1) and ${t.correct} is not null)`),
  check('attempt_time_valid', sql`${t.timeMs} between 0 and 86400000 and ${t.clientTs} >= 0 and ${t.serverTs} >= 0`),
]);

export const studentConceptStates = sqliteTable('student_concept_state', {
  schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(), conceptId: text('concept_id').notNull(),
  mastery: real('mastery').notNull(), leitnerBox: integer('leitner_box').notNull(), nextReview: integer('next_review').notNull(),
  attempts: integer('attempts').notNull(), updatedAt: integer('updated_at').notNull(),
}, (t) => [
  uniqueIndex('student_concept_state_unique').on(t.profileId, t.conceptId),
  index('student_concept_review_idx').on(t.schoolId, t.profileId, t.nextReview),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.conceptId, t.schoolId], foreignColumns: [concepts.id, concepts.schoolId] }),
  check('student_concept_state_valid', sql`${t.mastery} between 0 and 1 and ${t.leitnerBox} between 1 and 5 and ${t.nextReview} >= 0 and ${t.attempts} >= 0`),
]);

// Monotonic receipt revisions, not client clocks, drive differential pulls.
export const syncChanges = sqliteTable('sync_change', {
  seq: integer('seq').primaryKey({ autoIncrement: true }), schoolId: text('school_id').notNull().references(() => schools.id),
  stream: text('stream', { enum: ['assignments', 'items', 'attempts', 'conceptStates'] }).notNull(),
  entityId: text('entity_id').notNull(), assignmentId: text('assignment_id').references(() => assignments.id),
  profileId: text('profile_id').references(() => profiles.id),
}, (t) => [index('sync_change_pull_idx').on(t.schoolId, t.stream, t.seq)]);

// FTS5 and text-chunk maintenance triggers live in migration 0005.
export const noteChunks = sqliteTable('note_chunk', {
  id: integer('id').primaryKey({ autoIncrement: true }), noteId: text('note_id').notNull(),
  schoolId: text('school_id').notNull(), chapterId: text('chapter_id').notNull(),
  position: integer('position').notNull(), text: text('text').notNull(),
}, (t) => [
  uniqueIndex('note_chunk_position_unique').on(t.noteId, t.position),
  foreignKey({ columns: [t.noteId, t.chapterId, t.schoolId], foreignColumns: [notes.id, notes.chapterId, notes.schoolId] }),
]);

export const aiCache = sqliteTable('ai_cache', {
  key: text('key').primaryKey(), response: text('response', { mode: 'json' }).notNull().$type<AskResponse>(),
  expiresAt: integer('expires_at').notNull(),
});

export const otpChallenges = sqliteTable('otp_challenge', {
  id: text('id').primaryKey(), tokenHash: text('token_hash').notNull().unique(),
  schoolId: text('school_id').notNull(), profileId: text('profile_id'), claimCodeId: text('claim_code_id'),
  phone: text('phone').notNull(), purpose: text('purpose', { enum: ['student_verify', 'parent_login', 'teacher_pin'] }).notNull(),
  codeHash: text('code_hash').notNull(), expiresAt: integer('expires_at').notNull(), attempts: integer('attempts').notNull().default(0),
}, (t) => [
  index('otp_challenge_expiry_idx').on(t.expiresAt),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.claimCodeId], foreignColumns: [claimCodes.id] }),
  check('otp_challenge_attempts_nonnegative', sql`${t.attempts} >= 0`),
]);

export const doubts = sqliteTable('doubt', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(),
  chapterId: text('chapter_id').notNull(), question: text('question').notNull(),
  response: text('response', { mode: 'json' }).notNull().$type<AskResponse>(), createdAt: integer('created_at').notNull(),
}, (t) => [
  index('doubt_profile_idx').on(t.schoolId, t.profileId, t.createdAt),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.chapterId, t.schoolId], foreignColumns: [chapters.id, chapters.schoolId] }),
]);

export const aiDraftJobs = sqliteTable('ai_draft_job', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), chapterId: text('chapter_id').notNull(),
  noteId: text('note_id').notNull(), sectionId: text('section_id').notNull(), requestedBy: text('requested_by').notNull(),
  sourceHash: text('source_hash').notNull(),
  status: text('status', { enum: ['queued', 'running', 'ready', 'not_configured', 'failed', 'approved', 'rejected'] }).notNull(),
  message: text('message'), draft: text('draft', { mode: 'json' }).$type<AiDraft>(),
  sessionId: text('session_id'), assignmentId: text('assignment_id'),
  createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
}, (t) => [
  index('ai_draft_job_queue_idx').on(t.status, t.createdAt),
  foreignKey({ columns: [t.noteId, t.chapterId, t.schoolId], foreignColumns: [notes.id, notes.chapterId, notes.schoolId] }),
  foreignKey({ columns: [t.sectionId, t.schoolId], foreignColumns: [sections.id, sections.schoolId] }),
  foreignKey({ columns: [t.requestedBy, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.sessionId, t.chapterId, t.schoolId], foreignColumns: [learningSessions.id, learningSessions.chapterId, learningSessions.schoolId] }),
  foreignKey({ columns: [t.assignmentId, t.chapterId, t.schoolId], foreignColumns: [assignments.id, assignments.chapterId, assignments.schoolId] }),
]);

export const learningEvidence = sqliteTable('learning_evidence', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(),
  conceptId: text('concept_id').notNull(), correct: integer('correct', { mode: 'boolean' }).notNull(),
  source: text('source', { enum: ['session', 'remediation'] }).notNull(), createdAt: integer('created_at').notNull(),
}, (t) => [
  index('learning_evidence_profile_idx').on(t.schoolId, t.profileId, t.conceptId),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.conceptId, t.schoolId], foreignColumns: [concepts.id, concepts.schoolId] }),
]);

export const answerEvidence = sqliteTable('answer_evidence', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(),
  conceptId: text('concept_id').notNull(), itemId: text('item_id').notNull(),
  level: integer('level').notNull(), correct: integer('correct', { mode: 'boolean' }).notNull(),
  confidence: text('confidence', { enum: ['sure', 'unsure', 'guess'] }).notNull(),
  source: text('source').notNull(),
  weight: real('weight').notNull().default(1),
  errorType: text('error_type', { enum: ['concept_gap', 'careless', 'method', 'guess'] }),
  timeMs: integer('time_ms').notNull(), answer: text('answer', { mode: 'json' }).notNull().$type<string | string[]>(),
  notTaught: integer('not_taught', { mode: 'boolean' }).notNull().default(false), createdAt: integer('created_at').notNull(),
}, (t) => [
  index('answer_evidence_profile_idx').on(t.schoolId, t.profileId, t.conceptId, t.createdAt),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.conceptId, t.schoolId], foreignColumns: [concepts.id, concepts.schoolId] }),
  foreignKey({ columns: [t.itemId, t.conceptId, t.schoolId], foreignColumns: [items.id, items.conceptId, items.schoolId] }),
]);

export const conceptLadders = sqliteTable('concept_ladder', {
  schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(), conceptId: text('concept_id').notNull(),
  ladderLevel: integer('ladder_level').notNull().default(2), streakCorrect: integer('streak_correct').notNull().default(0),
  streakWrong: integer('streak_wrong').notNull().default(0), masteryLevel: integer('mastery_level'),
  masteryScore: real('mastery_score').notNull().default(0), misconception: integer('misconception', { mode: 'boolean' }).notNull().default(false),
  bridge: text('bridge'), updatedAt: integer('updated_at').notNull(),
}, (t) => [
  uniqueIndex('concept_ladder_pk').on(t.profileId, t.conceptId),
  index('concept_ladder_school_idx').on(t.schoolId, t.profileId),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.conceptId, t.schoolId], foreignColumns: [concepts.id, concepts.schoolId] }),
]);

export const chapterBands = sqliteTable('chapter_band', {
  schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(), chapterId: text('chapter_id').notNull(),
  band: text('band', { enum: ['0-25', '25-50', '50-75', '75-100'] }).notNull(), updatedAt: integer('updated_at').notNull(),
}, (t) => [
  uniqueIndex('chapter_band_pk').on(t.profileId, t.chapterId),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.chapterId, t.schoolId], foreignColumns: [chapters.id, chapters.schoolId] }),
]);

export const bandEvents = sqliteTable('band_event', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(),
  chapterId: text('chapter_id').notNull(), fromBand: text('from_band', { enum: ['0-25', '25-50', '50-75', '75-100'] }),
  toBand: text('to_band', { enum: ['0-25', '25-50', '50-75', '75-100'] }).notNull(), createdAt: integer('created_at').notNull(),
}, (t) => [
  index('band_event_profile_idx').on(t.schoolId, t.profileId, t.chapterId, t.createdAt),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.chapterId, t.schoolId], foreignColumns: [chapters.id, chapters.schoolId] }),
]);

export const conceptLessons = sqliteTable('concept_lesson', {
  conceptId: text('concept_id').primaryKey(), schoolId: text('school_id').notNull(),
  body: text('body', { mode: 'json' }).notNull().$type<ConceptLesson>(), updatedAt: integer('updated_at').notNull(),
}, (t) => [
  foreignKey({ columns: [t.conceptId, t.schoolId], foreignColumns: [concepts.id, concepts.schoolId] }),
]);

export const revisionHooks = sqliteTable('revision_hook', {
  schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(), conceptId: text('concept_id').notNull(),
  intervalDays: integer('interval_days').notNull(), dueAt: integer('due_at').notNull(), createdAt: integer('created_at').notNull(),
}, (t) => [
  uniqueIndex('revision_hook_pk').on(t.profileId, t.conceptId, t.intervalDays),
  index('revision_hook_due_idx').on(t.schoolId, t.profileId, t.dueAt),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.conceptId, t.schoolId], foreignColumns: [concepts.id, concepts.schoolId] }),
  check('revision_hook_days', sql`${t.intervalDays} in (1, 3, 7) and ${t.dueAt} >= 0`),
]);

export const diagnosticResults = sqliteTable('diagnostic_result', {
  schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(), chapterId: text('chapter_id').notNull(),
  route: text('route', { enum: ['challenge', 'steady', 'repair'] }).notNull(), createdAt: integer('created_at').notNull(),
}, (t) => [
  uniqueIndex('diagnostic_result_pk').on(t.profileId, t.chapterId),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.chapterId, t.schoolId], foreignColumns: [chapters.id, chapters.schoolId] }),
]);

export const remediationChecks = sqliteTable('remediation_check', {
  clientEventId: text('client_event_id').primaryKey(), schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(),
  conceptId: text('concept_id').notNull(), targetConceptId: text('target_concept_id').notNull(),
  failureId: text('failure_id').notNull(), inputHash: text('input_hash').notNull(),
  result: text('result', { mode: 'json' }).notNull().$type<RemediationResult>(), createdAt: integer('created_at').notNull(),
}, (t) => [
  index('remediation_check_profile_idx').on(t.schoolId, t.profileId, t.conceptId, t.failureId),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.conceptId, t.schoolId], foreignColumns: [concepts.id, concepts.schoolId] }),
  foreignKey({ columns: [t.targetConceptId, t.schoolId], foreignColumns: [concepts.id, concepts.schoolId] }),
]);

export const dashboardJobs = sqliteTable('dashboard_job', {
  schoolId: text('school_id').primaryKey().references(() => schools.id),
  dirty: integer('dirty', { mode: 'boolean' }).notNull().default(true), refreshedAt: integer('refreshed_at'),
});

export const classConceptDaily = sqliteTable('class_concept_daily', {
  schoolId: text('school_id').notNull(), sectionId: text('section_id').notNull(), conceptId: text('concept_id').notNull(),
  day: text('day').notNull(), attempts: integer('attempts').notNull(), correct: integer('correct').notNull(),
  pendingReview: integer('pending_review').notNull(),
}, (t) => [
  uniqueIndex('class_concept_daily_unique').on(t.schoolId, t.sectionId, t.conceptId, t.day),
  foreignKey({ columns: [t.sectionId, t.schoolId], foreignColumns: [sections.id, sections.schoolId] }),
  foreignKey({ columns: [t.conceptId, t.schoolId], foreignColumns: [concepts.id, concepts.schoolId] }),
  check('class_concept_daily_counts', sql`${t.correct} between 0 and ${t.attempts} and ${t.pendingReview} >= 0`),
]);

export const misconceptionDaily = sqliteTable('misconception_daily', {
  schoolId: text('school_id').notNull(), sectionId: text('section_id').notNull(), conceptId: text('concept_id').notNull(),
  itemId: text('item_id').notNull(), day: text('day').notNull(), option: text('option').notNull(), count: integer('count').notNull(),
}, (t) => [
  uniqueIndex('misconception_daily_unique').on(t.schoolId, t.sectionId, t.itemId, t.day, t.option),
  foreignKey({ columns: [t.sectionId, t.schoolId], foreignColumns: [sections.id, sections.schoolId] }),
  foreignKey({ columns: [t.itemId, t.conceptId, t.schoolId], foreignColumns: [items.id, items.conceptId, items.schoolId] }),
  check('misconception_daily_count', sql`${t.count} > 0`),
]);

export const reteachDecisions = sqliteTable('reteach_decision', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), sectionId: text('section_id').notNull(),
  conceptId: text('concept_id').notNull(), teacherId: text('teacher_id').notNull(),
  decision: text('decision', { enum: ['reteach', 'practice', 'monitor'] }).notNull(),
  note: text('note').notNull(), createdAt: integer('created_at').notNull(),
}, (t) => [
  index('reteach_decision_section_idx').on(t.schoolId, t.sectionId, t.createdAt),
  foreignKey({ columns: [t.sectionId, t.schoolId], foreignColumns: [sections.id, sections.schoolId] }),
  foreignKey({ columns: [t.conceptId, t.schoolId], foreignColumns: [concepts.id, concepts.schoolId] }),
  foreignKey({ columns: [t.teacherId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  check('reteach_decision_valid', sql`${t.decision} in ('reteach', 'practice', 'monitor')`),
]);

export const announcements = sqliteTable('announcement', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), sectionId: text('section_id').notNull(),
  authorId: text('author_id').notNull(), title: text('title').notNull(), body: text('body').notNull(),
  audience: text('audience', { enum: ['students', 'parents', 'all'] }).notNull(),
  channels: text('channels', { mode: 'json' }).notNull().$type<NotificationChannel[]>(), createdAt: integer('created_at').notNull(),
}, (t) => [
  uniqueIndex('announcement_id_school_unique').on(t.id, t.schoolId),
  index('announcement_section_idx').on(t.schoolId, t.sectionId, t.createdAt),
  foreignKey({ columns: [t.sectionId, t.schoolId], foreignColumns: [sections.id, sections.schoolId] }),
  foreignKey({ columns: [t.authorId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  check('announcement_audience_valid', sql`${t.audience} in ('students', 'parents', 'all')`),
  check('announcement_channels_valid', sql`json_valid(${t.channels})`),
]);

export const notificationSettings = sqliteTable('notification_setting', {
  profileId: text('profile_id').primaryKey(), schoolId: text('school_id').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull(), quietStart: integer('quiet_start').notNull(),
  quietEnd: integer('quiet_end').notNull(), utcOffsetMinutes: integer('utc_offset_minutes').notNull(),
  reducedMotion: integer('reduced_motion', { mode: 'boolean' }).notNull(), updatedAt: integer('updated_at').notNull(),
  notifySessions: integer('notify_sessions').default(1), notifyHomework: integer('notify_homework').default(1),
  notifyStreak: integer('notify_streak').default(1), notifyParentView: integer('notify_parent_view').default(1),
  notifyGame: integer('notify_game').default(1), quietAfter21: integer('quiet_after_21').default(1),
}, (t) => [
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  check('notification_setting_valid', sql`${t.quietStart} between 0 and 1439 and ${t.quietEnd} between 0 and 1439 and ${t.utcOffsetMinutes} between -720 and 840 and ${t.enabled} in (0,1) and ${t.reducedMotion} in (0,1)`),
]);

export const notifications = sqliteTable('notification', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(),
  announcementId: text('announcement_id'), dedupeKey: text('dedupe_key').notNull().unique(),
  kind: text('kind', { enum: ['announcement', 'parent_summary', 'content_publish'] }).notNull(),
  topic: text('topic'),
  title: text('title').notNull(), body: text('body').notNull(), href: text('href').notNull(),
  channel: text('channel', { enum: ['in_app', 'email', 'whatsapp'] }).notNull(),
  status: text('status', { enum: ['queued', 'delivered', 'failed'] }).notNull(), failure: text('failure'),
  createdAt: integer('created_at').notNull(), deliverAfter: integer('deliver_after').notNull(),
  deliveredAt: integer('delivered_at'), readAt: integer('read_at'),
}, (t) => [
  index('notification_inbox_idx').on(t.schoolId, t.profileId, t.createdAt),
  index('notification_queue_idx').on(t.status, t.deliverAfter),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.announcementId, t.schoolId], foreignColumns: [announcements.id, announcements.schoolId] }),
  check('notification_kind_valid', sql`${t.kind} in ('announcement', 'parent_summary', 'content_publish')`),
  check('notification_channel_valid', sql`${t.channel} in ('in_app', 'email', 'whatsapp')`),
  check('notification_status_valid', sql`(${t.status} = 'queued' and ${t.deliveredAt} is null and ${t.failure} is null) or (${t.status} = 'delivered' and ${t.deliveredAt} is not null and ${t.failure} is null) or (${t.status} = 'failed' and ${t.deliveredAt} is null and ${t.failure} is not null)`),
]);

const streakAct = ['session_part', 'game_round', 'warmup', 'daily_challenge', 'homework_submit', 'catchup', 'dushman'] as const;
const badgeId = ['fixed_it', 'comeback_king', 'dushman_slayer', 'boss_buster'] as const;

export const streakTouches = sqliteTable('streak_touch', {
  profileId: text('profile_id').notNull(), schoolId: text('school_id').notNull(), day: text('day').notNull(),
  act: text('act', { enum: streakAct }).notNull(), sourceEventId: text('source_event_id'), createdAt: integer('created_at').notNull(),
}, (t) => [
  primaryKey({ columns: [t.profileId, t.day] }),
  index('streak_touch_school_idx').on(t.schoolId, t.profileId),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
]);

export const streakStates = sqliteTable('streak_state', {
  profileId: text('profile_id').primaryKey(), schoolId: text('school_id').notNull(),
  currentDays: integer('current_days').notNull().default(0), longestDays: integer('longest_days').notNull().default(0),
  lastDay: text('last_day'), freezesHeld: integer('freezes_held').notNull().default(0), updatedAt: integer('updated_at').notNull(),
}, (t) => [
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  check('streak_state_valid', sql`${t.currentDays} >= 0 and ${t.longestDays} >= 0 and ${t.freezesHeld} between 0 and 2`),
]);

export const streakFreezeLedger = sqliteTable('streak_freeze_ledger', {
  id: text('id').primaryKey(), profileId: text('profile_id').notNull(), schoolId: text('school_id').notNull(),
  kind: text('kind', { enum: ['earned', 'consumed'] }).notNull(), day: text('day').notNull(),
  reason: text('reason').notNull(), createdAt: integer('created_at').notNull(),
}, (t) => [
  index('streak_freeze_ledger_profile_idx').on(t.schoolId, t.profileId, t.day),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
]);

export const dailyChallenges = sqliteTable('daily_challenge', {
  id: text('id').primaryKey(), profileId: text('profile_id').notNull(), schoolId: text('school_id').notNull(),
  day: text('day').notNull(), itemIds: text('item_ids', { mode: 'json' }).notNull().$type<string[]>(),
  status: text('status', { enum: ['served', 'completed', 'expired'] }).notNull(),
  correct: integer('correct').notNull().default(0), total: integer('total').notNull().default(0),
  startedAt: integer('started_at'), completedAt: integer('completed_at'),
}, (t) => [
  uniqueIndex('daily_challenge_profile_day_unique').on(t.profileId, t.day),
  index('daily_challenge_school_idx').on(t.schoolId, t.profileId, t.day),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  check('daily_challenge_counts', sql`${t.correct} >= 0 and ${t.total} >= 0 and json_valid(${t.itemIds})`),
]);

export const dushmanEntries = sqliteTable('dushman_entry', {
  id: text('id').primaryKey(), profileId: text('profile_id').notNull(), schoolId: text('school_id').notNull(),
  conceptId: text('concept_id').notNull(), status: text('status', { enum: ['active', 'retired'] }).notNull(),
  queuedAt: integer('queued_at').notNull(), retiredAt: integer('retired_at'), reason: text('reason'),
}, (t) => [
  index('dushman_entry_active_idx').on(t.schoolId, t.profileId, t.status),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.conceptId, t.schoolId], foreignColumns: [concepts.id, concepts.schoolId] }),
]);

export const dushmanEvents = sqliteTable('dushman_event', {
  id: text('id').primaryKey(), profileId: text('profile_id').notNull(), schoolId: text('school_id').notNull(),
  conceptId: text('concept_id').notNull(), kind: text('kind', { enum: ['queued', 'faced', 'victory', 'retired'] }).notNull(),
  evidenceId: text('evidence_id'), createdAt: integer('created_at').notNull(),
}, (t) => [
  index('dushman_event_profile_idx').on(t.schoolId, t.profileId, t.createdAt),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.conceptId, t.schoolId], foreignColumns: [concepts.id, concepts.schoolId] }),
]);

export const badgeCatalog = sqliteTable('badge_catalog', {
  id: text('id', { enum: badgeId }).primaryKey(), nameEn: text('name_en').notNull(), nameHi: text('name_hi').notNull(),
  descriptionEn: text('description_en').notNull(), descriptionHi: text('description_hi').notNull(), iconKey: text('icon_key').notNull(),
});

export const badgeAwards = sqliteTable('badge_award', {
  id: text('id').primaryKey(), profileId: text('profile_id').notNull(), schoolId: text('school_id').notNull(),
  badgeId: text('badge_id', { enum: badgeId }).notNull(), scopeKey: text('scope_key').notNull(),
  triggerEventId: text('trigger_event_id').notNull(), awardedAt: integer('awarded_at').notNull(), seenAt: integer('seen_at'),
}, (t) => [
  uniqueIndex('badge_award_scope_unique').on(t.profileId, t.badgeId, t.scopeKey),
  index('badge_award_profile_idx').on(t.schoolId, t.profileId, t.awardedAt),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.badgeId], foreignColumns: [badgeCatalog.id] }),
]);

export const studyPlans = sqliteTable('study_plan', {
  id: text('id').primaryKey(), profileId: text('profile_id').notNull(), schoolId: text('school_id').notNull(),
  goal: text('goal').notNull(), examDate: text('exam_date').notNull(),
  minutesPerNight: integer('minutes_per_night').notNull().default(25),
  status: text('status', { enum: ['active', 'archived'] }).notNull(),
  createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
}, (t) => [
  uniqueIndex('study_plan_id_school_unique').on(t.id, t.schoolId),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  check('study_plan_minutes', sql`${t.minutesPerNight} between 5 and 180`),
]);

export const studyPlanItems = sqliteTable('study_plan_item', {
  id: text('id').primaryKey(), planId: text('plan_id').notNull(), schoolId: text('school_id').notNull(),
  night: text('night').notNull(), conceptId: text('concept_id').notNull(),
  kind: text('kind', { enum: ['repair', 'learn', 'revise', 'practice', 'warmup'] }).notNull(),
  estMinutes: integer('est_minutes').notNull(), orderIdx: integer('order_idx').notNull(),
  status: text('status', { enum: ['planned', 'done', 'folded', 'dropped'] }).notNull(),
}, (t) => [
  index('study_plan_item_night_idx').on(t.planId, t.night, t.orderIdx),
  foreignKey({ columns: [t.planId, t.schoolId], foreignColumns: [studyPlans.id, studyPlans.schoolId] }),
  foreignKey({ columns: [t.conceptId, t.schoolId], foreignColumns: [concepts.id, concepts.schoolId] }),
]);

export const planCompletionEvents = sqliteTable('plan_completion_event', {
  id: text('id').primaryKey(), planItemId: text('plan_item_id').notNull(),
  profileId: text('profile_id').notNull(), schoolId: text('school_id').notNull(),
  kind: text('kind', { enum: ['done', 'missed', 'folded'] }).notNull(), createdAt: integer('created_at').notNull(),
}, (t) => [
  index('plan_completion_event_profile_idx').on(t.schoolId, t.profileId, t.createdAt),
  foreignKey({ columns: [t.planItemId], foreignColumns: [studyPlanItems.id] }),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
]);

export const learningEvents = sqliteTable('learning_event', {
  id: text('id').primaryKey(), profileId: text('profile_id').notNull(), schoolId: text('school_id').notNull(),
  kind: text('kind', { enum: ['recovery_offered', 'recovery_completed', 'warmup_offered', 'warmup_skipped', 'warmup_completed', 'frustration_flagged', 'absence_detected'] }).notNull(),
  conceptId: text('concept_id'), payload: text('payload', { mode: 'json' }).notNull().$type<Record<string, unknown>>(),
  createdAt: integer('created_at').notNull(),
}, (t) => [
  index('learning_event_profile_idx').on(t.schoolId, t.profileId, t.createdAt),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.conceptId, t.schoolId], foreignColumns: [concepts.id, concepts.schoolId] }),
]);

export const assignmentDrafts = sqliteTable('assignment_draft', {
  profileId: text('profile_id').notNull(), schoolId: text('school_id').notNull(),
  assignmentId: text('assignment_id').notNull(), itemId: text('item_id').notNull(),
  answer: text('answer', { mode: 'json' }).notNull().$type<Answer>(), updatedAt: integer('updated_at').notNull(),
}, (t) => [
  primaryKey({ columns: [t.profileId, t.assignmentId, t.itemId] }),
  foreignKey({ columns: [t.profileId, t.schoolId], foreignColumns: [profiles.id, profiles.schoolId] }),
  foreignKey({ columns: [t.assignmentId, t.schoolId], foreignColumns: [assignments.id, assignments.schoolId] }),
  check('assignment_draft_answer', sql`json_valid(${t.answer})`),
]);
