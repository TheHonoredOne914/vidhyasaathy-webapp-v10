CREATE TABLE item_p4 (
  id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, chapter_id TEXT NOT NULL,
  session_id TEXT, concept_id TEXT NOT NULL, position INTEGER NOT NULL, content TEXT NOT NULL,
  FOREIGN KEY (session_id, chapter_id, school_id) REFERENCES learning_session(id, chapter_id, school_id),
  FOREIGN KEY (concept_id, chapter_id, school_id) REFERENCES concept(id, chapter_id, school_id),
  CHECK (position >= 0), CHECK (json_valid(content))
);
--> statement-breakpoint
INSERT INTO item_p4 SELECT id, school_id, chapter_id, session_id, concept_id, position, content FROM item;
--> statement-breakpoint
DROP TABLE item;
--> statement-breakpoint
ALTER TABLE item_p4 RENAME TO item;
--> statement-breakpoint
CREATE UNIQUE INDEX item_session_position_unique ON item(session_id, position);
--> statement-breakpoint
CREATE UNIQUE INDEX item_id_chapter_school_unique ON item(id, chapter_id, school_id);
--> statement-breakpoint
CREATE UNIQUE INDEX item_id_concept_school_unique ON item(id, concept_id, school_id);
--> statement-breakpoint
CREATE TABLE assignment (
  id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, chapter_id TEXT NOT NULL,
  section_id TEXT NOT NULL, teacher_id TEXT NOT NULL, title TEXT NOT NULL, kind TEXT NOT NULL,
  due_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'draft', published_at INTEGER, updated_at INTEGER NOT NULL,
  FOREIGN KEY (chapter_id, school_id) REFERENCES chapter(id, school_id),
  FOREIGN KEY (section_id, school_id) REFERENCES section(id, school_id),
  FOREIGN KEY (teacher_id, school_id) REFERENCES profile(id, school_id),
  CHECK (kind IN ('homework', 'quiz')), CHECK (due_at >= 0),
  CHECK ((status = 'draft' AND published_at IS NULL) OR (status = 'published' AND published_at IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX assignment_id_school_unique ON assignment(id, school_id);
--> statement-breakpoint
CREATE UNIQUE INDEX assignment_id_chapter_school_unique ON assignment(id, chapter_id, school_id);
--> statement-breakpoint
CREATE INDEX assignment_section_idx ON assignment(school_id, section_id, status);
--> statement-breakpoint
CREATE TABLE assignment_item (
  assignment_id TEXT NOT NULL, item_id TEXT NOT NULL, school_id TEXT NOT NULL, chapter_id TEXT NOT NULL, position INTEGER NOT NULL,
  FOREIGN KEY (assignment_id, chapter_id, school_id) REFERENCES assignment(id, chapter_id, school_id),
  FOREIGN KEY (item_id, chapter_id, school_id) REFERENCES item(id, chapter_id, school_id), CHECK (position >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX assignment_item_unique ON assignment_item(assignment_id, item_id, school_id);
--> statement-breakpoint
CREATE UNIQUE INDEX assignment_item_position_unique ON assignment_item(assignment_id, position);
--> statement-breakpoint
CREATE TABLE attempt (
  id TEXT PRIMARY KEY NOT NULL, client_event_id TEXT NOT NULL UNIQUE, school_id TEXT NOT NULL,
  assignment_id TEXT NOT NULL, profile_id TEXT NOT NULL, item_id TEXT NOT NULL, concept_id TEXT NOT NULL,
  answer TEXT NOT NULL, correct INTEGER, needs_review INTEGER NOT NULL,
  time_ms INTEGER NOT NULL, client_ts INTEGER NOT NULL, server_ts INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  graded_by TEXT, graded_at INTEGER,
  FOREIGN KEY (assignment_id, item_id, school_id) REFERENCES assignment_item(assignment_id, item_id, school_id),
  FOREIGN KEY (item_id, concept_id, school_id) REFERENCES item(id, concept_id, school_id),
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY (graded_by, school_id) REFERENCES profile(id, school_id),
  CHECK (json_valid(answer)),
  CHECK ((needs_review = 1 AND correct IS NULL) OR (needs_review = 0 AND correct IN (0, 1) AND correct IS NOT NULL)),
  CHECK (time_ms BETWEEN 0 AND 86400000 AND client_ts >= 0 AND server_ts >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX attempt_assignment_profile_item_unique ON attempt(assignment_id, profile_id, item_id);
--> statement-breakpoint
CREATE INDEX attempt_concept_profile_idx ON attempt(school_id, profile_id, concept_id);
--> statement-breakpoint
CREATE TABLE student_concept_state (
  school_id TEXT NOT NULL, profile_id TEXT NOT NULL, concept_id TEXT NOT NULL,
  mastery REAL NOT NULL, leitner_box INTEGER NOT NULL, next_review INTEGER NOT NULL, attempts INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY (concept_id, school_id) REFERENCES concept(id, school_id),
  CHECK (mastery BETWEEN 0 AND 1 AND leitner_box BETWEEN 1 AND 5 AND next_review >= 0 AND attempts >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX student_concept_state_unique ON student_concept_state(profile_id, concept_id);
--> statement-breakpoint
CREATE INDEX student_concept_review_idx ON student_concept_state(school_id, profile_id, next_review);
--> statement-breakpoint
CREATE TABLE sync_change (
  seq INTEGER PRIMARY KEY AUTOINCREMENT, school_id TEXT NOT NULL REFERENCES school(id), stream TEXT NOT NULL,
  entity_id TEXT NOT NULL, assignment_id TEXT REFERENCES assignment(id), profile_id TEXT REFERENCES profile(id)
);
--> statement-breakpoint
CREATE INDEX sync_change_pull_idx ON sync_change(school_id, stream, seq);
