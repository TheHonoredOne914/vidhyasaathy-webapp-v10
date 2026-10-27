CREATE TABLE chapter (
  id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, subject_id TEXT NOT NULL,
  title TEXT NOT NULL, position INTEGER NOT NULL CHECK (position >= 0),
  UNIQUE (id, school_id),
  FOREIGN KEY (subject_id, school_id) REFERENCES subject(id, school_id)
);
--> statement-breakpoint
CREATE INDEX chapter_subject_idx ON chapter(school_id, subject_id, position);
--> statement-breakpoint
CREATE TABLE concept (
  id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, chapter_id TEXT NOT NULL,
  title TEXT NOT NULL, description TEXT NOT NULL,
  UNIQUE (id, school_id), UNIQUE (id, chapter_id, school_id),
  FOREIGN KEY (chapter_id, school_id) REFERENCES chapter(id, school_id)
);
--> statement-breakpoint
CREATE INDEX concept_chapter_idx ON concept(school_id, chapter_id);
--> statement-breakpoint
CREATE TABLE concept_prereq (
  school_id TEXT NOT NULL, concept_id TEXT NOT NULL, prereq_id TEXT NOT NULL,
  UNIQUE (concept_id, prereq_id), CHECK (concept_id <> prereq_id),
  FOREIGN KEY (concept_id, school_id) REFERENCES concept(id, school_id),
  FOREIGN KEY (prereq_id, school_id) REFERENCES concept(id, school_id)
);
--> statement-breakpoint
CREATE TABLE note (
  id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, chapter_id TEXT NOT NULL,
  title TEXT NOT NULL, body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  release_at INTEGER, updated_at INTEGER NOT NULL,
  file_key TEXT, filename TEXT, content_type TEXT, file_size INTEGER,
  UNIQUE (id, chapter_id, school_id),
  FOREIGN KEY (chapter_id, school_id) REFERENCES chapter(id, school_id)
);
--> statement-breakpoint
CREATE INDEX note_chapter_release_idx ON note(school_id, chapter_id, status, release_at);
--> statement-breakpoint
CREATE TABLE note_concept (
  note_id TEXT NOT NULL, concept_id TEXT NOT NULL, chapter_id TEXT NOT NULL, school_id TEXT NOT NULL,
  UNIQUE (note_id, concept_id),
  FOREIGN KEY (note_id, chapter_id, school_id) REFERENCES note(id, chapter_id, school_id),
  FOREIGN KEY (concept_id, chapter_id, school_id) REFERENCES concept(id, chapter_id, school_id)
);
--> statement-breakpoint
CREATE TABLE learning_session (
  id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, chapter_id TEXT NOT NULL, section_id TEXT NOT NULL,
  title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  release_at INTEGER, updated_at INTEGER NOT NULL,
  UNIQUE (id, school_id), UNIQUE (id, chapter_id, school_id),
  FOREIGN KEY (chapter_id, school_id) REFERENCES chapter(id, school_id),
  FOREIGN KEY (section_id, school_id) REFERENCES section(id, school_id)
);
--> statement-breakpoint
CREATE INDEX learning_session_chapter_release_idx ON learning_session(school_id, chapter_id, section_id, status, release_at);
--> statement-breakpoint
CREATE TABLE slide (
  id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, chapter_id TEXT NOT NULL,
  session_id TEXT NOT NULL, concept_id TEXT NOT NULL, note_id TEXT,
  position INTEGER NOT NULL CHECK (position >= 0), title TEXT NOT NULL, body TEXT NOT NULL,
  UNIQUE (session_id, position),
  FOREIGN KEY (session_id, chapter_id, school_id) REFERENCES learning_session(id, chapter_id, school_id),
  FOREIGN KEY (concept_id, chapter_id, school_id) REFERENCES concept(id, chapter_id, school_id),
  FOREIGN KEY (note_id, chapter_id, school_id) REFERENCES note(id, chapter_id, school_id)
);
--> statement-breakpoint
CREATE TABLE item (
  id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, chapter_id TEXT NOT NULL,
  session_id TEXT NOT NULL, concept_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0), content TEXT NOT NULL CHECK (json_valid(content)),
  UNIQUE (session_id, position),
  FOREIGN KEY (session_id, chapter_id, school_id) REFERENCES learning_session(id, chapter_id, school_id),
  FOREIGN KEY (concept_id, chapter_id, school_id) REFERENCES concept(id, chapter_id, school_id)
);
--> statement-breakpoint
CREATE TABLE session_progress (
  session_id TEXT NOT NULL, profile_id TEXT NOT NULL, school_id TEXT NOT NULL,
  viewed_slides INTEGER NOT NULL DEFAULT 0 CHECK (viewed_slides >= 0),
  check_submitted_at INTEGER, completed_at INTEGER,
  UNIQUE (session_id, profile_id), CHECK (completed_at IS NULL OR check_submitted_at IS NOT NULL),
  FOREIGN KEY (session_id, school_id) REFERENCES learning_session(id, school_id),
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id)
);
--> statement-breakpoint
CREATE INDEX session_progress_profile_idx ON session_progress(school_id, profile_id);
