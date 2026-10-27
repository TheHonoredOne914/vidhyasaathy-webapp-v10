CREATE TABLE school (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE user (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,
  pin_hash TEXT,
  failed_pin_attempts INTEGER DEFAULT 0 NOT NULL CHECK (failed_pin_attempts >= 0),
  pin_locked_until INTEGER,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE profile (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL UNIQUE REFERENCES user(id),
  school_id TEXT NOT NULL REFERENCES school(id),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX profile_id_school_unique ON profile(id, school_id);
--> statement-breakpoint
CREATE INDEX profile_school_idx ON profile(school_id);
--> statement-breakpoint
CREATE TABLE claim_code (
  id TEXT PRIMARY KEY NOT NULL,
  code_hash TEXT NOT NULL UNIQUE,
  school_id TEXT NOT NULL REFERENCES school(id),
  profile_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  redeemed_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id)
);
--> statement-breakpoint
CREATE INDEX claim_code_profile_idx ON claim_code(profile_id);
--> statement-breakpoint
CREATE TABLE session (
  token_hash TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  school_id TEXT NOT NULL REFERENCES school(id),
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id)
);
--> statement-breakpoint
CREATE INDEX session_expiry_idx ON session(expires_at);
--> statement-breakpoint
CREATE INDEX session_profile_idx ON session(profile_id);
--> statement-breakpoint
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  school_id TEXT REFERENCES school(id),
  profile_id TEXT REFERENCES profile(id),
  action TEXT NOT NULL,
  request_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX audit_log_school_time_idx ON audit_log(school_id, created_at);
--> statement-breakpoint
CREATE TABLE rate_limit (
  key TEXT PRIMARY KEY NOT NULL,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX rate_limit_expiry_idx ON rate_limit(expires_at);
