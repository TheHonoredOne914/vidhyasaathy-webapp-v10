CREATE TABLE attempt_p7 (
  id TEXT PRIMARY KEY NOT NULL, client_event_id TEXT NOT NULL UNIQUE, school_id TEXT NOT NULL,
  assignment_id TEXT, profile_id TEXT NOT NULL, item_id TEXT NOT NULL, concept_id TEXT NOT NULL,
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
INSERT INTO attempt_p7 SELECT * FROM attempt;
--> statement-breakpoint
DROP TABLE attempt;
--> statement-breakpoint
ALTER TABLE attempt_p7 RENAME TO attempt;
--> statement-breakpoint
CREATE UNIQUE INDEX attempt_assignment_profile_item_unique ON attempt(assignment_id, profile_id, item_id);
--> statement-breakpoint
CREATE INDEX attempt_concept_profile_idx ON attempt(school_id, profile_id, concept_id);
--> statement-breakpoint
CREATE TRIGGER dashboard_attempt_insert AFTER INSERT ON attempt BEGIN
  UPDATE dashboard_job SET dirty = 1 WHERE school_id = NEW.school_id;
END;
--> statement-breakpoint
CREATE TRIGGER dashboard_attempt_update AFTER UPDATE ON attempt BEGIN
  UPDATE dashboard_job SET dirty = 1 WHERE school_id IN (OLD.school_id, NEW.school_id);
END;
--> statement-breakpoint
CREATE TRIGGER dashboard_attempt_delete AFTER DELETE ON attempt BEGIN
  UPDATE dashboard_job SET dirty = 1 WHERE school_id = OLD.school_id;
END;
