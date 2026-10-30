-- Daily loop. Additive only. notification.kind is unchanged; the specific ping lives in topic.
ALTER TABLE assignment ADD COLUMN late_until INTEGER CHECK (late_until IS NULL OR late_until >= 0);
--> statement-breakpoint
ALTER TABLE notification ADD COLUMN topic TEXT CHECK (
  topic IS NULL OR topic IN (
    'session_open', 'homework_due', 'graded', 'streak', 'parent_viewed', 'game_of_day', 'reteach', 'badge'
  )
);
--> statement-breakpoint
ALTER TABLE notification_setting ADD COLUMN notify_sessions INTEGER DEFAULT 1 CHECK (notify_sessions IS NULL OR notify_sessions IN (0, 1));
--> statement-breakpoint
ALTER TABLE notification_setting ADD COLUMN notify_homework INTEGER DEFAULT 1 CHECK (notify_homework IS NULL OR notify_homework IN (0, 1));
--> statement-breakpoint
ALTER TABLE notification_setting ADD COLUMN notify_streak INTEGER DEFAULT 1 CHECK (notify_streak IS NULL OR notify_streak IN (0, 1));
--> statement-breakpoint
ALTER TABLE notification_setting ADD COLUMN notify_parent_view INTEGER DEFAULT 1 CHECK (notify_parent_view IS NULL OR notify_parent_view IN (0, 1));
--> statement-breakpoint
ALTER TABLE notification_setting ADD COLUMN notify_game INTEGER DEFAULT 1 CHECK (notify_game IS NULL OR notify_game IN (0, 1));
--> statement-breakpoint
ALTER TABLE notification_setting ADD COLUMN quiet_after_21 INTEGER DEFAULT 1 CHECK (quiet_after_21 IS NULL OR quiet_after_21 IN (0, 1));
--> statement-breakpoint
CREATE TABLE streak_touch (
  profile_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  day TEXT NOT NULL,
  act TEXT NOT NULL CHECK (act IN ('session_part', 'game_round', 'warmup', 'daily_challenge', 'homework_submit', 'catchup', 'dushman')),
  source_event_id TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (profile_id, day),
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id)
);
--> statement-breakpoint
CREATE INDEX streak_touch_school_idx ON streak_touch(school_id, profile_id);
--> statement-breakpoint
CREATE TABLE streak_state (
  profile_id TEXT PRIMARY KEY NOT NULL,
  school_id TEXT NOT NULL,
  current_days INTEGER NOT NULL DEFAULT 0 CHECK (current_days >= 0),
  longest_days INTEGER NOT NULL DEFAULT 0 CHECK (longest_days >= 0),
  last_day TEXT,
  freezes_held INTEGER NOT NULL DEFAULT 0 CHECK (freezes_held BETWEEN 0 AND 2),
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id)
);
--> statement-breakpoint
CREATE TABLE streak_freeze_ledger (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('earned', 'consumed')),
  day TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id)
);
--> statement-breakpoint
CREATE INDEX streak_freeze_ledger_profile_idx ON streak_freeze_ledger(school_id, profile_id, day);
--> statement-breakpoint
CREATE TABLE daily_challenge (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  day TEXT NOT NULL,
  item_ids TEXT NOT NULL CHECK (json_valid(item_ids)),
  status TEXT NOT NULL CHECK (status IN ('served', 'completed', 'expired')),
  correct INTEGER NOT NULL DEFAULT 0 CHECK (correct >= 0),
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  started_at INTEGER,
  completed_at INTEGER,
  UNIQUE (profile_id, day),
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id)
);
--> statement-breakpoint
CREATE INDEX daily_challenge_school_idx ON daily_challenge(school_id, profile_id, day);
--> statement-breakpoint
CREATE TABLE dushman_entry (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'retired')),
  queued_at INTEGER NOT NULL,
  retired_at INTEGER,
  reason TEXT,
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY (concept_id, school_id) REFERENCES concept(id, school_id)
);
--> statement-breakpoint
CREATE INDEX dushman_entry_active_idx ON dushman_entry(school_id, profile_id, status);
--> statement-breakpoint
CREATE TRIGGER dushman_entry_active_limit
BEFORE INSERT ON dushman_entry
WHEN NEW.status = 'active'
  AND (SELECT COUNT(*) FROM dushman_entry WHERE profile_id = NEW.profile_id AND school_id = NEW.school_id AND status = 'active') >= 3
BEGIN
  SELECT RAISE(ABORT, 'at most 3 active dushman');
