import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const askThreads = sqliteTable('ask_thread', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(),
  chapterId: text('chapter_id'), conceptId: text('concept_id'), title: text('title').notNull(),
  style: text('style').notNull().default('hints'), mode: text('mode').notNull().default('learn'),
  createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
});
export const askMessages = sqliteTable('ask_message', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), threadId: text('thread_id').notNull(),
  role: text('role', { enum: ['student', 'saathy'] }).notNull(), text: text('text').notNull(),
  clientEventId: text('client_event_id'), metadata: text('metadata').notNull().default('{}'), createdAt: integer('created_at').notNull(),
});
export const askSaved = sqliteTable('ask_saved', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(),
  messageId: text('message_id').notNull(), title: text('title').notNull(), subjectId: text('subject_id'),
  text: text('text').notNull(), createdAt: integer('created_at').notNull(),
});
export const doubtClusterCounters = sqliteTable('doubt_cluster_counter', {
  schoolId: text('school_id').notNull(), sectionId: text('section_id').notNull(), conceptId: text('concept_id').notNull(),
  subtag: text('subtag').notNull(), day: text('day').notNull(), count: integer('count').notNull().default(0),
  snippets: text('snippets').notNull().default('[]'),
});
export const doubtEscalations = sqliteTable('doubt_escalation', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(),
  sectionId: text('section_id').notNull(), teacherId: text('teacher_id').notNull(), messageId: text('message_id').notNull(),
  conceptId: text('concept_id'), questionText: text('question_text').notNull(), status: text('status').notNull().default('open'),
  teacherReply: text('teacher_reply'), createdAt: integer('created_at').notNull(), repliedAt: integer('replied_at'),
});
export const aiBudgetDays = sqliteTable('ai_budget_day', {
  schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(), day: text('day').notNull(),
  usedTokens: integer('used_tokens').notNull().default(0),
});
export const snapUploads = sqliteTable('snap_upload', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(),
  path: text('path').notNull(), status: text('status').notNull(), text: text('text'),
  confirmed: integer('confirmed', { mode: 'boolean' }).notNull().default(false), createdAt: integer('created_at').notNull(),
});
export const followupItems = sqliteTable('followup_item', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(),
  conceptId: text('concept_id').notNull(), itemId: text('item_id'), reason: text('reason').notNull(),
  dueAt: integer('due_at').notNull(), completedAt: integer('completed_at'), createdAt: integer('created_at').notNull(),
});
export const gameSessions = sqliteTable('game_session', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), profileId: text('profile_id').notNull(),
  gameId: text('game_id').notNull(), conceptId: text('concept_id').notNull(),
  startedAt: integer('started_at').notNull(), finishedAt: integer('finished_at'),
  answered: integer('answered').notNull().default(0), correct: integer('correct').notNull().default(0),
  bestKind: text('best_kind'), bestValue: integer('best_value'), bestLabel: text('best_label'),
});
export const gameCheckpointMap = sqliteTable('game_checkpoint_map', {
  schoolId: text('school_id').notNull(), gameId: text('game_id').notNull(), checkpointKey: text('checkpoint_key').notNull(),
  conceptId: text('concept_id').notNull(), itemId: text('item_id').notNull(),
}, (t) => [
  primaryKey({ columns: [t.schoolId, t.gameId, t.checkpointKey] }),
]);
