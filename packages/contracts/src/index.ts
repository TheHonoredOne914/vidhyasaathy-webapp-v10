import { z } from 'zod';

export * from './content.ts';
export * from './learn.ts';
export * from './assessment.ts';
export * from './ai.ts';
export * from './dashboard.ts';
export * from './practice.ts';
export * from './daily.ts';
export * from './games.ts';
export * from './notebook.ts';
export * from './learning-proto.ts';

export const RoleSchema = z.enum(['admin', 'teacher', 'student', 'parent']);
export type Role = z.infer<typeof RoleSchema>;

const IdSchema = z.string().uuid();
const NameSchema = z.string().trim().min(1).max(120);
const EmailSchema = z.string().trim().email().max(254).toLowerCase();
const PasswordSchema = z.string().min(12).max(128);
const PinSchema = z.string().regex(/^\d{4}$/, 'Use a 4 digit PIN.');
const CodeSchema = z.string().trim().toUpperCase().regex(
  /^[2-9A-HJKMNP-Z]{12}$/,
  'Use the 12 character activation code supplied by your school.',
);

export const SchoolSchema = z.object({
  id: IdSchema,
  name: NameSchema,
}).strict();
export type School = z.infer<typeof SchoolSchema>;

export const ProfileSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  schoolId: IdSchema,
  name: NameSchema,
  role: RoleSchema,
}).strict();
export type Profile = z.infer<typeof ProfileSchema>;

export const ClaimCodeSchema = z.object({
  code: CodeSchema,
  schoolId: IdSchema,
  profileId: IdSchema,
  expiresAt: z.string().datetime(),
}).strict();
export type ClaimCode = z.infer<typeof ClaimCodeSchema>;

export const RegisterSchoolSchema = z.object({
  schoolName: NameSchema,
  name: NameSchema,
  email: EmailSchema,
  password: PasswordSchema,
  city: NameSchema.optional(),
  schoolType: z.enum(['private', 'government', 'aided']).optional(),
  board: z.enum(['cbse', 'icse', 'state']).optional(),
  phone: z.string().trim().regex(/^\d{10}$/, 'Enter a 10 digit phone number.').optional(),
  confirmDuplicate: z.boolean().optional(),
}).strict();
export type RegisterSchool = z.infer<typeof RegisterSchoolSchema>;

export const LoginSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
}).strict();
export type Login = z.infer<typeof LoginSchema>;

export const ClaimSchema = z.object({
  code: CodeSchema,
  pin: PinSchema,
}).strict();
export type Claim = z.infer<typeof ClaimSchema>;

export const PinLoginSchema = z.object({
  profileId: IdSchema,
  pin: PinSchema,
}).strict();
export type PinLogin = z.infer<typeof PinLoginSchema>;

export const StudentLookupSchema = z.object({ schoolId: IdSchema.optional(), slug: z.string().trim().min(1).max(120).optional(), sectionId: IdSchema.optional(), rollNo: z.string().trim().min(1).max(40) }).strict().refine((v) => Boolean(v.schoolId || v.slug), { message: 'School is required.' });
export const StudentActivateSchema = z.object({ lookupToken: z.string().min(20), activationCode: CodeSchema }).strict();
export const OtpVerifySchema = z.object({ otpToken: z.string().min(20), otp: z.string().regex(/^\d{6}$/) }).strict();
export const SetPinSchema = z.object({ pinToken: z.string().min(20), pin: PinSchema }).strict();
export const ParentOtpRequestSchema = z.object({ phone: z.string().trim().regex(/^\d{10}$/) }).strict();

export const MeSchema = z.object({
  school: SchoolSchema,
  profile: ProfileSchema,
}).strict();
export type Me = z.infer<typeof MeSchema>;

export const ApiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  fields: z.record(z.array(z.string())).optional(),
}).strict();
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const SaveSchoolDetailsSchema = z.object({
  name: NameSchema,
  city: NameSchema,
  board: NameSchema,
  schoolType: z.string().trim().max(40),
  address: z.string().trim().max(500),
  email: z.union([EmailSchema, z.literal('')]),
  phone: z.union([z.string().regex(/^\d{10}$/, 'Enter a 10 digit phone number.'), z.literal('')]),
}).strict();
export const SchoolDetailsSchema = SaveSchoolDetailsSchema.extend({
  id: IdSchema,
  city: z.string().trim().max(120),
  board: z.string().trim().max(120),
}).strict();
export const RosterListSchema = z.array(z.object({ id: IdSchema, name: NameSchema, rollNumber: z.string().nullable(), activated: z.boolean() }).strict());
export const ChildListSchema = z.array(z.object({ id: IdSchema, name: NameSchema, className: z.string().nullable(), sectionName: z.string().nullable() }).strict());
export const StudentEnrollmentSchema = z.object({ className: z.string().nullable(), sectionName: z.string().nullable(), rollNumber: z.string().nullable() }).strict();
export const SchoolSummarySchema = z.object({
  classes: z.number().int().nonnegative(),
  teachers: z.number().int().nonnegative(),
  students: z.number().int().nonnegative(),
  activated: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  parentLinks: z.number().int().nonnegative(),
  studentsWithParent: z.number().int().nonnegative(),
}).strict();

const DateSchema = z.string().date();
const ScopedIdSchema = z.object({ id: IdSchema, schoolId: IdSchema });
export const ResourceParamsSchema = z.object({ id: IdSchema }).strict();

