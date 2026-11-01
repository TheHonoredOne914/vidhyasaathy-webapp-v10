CREATE TABLE learning_preferences (
  profile_id TEXT PRIMARY KEY NOT NULL,
  school_id TEXT NOT NULL,
  preferences TEXT NOT NULL CHECK (json_valid(preferences)),
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id)
);
--> statement-breakpoint
CREATE TABLE practice_round (
  id TEXT PRIMARY KEY NOT NULL,
  school_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  item_ids TEXT NOT NULL CHECK (json_valid(item_ids)),
  attempt_ids TEXT NOT NULL CHECK (json_valid(attempt_ids)),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY (chapter_id, school_id) REFERENCES chapter(id, school_id)
);
--> statement-breakpoint
CREATE INDEX practice_round_profile_idx ON practice_round(school_id, profile_id);