END;
--> statement-breakpoint
CREATE TABLE dushman_event (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('queued', 'faced', 'victory', 'retired')),
  evidence_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY (concept_id, school_id) REFERENCES concept(id, school_id)
);
--> statement-breakpoint
CREATE INDEX dushman_event_profile_idx ON dushman_event(school_id, profile_id, created_at);
--> statement-breakpoint
CREATE TABLE badge_catalog (
  id TEXT PRIMARY KEY NOT NULL CHECK (id IN ('fixed_it', 'comeback_king', 'dushman_slayer', 'boss_buster')),
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_hi TEXT NOT NULL,
  icon_key TEXT NOT NULL
);
--> statement-breakpoint
INSERT INTO badge_catalog (id, name_en, name_hi, description_en, description_hi, icon_key) VALUES
  ('fixed_it', 'Fixed It', 'ठीक कर लिया', 'A shaky idea is steadier now.', 'एक डगमगाता विचार अब स्थिर है।', 'badge-fixed'),
  ('comeback_king', 'Comeback King', 'वापसी', 'You came back and finished the small steps.', 'तुम लौटे और छोटे कदम पूरे किए।', 'badge-comeback'),
  ('dushman_slayer', 'Dushman Slayer', 'दुश्मन हराया', 'A repeated mistake has been put to rest.', 'एक दोहराई गलती अब शांत है।', 'badge-dushman'),
  ('boss_buster', 'Boss Buster', 'कठिन सवाल', 'Saved for a later challenge.', 'यह बाद की चुनौती के लिए रखा है।', 'badge-boss');
--> statement-breakpoint
CREATE TABLE badge_award (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  scope_key TEXT NOT NULL,
  trigger_event_id TEXT NOT NULL,
  awarded_at INTEGER NOT NULL,
  seen_at INTEGER,
  UNIQUE (profile_id, badge_id, scope_key),
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY (badge_id) REFERENCES badge_catalog(id)
);
--> statement-breakpoint
CREATE INDEX badge_award_profile_idx ON badge_award(school_id, profile_id, awarded_at);
--> statement-breakpoint
CREATE TABLE study_plan (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  goal TEXT NOT NULL,
  exam_date TEXT NOT NULL,
  minutes_per_night INTEGER NOT NULL DEFAULT 25 CHECK (minutes_per_night BETWEEN 5 AND 180),
  status TEXT NOT NULL CHECK (status IN ('active', 'archived')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id)
);
--> statement-breakpoint
CREATE UNIQUE INDEX study_plan_id_school_unique ON study_plan(id, school_id);
--> statement-breakpoint
CREATE TABLE study_plan_item (
  id TEXT PRIMARY KEY NOT NULL,
  plan_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  night TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('repair', 'learn', 'revise', 'practice', 'warmup')),
  est_minutes INTEGER NOT NULL CHECK (est_minutes > 0),
  order_idx INTEGER NOT NULL CHECK (order_idx >= 0),
  status TEXT NOT NULL CHECK (status IN ('planned', 'done', 'folded', 'dropped')),
  FOREIGN KEY (plan_id, school_id) REFERENCES study_plan(id, school_id),
  FOREIGN KEY (concept_id, school_id) REFERENCES concept(id, school_id)
);
--> statement-breakpoint
CREATE INDEX study_plan_item_night_idx ON study_plan_item(plan_id, night, order_idx);
--> statement-breakpoint
CREATE TABLE plan_completion_event (
  id TEXT PRIMARY KEY NOT NULL,
  plan_item_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('done', 'missed', 'folded')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (plan_item_id) REFERENCES study_plan_item(id),
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id)
);
--> statement-breakpoint
CREATE INDEX plan_completion_event_profile_idx ON plan_completion_event(school_id, profile_id, created_at);
--> statement-breakpoint
CREATE TABLE learning_event (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN (
    'recovery_offered', 'recovery_completed', 'warmup_offered', 'warmup_skipped', 'warmup_completed',
    'frustration_flagged', 'absence_detected'
  )),
  concept_id TEXT,
  payload TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(payload)),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY (concept_id, school_id) REFERENCES concept(id, school_id)
);
--> statement-breakpoint
CREATE INDEX learning_event_profile_idx ON learning_event(school_id, profile_id, created_at);
--> statement-breakpoint
CREATE TABLE assignment_draft (
  profile_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  assignment_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  answer TEXT NOT NULL CHECK (json_valid(answer)),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (profile_id, assignment_id, item_id),
  FOREIGN KEY (profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY (assignment_id, school_id) REFERENCES assignment(id, school_id)
);
