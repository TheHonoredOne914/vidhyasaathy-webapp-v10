CREATE TABLE game_session (
  id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, profile_id TEXT NOT NULL,
  game_id TEXT NOT NULL, concept_id TEXT NOT NULL,
  started_at INTEGER NOT NULL, finished_at INTEGER,
  answered INTEGER NOT NULL DEFAULT 0, correct INTEGER NOT NULL DEFAULT 0,
  best_kind TEXT, best_value INTEGER, best_label TEXT,
  FOREIGN KEY(profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY(concept_id, school_id) REFERENCES concept(id, school_id)
);
--> statement-breakpoint
CREATE INDEX game_session_owner_idx ON game_session(school_id, profile_id, started_at);
--> statement-breakpoint
CREATE TABLE game_checkpoint_map (
  school_id TEXT NOT NULL, game_id TEXT NOT NULL, checkpoint_key TEXT NOT NULL,
  concept_id TEXT NOT NULL, item_id TEXT NOT NULL,
  PRIMARY KEY(school_id, game_id, checkpoint_key),
  FOREIGN KEY(concept_id, school_id) REFERENCES concept(id, school_id),
  FOREIGN KEY(item_id, concept_id, school_id) REFERENCES item(id, concept_id, school_id)
);