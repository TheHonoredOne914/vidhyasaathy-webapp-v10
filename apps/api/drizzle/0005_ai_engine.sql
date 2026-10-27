CREATE TABLE note_chunk (
  id INTEGER PRIMARY KEY AUTOINCREMENT, note_id TEXT NOT NULL, school_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL, position INTEGER NOT NULL CHECK(position >= 0), text TEXT NOT NULL,
  FOREIGN KEY(note_id, chapter_id, school_id) REFERENCES note(id, chapter_id, school_id)
);
--> statement-breakpoint
CREATE UNIQUE INDEX note_chunk_position_unique ON note_chunk(note_id, position);
--> statement-breakpoint
CREATE VIRTUAL TABLE note_chunk_fts USING fts5(text, content='note_chunk', content_rowid='id', tokenize='unicode61');
--> statement-breakpoint
CREATE TRIGGER note_chunk_insert AFTER INSERT ON note_chunk BEGIN
  INSERT INTO note_chunk_fts(rowid, text) VALUES (new.id, new.text);
END;
--> statement-breakpoint
CREATE TRIGGER note_chunk_delete AFTER DELETE ON note_chunk BEGIN
  INSERT INTO note_chunk_fts(note_chunk_fts, rowid, text) VALUES ('delete', old.id, old.text);
END;
--> statement-breakpoint
CREATE TRIGGER note_chunk_update AFTER UPDATE OF text ON note_chunk BEGIN
  INSERT INTO note_chunk_fts(note_chunk_fts, rowid, text) VALUES ('delete', old.id, old.text);
  INSERT INTO note_chunk_fts(rowid, text) VALUES (new.id, new.text);
END;
--> statement-breakpoint
CREATE TRIGGER note_index_insert AFTER INSERT ON note BEGIN
  INSERT INTO note_chunk(note_id, school_id, chapter_id, position, text)
  WITH RECURSIVE parts(position) AS (
    SELECT 0 UNION ALL SELECT position + 1 FROM parts WHERE (position + 1) * 1000 < length(new.body)
  ) SELECT new.id, new.school_id, new.chapter_id, position, substr(new.body, position * 1000 + 1, 1000) FROM parts;
END;
--> statement-breakpoint
CREATE TRIGGER note_index_update AFTER UPDATE OF body ON note BEGIN
  DELETE FROM note_chunk WHERE note_id = old.id;
  INSERT INTO note_chunk(note_id, school_id, chapter_id, position, text)
  WITH RECURSIVE parts(position) AS (
    SELECT 0 UNION ALL SELECT position + 1 FROM parts WHERE (position + 1) * 1000 < length(new.body)
  ) SELECT new.id, new.school_id, new.chapter_id, position, substr(new.body, position * 1000 + 1, 1000) FROM parts;
END;
--> statement-breakpoint
CREATE TRIGGER note_index_delete BEFORE DELETE ON note BEGIN
  DELETE FROM note_chunk WHERE note_id = old.id;
END;
--> statement-breakpoint
INSERT INTO note_chunk(note_id, school_id, chapter_id, position, text)
WITH RECURSIVE parts(note_id, school_id, chapter_id, body, position) AS (
  SELECT id, school_id, chapter_id, body, 0 FROM note
  UNION ALL SELECT note_id, school_id, chapter_id, body, position + 1 FROM parts WHERE (position + 1) * 1000 < length(body)
) SELECT note_id, school_id, chapter_id, position, substr(body, position * 1000 + 1, 1000) FROM parts;
--> statement-breakpoint
CREATE TABLE ai_cache (key TEXT PRIMARY KEY NOT NULL, response TEXT NOT NULL CHECK(json_valid(response)), expires_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE doubt (
  id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, profile_id TEXT NOT NULL, chapter_id TEXT NOT NULL,
  question TEXT NOT NULL, response TEXT NOT NULL CHECK(json_valid(response)), created_at INTEGER NOT NULL,
  FOREIGN KEY(profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY(chapter_id, school_id) REFERENCES chapter(id, school_id)
);
--> statement-breakpoint
CREATE INDEX doubt_profile_idx ON doubt(school_id, profile_id, created_at);
--> statement-breakpoint
CREATE TABLE ai_draft_job (
  id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, chapter_id TEXT NOT NULL,
  note_id TEXT NOT NULL, section_id TEXT NOT NULL, requested_by TEXT NOT NULL, source_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('queued', 'running', 'ready', 'not_configured', 'failed', 'approved', 'rejected')),
  message TEXT, draft TEXT CHECK(draft IS NULL OR json_valid(draft)), session_id TEXT, assignment_id TEXT,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  FOREIGN KEY(note_id, chapter_id, school_id) REFERENCES note(id, chapter_id, school_id),
  FOREIGN KEY(section_id, school_id) REFERENCES section(id, school_id),
  FOREIGN KEY(requested_by, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY(session_id, chapter_id, school_id) REFERENCES learning_session(id, chapter_id, school_id),
  FOREIGN KEY(assignment_id, chapter_id, school_id) REFERENCES assignment(id, chapter_id, school_id)
);
--> statement-breakpoint
CREATE INDEX ai_draft_job_queue_idx ON ai_draft_job(status, created_at);
--> statement-breakpoint
CREATE TABLE learning_evidence (
  id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, profile_id TEXT NOT NULL, concept_id TEXT NOT NULL,
  correct INTEGER NOT NULL CHECK(correct IN (0, 1)), source TEXT NOT NULL CHECK(source IN ('session', 'remediation')), created_at INTEGER NOT NULL,
  FOREIGN KEY(profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY(concept_id, school_id) REFERENCES concept(id, school_id)
);
--> statement-breakpoint
CREATE INDEX learning_evidence_profile_idx ON learning_evidence(school_id, profile_id, concept_id);
--> statement-breakpoint
CREATE TABLE remediation_check (
  client_event_id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, profile_id TEXT NOT NULL,
  concept_id TEXT NOT NULL, target_concept_id TEXT NOT NULL, failure_id TEXT NOT NULL, input_hash TEXT NOT NULL,
  result TEXT NOT NULL CHECK(json_valid(result)), created_at INTEGER NOT NULL,
  FOREIGN KEY(profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY(concept_id, school_id) REFERENCES concept(id, school_id),
  FOREIGN KEY(target_concept_id, school_id) REFERENCES concept(id, school_id)
);
--> statement-breakpoint
CREATE INDEX remediation_check_profile_idx ON remediation_check(school_id, profile_id, concept_id, failure_id);