export const SaveAcademicYearSchema = z.object({
  name: NameSchema,
  startsOn: DateSchema,
  endsOn: DateSchema,
}).strict().refine((value) => value.endsOn > value.startsOn, {
  path: ['endsOn'], message: 'End date must be after start date.',
});
export type SaveAcademicYear = z.infer<typeof SaveAcademicYearSchema>;
export const AcademicYearSchema = ScopedIdSchema.extend({
  name: NameSchema, startsOn: DateSchema, endsOn: DateSchema,
}).strict();
export type AcademicYear = z.infer<typeof AcademicYearSchema>;

export const SaveClassSchema = z.object({ academicYearId: IdSchema, name: NameSchema }).strict();
export type SaveClass = z.infer<typeof SaveClassSchema>;
export const ClassSchema = ScopedIdSchema.extend(SaveClassSchema.shape).strict();
export type Class = z.infer<typeof ClassSchema>;

export const SaveSectionSchema = z.object({ classId: IdSchema, name: NameSchema }).strict();
export type SaveSection = z.infer<typeof SaveSectionSchema>;
export const SectionSchema = ScopedIdSchema.extend(SaveSectionSchema.shape).strict();
export type Section = z.infer<typeof SectionSchema>;

export const SaveSubjectSchema = z.object({ classId: IdSchema, name: NameSchema }).strict();
export type SaveSubject = z.infer<typeof SaveSubjectSchema>;
export const SubjectSchema = ScopedIdSchema.extend(SaveSubjectSchema.shape).strict();
export type Subject = z.infer<typeof SubjectSchema>;

export const SectionSubjectSchema = z.object({ sectionId: IdSchema, subjectId: IdSchema }).strict();
export const AssignTeacherSchema = SectionSubjectSchema.extend({ teacherProfileId: IdSchema }).strict();
export type AssignTeacher = z.infer<typeof AssignTeacherSchema>;
export const TeacherAssignmentSchema = ScopedIdSchema.extend(AssignTeacherSchema.shape).strict();
export type TeacherAssignment = z.infer<typeof TeacherAssignmentSchema>;

export const LinkParentSchema = z.object({ parentProfileId: IdSchema, studentProfileId: IdSchema }).strict();
export type LinkParent = z.infer<typeof LinkParentSchema>;
export const ParentLinkSchema = ScopedIdSchema.extend(LinkParentSchema.shape).strict();
export type ParentLink = z.infer<typeof ParentLinkSchema>;

export const InviteTeacherSchema = z.object({
  email: EmailSchema,
  assignments: z.array(SectionSubjectSchema).min(1).max(100).refine(
    (values) => new Set(values.map((value) => `${value.sectionId}:${value.subjectId}`)).size === values.length,
    'Each section and subject may appear only once.',
  ),
}).strict();
export type InviteTeacher = z.infer<typeof InviteTeacherSchema>;
export const InvitationSchema = ScopedIdSchema.extend({
  email: EmailSchema,
  expiresAt: z.string().datetime(),
  acceptedAt: z.string().datetime().nullable(),
}).strict();
export type Invitation = z.infer<typeof InvitationSchema>;
const InvitationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const InviteTeacherResultSchema = z.object({
  invitation: InvitationSchema, token: InvitationTokenSchema,
}).strict();
export type InviteTeacherResult = z.infer<typeof InviteTeacherResultSchema>;
export const AcceptInviteSchema = z.object({
  token: InvitationTokenSchema, name: NameSchema, password: PasswordSchema,
}).strict();
export type AcceptInvite = z.infer<typeof AcceptInviteSchema>;

export const RosterImportRowSchema = z.object({
  name: NameSchema,
  rollNumber: z.string().trim().min(1).max(40),
  phone: z.string().trim().regex(/^\+?[1-9]\d{9,14}$/, 'Enter a valid phone number.'),
}).strict();
export type RosterImportRow = z.infer<typeof RosterImportRowSchema>;
export const ImportRosterSchema = z.object({
  sectionId: IdSchema, csv: z.string().min(1).max(262144), strict: z.boolean().default(true),
}).strict();
export type ImportRoster = z.infer<typeof ImportRosterSchema>;
export const RosterImportErrorSchema = z.object({
  row: z.number().int().min(1),
  message: z.string().min(1),
  fields: z.record(z.array(z.string())).optional(),
}).strict();
export type RosterImportError = z.infer<typeof RosterImportErrorSchema>;
export const ClaimCodeSheetEntrySchema = z.object({
  profileId: IdSchema, name: NameSchema, rollNumber: z.string().min(1),
  code: CodeSchema, expiresAt: z.string().datetime(),
}).strict();
export type ClaimCodeSheetEntry = z.infer<typeof ClaimCodeSheetEntrySchema>;
export const ClaimCodeSheetSchema = z.object({
  schoolId: IdSchema, sectionId: IdSchema,
  entries: z.array(ClaimCodeSheetEntrySchema),
}).strict();
export type ClaimCodeSheet = z.infer<typeof ClaimCodeSheetSchema>;
export const RosterImportResultSchema = z.object({
  imported: z.array(z.object({ row: z.number().int().min(2), profileId: IdSchema }).strict()),
  errors: z.array(RosterImportErrorSchema),
  claimCodeSheet: ClaimCodeSheetSchema,
}).strict();
export type RosterImportResult = z.infer<typeof RosterImportResultSchema>;
export const ClaimCodeSheetQuerySchema = z.object({ sectionId: IdSchema }).strict();
export const IssueClaimCodeSchema = z.object({ profileId: IdSchema }).strict();
export type IssueClaimCode = z.infer<typeof IssueClaimCodeSchema>;
export * from './ask.ts';
export * from './student-flow.ts';
