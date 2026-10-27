CREATE TABLE dashboard_job (
  school_id TEXT PRIMARY KEY REFERENCES school(id), dirty INTEGER NOT NULL DEFAULT 1 CHECK (dirty IN (0,1)), refreshed_at INTEGER
);
--> statement-breakpoint
INSERT INTO dashboard_job (school_id) SELECT id FROM school;
--> statement-breakpoint
CREATE TABLE class_concept_daily (
  school_id TEXT NOT NULL, section_id TEXT NOT NULL, concept_id TEXT NOT NULL, day TEXT NOT NULL,
  attempts INTEGER NOT NULL, correct INTEGER NOT NULL, pending_review INTEGER NOT NULL,
  CONSTRAINT class_concept_daily_counts CHECK (correct BETWEEN 0 AND attempts AND pending_review >= 0),
  FOREIGN KEY(section_id, school_id) REFERENCES section(id, school_id),
  FOREIGN KEY(concept_id, school_id) REFERENCES concept(id, school_id)
);
--> statement-breakpoint
CREATE UNIQUE INDEX class_concept_daily_unique ON class_concept_daily(school_id, section_id, concept_id, day);
--> statement-breakpoint
CREATE TABLE misconception_daily (
  school_id TEXT NOT NULL, section_id TEXT NOT NULL, concept_id TEXT NOT NULL, item_id TEXT NOT NULL,
  day TEXT NOT NULL, option TEXT NOT NULL, count INTEGER NOT NULL CHECK(count > 0),
  FOREIGN KEY(section_id, school_id) REFERENCES section(id, school_id),
  FOREIGN KEY(item_id, concept_id, school_id) REFERENCES item(id, concept_id, school_id)
);
--> statement-breakpoint
CREATE UNIQUE INDEX misconception_daily_unique ON misconception_daily(school_id, section_id, item_id, day, option);
--> statement-breakpoint
CREATE TABLE reteach_decision (
  id TEXT PRIMARY KEY, school_id TEXT NOT NULL, section_id TEXT NOT NULL, concept_id TEXT NOT NULL, teacher_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK(decision IN ('reteach','practice','monitor')), note TEXT NOT NULL, created_at INTEGER NOT NULL,
  FOREIGN KEY(section_id, school_id) REFERENCES section(id, school_id),
  FOREIGN KEY(concept_id, school_id) REFERENCES concept(id, school_id),
  FOREIGN KEY(teacher_id, school_id) REFERENCES profile(id, school_id)
);
--> statement-breakpoint
CREATE INDEX reteach_decision_section_idx ON reteach_decision(school_id, section_id, created_at);
--> statement-breakpoint
CREATE TABLE announcement (
  id TEXT PRIMARY KEY, school_id TEXT NOT NULL, section_id TEXT NOT NULL, author_id TEXT NOT NULL,
  title TEXT NOT NULL, body TEXT NOT NULL, audience TEXT NOT NULL CHECK(audience IN ('students','parents','all')),
  channels TEXT NOT NULL CHECK(json_valid(channels)), created_at INTEGER NOT NULL,
  FOREIGN KEY(section_id, school_id) REFERENCES section(id, school_id),
  FOREIGN KEY(author_id, school_id) REFERENCES profile(id, school_id)
);
--> statement-breakpoint
CREATE UNIQUE INDEX announcement_id_school_unique ON announcement(id, school_id);
--> statement-breakpoint
CREATE INDEX announcement_section_idx ON announcement(school_id, section_id, created_at);
--> statement-breakpoint
CREATE TABLE notification_setting (
  profile_id TEXT PRIMARY KEY, school_id TEXT NOT NULL, enabled INTEGER NOT NULL CHECK(enabled IN (0,1)),
  quiet_start INTEGER NOT NULL CHECK(quiet_start BETWEEN 0 AND 1439), quiet_end INTEGER NOT NULL CHECK(quiet_end BETWEEN 0 AND 1439),
  utc_offset_minutes INTEGER NOT NULL CHECK(utc_offset_minutes BETWEEN -720 AND 840),
  reduced_motion INTEGER NOT NULL CHECK(reduced_motion IN (0,1)), updated_at INTEGER NOT NULL,
  FOREIGN KEY(profile_id, school_id) REFERENCES profile(id, school_id)
);
--> statement-breakpoint
CREATE TABLE notification (
  id TEXT PRIMARY KEY, school_id TEXT NOT NULL, profile_id TEXT NOT NULL, announcement_id TEXT, dedupe_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK(kind IN ('announcement','parent_summary')), title TEXT NOT NULL, body TEXT NOT NULL, href TEXT NOT NULL,
  channel TEXT NOT NULL CHECK(channel IN ('in_app','email','whatsapp')),
  status TEXT NOT NULL CHECK(status IN ('queued','delivered','failed')), failure TEXT,
  created_at INTEGER NOT NULL, deliver_after INTEGER NOT NULL, delivered_at INTEGER, read_at INTEGER,
  CONSTRAINT notification_status_valid CHECK(
    (status = 'queued' AND delivered_at IS NULL AND failure IS NULL) OR
    (status = 'delivered' AND delivered_at IS NOT NULL AND failure IS NULL) OR
    (status = 'failed' AND delivered_at IS NULL AND failure IS NOT NULL)),
  FOREIGN KEY(profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY(announcement_id, school_id) REFERENCES announcement(id, school_id)
);
--> statement-breakpoint
CREATE INDEX notification_inbox_idx ON notification(school_id, profile_id, created_at);
--> statement-breakpoint
CREATE INDEX notification_queue_idx ON notification(status, deliver_after);
--> statement-breakpoint
CREATE TRIGGER dashboard_school_insert AFTER INSERT ON school BEGIN
  INSERT INTO dashboard_job(school_id) VALUES(NEW.id);
END;
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
--> statement-breakpoint
CREATE TRIGGER dashboard_evidence_insert AFTER INSERT ON learning_evidence BEGIN
  UPDATE dashboard_job SET dirty = 1 WHERE school_id = NEW.school_id;
END;
--> statement-breakpoint
CREATE TRIGGER dashboard_evidence_update AFTER UPDATE ON learning_evidence BEGIN
  UPDATE dashboard_job SET dirty = 1 WHERE school_id IN (OLD.school_id, NEW.school_id);
END;
--> statement-breakpoint
CREATE TRIGGER dashboard_evidence_delete AFTER DELETE ON learning_evidence BEGIN
  UPDATE dashboard_job SET dirty = 1 WHERE school_id = OLD.school_id;
END;
--> statement-breakpoint
CREATE TRIGGER dashboard_enrollment_update AFTER UPDATE OF section_id ON profile BEGIN
  UPDATE dashboard_job SET dirty = 1 WHERE school_id IN (OLD.school_id, NEW.school_id);
END;
--> statement-breakpoint
CREATE TRIGGER dashboard_parent_link_insert AFTER INSERT ON parent_link BEGIN
  UPDATE dashboard_job SET dirty = 1 WHERE school_id = NEW.school_id;
END;
--> statement-breakpoint
CREATE TRIGGER dashboard_parent_link_delete AFTER DELETE ON parent_link BEGIN
  DELETE FROM notification WHERE school_id = OLD.school_id AND profile_id = OLD.parent_profile_id
    AND kind = 'parent_summary' AND dedupe_key LIKE 'parent:' || OLD.parent_profile_id || ':' || OLD.student_profile_id || ':%';
  UPDATE dashboard_job SET dirty = 1 WHERE school_id = OLD.school_id;
END;
