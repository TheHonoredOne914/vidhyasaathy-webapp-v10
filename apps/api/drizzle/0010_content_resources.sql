ALTER TABLE note ADD COLUMN type TEXT NOT NULL DEFAULT 'pdf' CHECK (type IN ('pdf','ppt','image','youtube','recording'));
ALTER TABLE note ADD COLUMN start_sec INTEGER;
ALTER TABLE note ADD COLUMN end_sec INTEGER;
ALTER TABLE school ADD COLUMN recordings_allowed INTEGER NOT NULL DEFAULT 0 CHECK (recordings_allowed IN (0,1));

CREATE TABLE recording (
  id TEXT PRIMARY KEY NOT NULL,
  school_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  title TEXT NOT NULL,
  file_key TEXT,
  filename TEXT,
  content_type TEXT,
  file_size INTEGER,
  release_at INTEGER,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (chapter_id, school_id) REFERENCES chapter(id, school_id)
);
CREATE INDEX recording_chapter_release_idx ON recording(school_id, chapter_id, release_at);
CREATE TABLE recording_segment (
  id TEXT PRIMARY KEY NOT NULL,
  recording_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_sec INTEGER NOT NULL,
  end_sec INTEGER NOT NULL,
  FOREIGN KEY (recording_id) REFERENCES recording(id),
  FOREIGN KEY (concept_id, chapter_id, school_id) REFERENCES concept(id, chapter_id, school_id),
  CHECK (start_sec >= 0 AND end_sec > start_sec)
);
CREATE INDEX recording_segment_concept_idx ON recording_segment(school_id, concept_id);

CREATE TABLE notification_new (
  id TEXT PRIMARY KEY, school_id TEXT NOT NULL, profile_id TEXT NOT NULL, announcement_id TEXT, dedupe_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK(kind IN ('announcement','parent_summary','content_publish')), title TEXT NOT NULL, body TEXT NOT NULL, href TEXT NOT NULL,
  channel TEXT NOT NULL CHECK(channel IN ('in_app','email','whatsapp')), status TEXT NOT NULL CHECK(status IN ('queued','delivered','failed')), failure TEXT,
  created_at INTEGER NOT NULL, deliver_after INTEGER NOT NULL, delivered_at INTEGER, read_at INTEGER,
  CONSTRAINT notification_status_valid CHECK((status='queued' AND delivered_at IS NULL AND failure IS NULL) OR (status='delivered' AND delivered_at IS NOT NULL AND failure IS NULL) OR (status='failed' AND delivered_at IS NULL AND failure IS NOT NULL)),
  FOREIGN KEY(profile_id, school_id) REFERENCES profile(id, school_id), FOREIGN KEY(announcement_id, school_id) REFERENCES announcement(id, school_id)
);
INSERT INTO notification_new SELECT * FROM notification;
DROP TABLE notification;
ALTER TABLE notification_new RENAME TO notification;
CREATE INDEX notification_inbox_idx ON notification(school_id, profile_id, created_at);
CREATE INDEX notification_queue_idx ON notification(status, deliver_after);

