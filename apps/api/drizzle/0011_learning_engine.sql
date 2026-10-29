ALTER TABLE concept ADD COLUMN source_class INTEGER CHECK (source_class IS NULL OR source_class BETWEEN 1 AND 12);
--> statement-breakpoint
ALTER TABLE session_progress ADD COLUMN last_review TEXT;
--> statement-breakpoint
CREATE TABLE answer_evidence (
  id TEXT PRIMARY KEY NOT NULL,
  school_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4),
  correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
  confidence TEXT NOT NULL CHECK (confidence IN ('sure', 'unsure', 'guess')),
  source TEXT NOT NULL CHECK (
    source IN ('session', 'quiz', 'homework', 'diagnostic', 'flashcard', 'remediation', 'practice')
    OR source LIKE 'game:%'
  ),
  error_type TEXT CHECK (error_type IS NULL OR error_type IN ('concept_gap', 'careless', 'method', 'guess')),
  time_ms INTEGER NOT NULL CHECK (time_ms BETWEEN 0 AND 86400000),
  answer TEXT NOT NULL CHECK (json_valid(answer)),
  not_taught INTEGER NOT NULL DEFAULT 0 CHECK (not_taught IN (0, 1)),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY (concept_id, school_id) REFERENCES concept(id, school_id),
  FOREIGN KEY (item_id, concept_id, school_id) REFERENCES item(id, concept_id, school_id)
);
--> statement-breakpoint
CREATE INDEX answer_evidence_profile_idx ON answer_evidence(school_id, profile_id, concept_id, created_at);
--> statement-breakpoint
CREATE TABLE concept_ladder (
  school_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  ladder_level INTEGER NOT NULL DEFAULT 2 CHECK (ladder_level BETWEEN 1 AND 4),
  streak_correct INTEGER NOT NULL DEFAULT 0 CHECK (streak_correct >= 0),
  streak_wrong INTEGER NOT NULL DEFAULT 0 CHECK (streak_wrong >= 0),
  mastery_level INTEGER CHECK (mastery_level IS NULL OR mastery_level BETWEEN 1 AND 4),
  mastery_score REAL NOT NULL DEFAULT 0 CHECK (mastery_score BETWEEN 0 AND 1),
  misconception INTEGER NOT NULL DEFAULT 0 CHECK (misconception IN (0, 1)),
  bridge TEXT,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (profile_id, concept_id),
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY (concept_id, school_id) REFERENCES concept(id, school_id)
);
--> statement-breakpoint
CREATE INDEX concept_ladder_school_idx ON concept_ladder(school_id, profile_id);
--> statement-breakpoint
CREATE TABLE chapter_band (
  school_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  band TEXT NOT NULL CHECK (band IN ('0-25', '25-50', '50-75', '75-100')),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (profile_id, chapter_id),
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY (chapter_id, school_id) REFERENCES chapter(id, school_id)
);
--> statement-breakpoint
CREATE TABLE band_event (
  id TEXT PRIMARY KEY NOT NULL,
  school_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  from_band TEXT CHECK (from_band IS NULL OR from_band IN ('0-25', '25-50', '50-75', '75-100')),
  to_band TEXT NOT NULL CHECK (to_band IN ('0-25', '25-50', '50-75', '75-100')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY (chapter_id, school_id) REFERENCES chapter(id, school_id)
);
--> statement-breakpoint
CREATE INDEX band_event_profile_idx ON band_event(school_id, profile_id, chapter_id, created_at);
--> statement-breakpoint
CREATE TABLE diagnostic_result (
  school_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  route TEXT NOT NULL CHECK (route IN ('challenge', 'steady', 'repair')),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (profile_id, chapter_id),
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY (chapter_id, school_id) REFERENCES chapter(id, school_id)
);
