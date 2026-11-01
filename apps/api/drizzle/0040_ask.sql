CREATE TABLE ask_thread (
 id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, profile_id TEXT NOT NULL,
 chapter_id TEXT, concept_id TEXT, title TEXT NOT NULL, style TEXT NOT NULL DEFAULT 'hints',
 mode TEXT NOT NULL DEFAULT 'learn', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
 UNIQUE(id, school_id),
 FOREIGN KEY(profile_id, school_id) REFERENCES profile(id, school_id),
 FOREIGN KEY(chapter_id, school_id) REFERENCES chapter(id, school_id),
 FOREIGN KEY(concept_id, school_id) REFERENCES concept(id, school_id)
);
--> statement-breakpoint
CREATE INDEX ask_thread_owner_idx ON ask_thread(school_id, profile_id, updated_at);
--> statement-breakpoint
CREATE TABLE ask_message (
 id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, thread_id TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('student','saathy')), text TEXT NOT NULL,
 client_event_id TEXT, metadata TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL,
 UNIQUE(thread_id, client_event_id, role),
 FOREIGN KEY(thread_id, school_id) REFERENCES ask_thread(id, school_id)
);
--> statement-breakpoint
CREATE TABLE ask_saved (
 id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, profile_id TEXT NOT NULL,
 message_id TEXT NOT NULL, title TEXT NOT NULL, subject_id TEXT, text TEXT NOT NULL,
 created_at INTEGER NOT NULL, UNIQUE(profile_id, message_id),
 FOREIGN KEY(profile_id, school_id) REFERENCES profile(id, school_id),
 FOREIGN KEY(subject_id, school_id) REFERENCES subject(id, school_id)
);
--> statement-breakpoint
CREATE TABLE doubt_cluster_counter (
 school_id TEXT NOT NULL, section_id TEXT NOT NULL, concept_id TEXT NOT NULL,
 subtag TEXT NOT NULL, day TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0,
 snippets TEXT NOT NULL DEFAULT '[]', PRIMARY KEY(school_id, section_id, concept_id, subtag, day),
 FOREIGN KEY(section_id, school_id) REFERENCES section(id, school_id),
 FOREIGN KEY(concept_id, school_id) REFERENCES concept(id, school_id)
);
--> statement-breakpoint
CREATE TABLE doubt_escalation (
 id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, profile_id TEXT NOT NULL,
 section_id TEXT NOT NULL, teacher_id TEXT NOT NULL, message_id TEXT NOT NULL,
 concept_id TEXT, question_text TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open',
 teacher_reply TEXT, created_at INTEGER NOT NULL, replied_at INTEGER,
 UNIQUE(profile_id, message_id),
 FOREIGN KEY(profile_id, school_id) REFERENCES profile(id, school_id),
 FOREIGN KEY(teacher_id, school_id) REFERENCES profile(id, school_id),
 FOREIGN KEY(section_id, school_id) REFERENCES section(id, school_id)
);
--> statement-breakpoint
CREATE TABLE ai_budget_day (
 school_id TEXT NOT NULL, profile_id TEXT NOT NULL, day TEXT NOT NULL,
 used_tokens INTEGER NOT NULL DEFAULT 0 CHECK(used_tokens >= 0),
 PRIMARY KEY(school_id, profile_id, day),
 FOREIGN KEY(profile_id, school_id) REFERENCES profile(id, school_id)
);
--> statement-breakpoint
CREATE TABLE snap_upload (
 id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, profile_id TEXT NOT NULL,
 path TEXT NOT NULL, status TEXT NOT NULL, text TEXT, confirmed INTEGER NOT NULL DEFAULT 0,
 created_at INTEGER NOT NULL,
 FOREIGN KEY(profile_id, school_id) REFERENCES profile(id, school_id)
);
--> statement-breakpoint
CREATE TABLE followup_item (
 id TEXT PRIMARY KEY NOT NULL, school_id TEXT NOT NULL, profile_id TEXT NOT NULL,
 concept_id TEXT NOT NULL, item_id TEXT, reason TEXT NOT NULL, due_at INTEGER NOT NULL,
 completed_at INTEGER, created_at INTEGER NOT NULL,
 FOREIGN KEY(profile_id, school_id) REFERENCES profile(id, school_id),
 FOREIGN KEY(concept_id, school_id) REFERENCES concept(id, school_id),
 FOREIGN KEY(item_id, concept_id, school_id) REFERENCES item(id, concept_id, school_id)
);
--> statement-breakpoint
ALTER TABLE answer_evidence ADD COLUMN weight REAL NOT NULL DEFAULT 1.0 CHECK(weight > 0 AND weight <= 1);
