ALTER TABLE profile ADD COLUMN phone TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE TABLE otp_challenge (
  id TEXT PRIMARY KEY NOT NULL, token_hash TEXT NOT NULL UNIQUE, school_id TEXT NOT NULL,
  profile_id TEXT, claim_code_id TEXT, phone TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('student_verify', 'parent_login', 'teacher_pin')),
  code_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY (claim_code_id) REFERENCES claim_code(id)
);
--> statement-breakpoint
CREATE INDEX otp_challenge_expiry_idx ON otp_challenge(expires_at);
