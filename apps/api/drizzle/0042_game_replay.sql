CREATE TABLE game_event (
 school_id TEXT NOT NULL, profile_id TEXT NOT NULL, client_event_id TEXT NOT NULL,
 request TEXT NOT NULL, response TEXT NOT NULL,
 PRIMARY KEY (school_id, profile_id, client_event_id),
 FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id)
);
--> statement-breakpoint
CREATE TABLE game_session_item (
 session_id TEXT NOT NULL REFERENCES game_session(id), checkpoint_key TEXT NOT NULL,
 item_id TEXT NOT NULL, concept_id TEXT NOT NULL, chapter_id TEXT NOT NULL,
 content TEXT NOT NULL, response TEXT,
 PRIMARY KEY (session_id, checkpoint_key)
);
--> statement-breakpoint
CREATE TABLE ask_quick_try (
 thread_id TEXT PRIMARY KEY REFERENCES ask_thread(id), item_id TEXT NOT NULL,
 concept_id TEXT NOT NULL, chapter_id TEXT NOT NULL, content TEXT NOT NULL,
 created_at INTEGER NOT NULL, client_event_id TEXT, request TEXT, response TEXT
);
--> statement-breakpoint
ALTER TABLE doubt_escalation ADD COLUMN thread_id TEXT REFERENCES ask_thread(id);
--> statement-breakpoint
ALTER TABLE answer_evidence ADD COLUMN source_detail TEXT;
