CREATE TABLE concept_lesson (
  concept_id TEXT PRIMARY KEY NOT NULL,
  school_id TEXT NOT NULL,
  body TEXT NOT NULL CHECK (json_valid(body)),
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (concept_id, school_id) REFERENCES concept(id, school_id)
);
--> statement-breakpoint
CREATE TABLE revision_hook (
  school_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  interval_days INTEGER NOT NULL CHECK (interval_days IN (1, 3, 7)),
  due_at INTEGER NOT NULL CHECK (due_at >= 0),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (profile_id, concept_id, interval_days),
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY (concept_id, school_id) REFERENCES concept(id, school_id)
);
--> statement-breakpoint
CREATE INDEX revision_hook_due_idx ON revision_hook(school_id, profile_id, due_at);
