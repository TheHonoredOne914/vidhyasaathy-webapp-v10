CREATE TABLE academic_year (
  id TEXT PRIMARY KEY NOT NULL,
  school_id TEXT NOT NULL REFERENCES school(id),
  name TEXT NOT NULL,
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL,
  CHECK (ends_on > starts_on)
);
--> statement-breakpoint
CREATE UNIQUE INDEX academic_year_id_school_unique ON academic_year(id, school_id);
--> statement-breakpoint
CREATE UNIQUE INDEX academic_year_name_unique ON academic_year(school_id, name);
--> statement-breakpoint
CREATE TABLE class (
  id TEXT PRIMARY KEY NOT NULL,
  school_id TEXT NOT NULL REFERENCES school(id),
  academic_year_id TEXT NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (academic_year_id, school_id) REFERENCES academic_year(id, school_id)
);
--> statement-breakpoint
CREATE UNIQUE INDEX class_id_school_unique ON class(id, school_id);
--> statement-breakpoint
CREATE UNIQUE INDEX class_name_unique ON class(school_id, academic_year_id, name);
--> statement-breakpoint
CREATE TABLE section (
  id TEXT PRIMARY KEY NOT NULL,
  school_id TEXT NOT NULL REFERENCES school(id),
  class_id TEXT NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (class_id, school_id) REFERENCES class(id, school_id)
);
--> statement-breakpoint
CREATE UNIQUE INDEX section_id_school_unique ON section(id, school_id);
--> statement-breakpoint
CREATE UNIQUE INDEX section_id_class_school_unique ON section(id, class_id, school_id);
--> statement-breakpoint
CREATE UNIQUE INDEX section_name_unique ON section(school_id, class_id, name);
--> statement-breakpoint
CREATE TABLE subject (
  id TEXT PRIMARY KEY NOT NULL,
  school_id TEXT NOT NULL REFERENCES school(id),
  class_id TEXT NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (class_id, school_id) REFERENCES class(id, school_id)
);
--> statement-breakpoint
CREATE UNIQUE INDEX subject_id_school_unique ON subject(id, school_id);
--> statement-breakpoint
CREATE UNIQUE INDEX subject_id_class_school_unique ON subject(id, class_id, school_id);
--> statement-breakpoint
CREATE UNIQUE INDEX subject_name_unique ON subject(school_id, class_id, name);
--> statement-breakpoint
ALTER TABLE profile ADD COLUMN section_id TEXT REFERENCES section(id);
--> statement-breakpoint
ALTER TABLE profile ADD COLUMN roll_number TEXT;
--> statement-breakpoint
CREATE UNIQUE INDEX profile_section_roll_unique ON profile(school_id, section_id, roll_number);
--> statement-breakpoint
CREATE TRIGGER profile_enrollment_insert BEFORE INSERT ON profile
WHEN NOT ((NEW.section_id IS NULL AND NEW.roll_number IS NULL) OR
  (NEW.role = 'student' AND NEW.section_id IS NOT NULL AND NEW.roll_number IS NOT NULL AND
   EXISTS (SELECT 1 FROM section WHERE id = NEW.section_id AND school_id = NEW.school_id)))
BEGIN SELECT RAISE(ABORT, 'Invalid student enrollment'); END;
--> statement-breakpoint
CREATE TRIGGER profile_enrollment_update BEFORE UPDATE OF section_id, roll_number, role, school_id ON profile
WHEN NOT ((NEW.section_id IS NULL AND NEW.roll_number IS NULL) OR
  (NEW.role = 'student' AND NEW.section_id IS NOT NULL AND NEW.roll_number IS NOT NULL AND
   EXISTS (SELECT 1 FROM section WHERE id = NEW.section_id AND school_id = NEW.school_id)))
BEGIN SELECT RAISE(ABORT, 'Invalid student enrollment'); END;
--> statement-breakpoint
CREATE TRIGGER section_enrollment_delete BEFORE DELETE ON section
WHEN EXISTS (SELECT 1 FROM profile WHERE section_id = OLD.id AND school_id = OLD.school_id)
BEGIN SELECT RAISE(ABORT, 'Section has enrolled students'); END;
--> statement-breakpoint
CREATE TRIGGER section_enrollment_update BEFORE UPDATE OF id, school_id ON section
WHEN EXISTS (SELECT 1 FROM profile WHERE section_id = OLD.id AND school_id = OLD.school_id)
BEGIN SELECT RAISE(ABORT, 'Section has enrolled students'); END;
--> statement-breakpoint
ALTER TABLE claim_code ADD COLUMN encrypted_code TEXT;
--> statement-breakpoint
CREATE TABLE teacher_assignment (
  id TEXT PRIMARY KEY NOT NULL,
  school_id TEXT NOT NULL REFERENCES school(id),
  teacher_profile_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  FOREIGN KEY (teacher_profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY (section_id, class_id, school_id) REFERENCES section(id, class_id, school_id),
  FOREIGN KEY (subject_id, class_id, school_id) REFERENCES subject(id, class_id, school_id)
);
--> statement-breakpoint
CREATE UNIQUE INDEX teacher_assignment_unique ON teacher_assignment(school_id, teacher_profile_id, section_id, subject_id);
--> statement-breakpoint
CREATE TABLE parent_link (
  id TEXT PRIMARY KEY NOT NULL,
  school_id TEXT NOT NULL REFERENCES school(id),
  parent_profile_id TEXT NOT NULL,
  student_profile_id TEXT NOT NULL,
  FOREIGN KEY (parent_profile_id, school_id) REFERENCES profile(id, school_id),
  FOREIGN KEY (student_profile_id, school_id) REFERENCES profile(id, school_id)
);
--> statement-breakpoint
CREATE UNIQUE INDEX parent_link_unique ON parent_link(school_id, parent_profile_id, student_profile_id);
--> statement-breakpoint
CREATE TABLE invitation (
  id TEXT PRIMARY KEY NOT NULL,
  school_id TEXT NOT NULL REFERENCES school(id),
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  assignments TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  accepted_at INTEGER,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX invitation_school_email_idx ON invitation(school_id, email);
