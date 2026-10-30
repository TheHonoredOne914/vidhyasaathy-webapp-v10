import { z } from 'zod';
import { AssignmentSchema } from './assessment.ts';

const Id = z.string().uuid();
const Time = z.number().int().nonnegative();
const Count = z.number().int().nonnegative();
export const MIN_ANALYTICS_ATTEMPTS = 3;
export const SectionInsightsQuerySchema = z.object({ sectionId: Id.optional() }).strict();
export const EvidenceSummarySchema = z.object({
  attempts: Count, correct: Count, pendingReview: Count,
  passRate: z.number().min(0).max(1).nullable(),
  confidence: z.enum(['insufficient', 'available']), minAttempts: z.literal(MIN_ANALYTICS_ATTEMPTS),
}).strict();
export const ConceptInsightSchema = EvidenceSummarySchema.extend({
  conceptId: Id, title: z.string(), subjectId: Id, students: Count, needingPractice: Count,
}).strict();
export const MisconceptionSchema = z.object({ conceptId: Id, itemId: Id, option: z.string(), count: Count }).strict();
export const ReteachDecisionInputSchema = z.object({
  conceptId: Id, decision: z.enum(['reteach', 'practice', 'monitor']), note: z.string().trim().min(1).max(1000),
}).strict();
export const ReteachDecisionSchema = ReteachDecisionInputSchema.extend({
  id: Id, sectionId: Id, teacherId: Id, createdAt: Time,
}).strict();
export const ClassInsightsSchema = z.object({
  sectionId: Id, updatedAt: Time, students: Count, completedSessions: Count,
  concepts: z.array(ConceptInsightSchema), misconceptions: z.array(MisconceptionSchema),
  doubtBatches: z.array(z.object({ chapterId: Id, title: z.string(), count: Count }).strict()),
  decisions: z.array(ReteachDecisionSchema),
}).strict();
export const TeacherDashboardSchema = z.object({
  updatedAt: Time, classes: z.array(ClassInsightsSchema), reviewQueue: Count,
  assignments: z.array(AssignmentSchema),
  sessions: z.array(z.object({ id: Id, title: z.string(), chapterId: Id, releaseAt: Time.nullable() }).strict()),
  bands: z.array(z.object({
    profileId: Id, studentName: z.string(), chapterId: Id, chapterTitle: z.string(),
    band: z.enum(['0-25', '25-50', '50-75', '75-100']), updatedAt: Time,
  }).strict()),
}).strict();
export const MasteryWordSchema = z.enum(["Let's fix this", 'Almost there', 'Mastered', 'Top form', 'New']);
export const ProgressSchema = z.object({
  profileId: Id, updatedAt: Time, evidence: EvidenceSummarySchema, completedSessions: Count,
  concepts: z.array(ConceptInsightSchema), assignments: z.array(AssignmentSchema),
  masteryWords: z.array(z.object({ conceptId: Id, chapterId: Id, title: z.string(), word: MasteryWordSchema }).strict()),
}).strict();
export const NotificationChannelSchema = z.enum(['in_app', 'email', 'whatsapp']);
export const SaveNotificationSettingsSchema = z.object({
  enabled: z.boolean(), quietStart: z.number().int().min(0).max(1439),
  quietEnd: z.number().int().min(0).max(1439), utcOffsetMinutes: z.number().int().min(-720).max(840),
  reducedMotion: z.boolean(),
  notifySessions: z.boolean().optional(), notifyHomework: z.boolean().optional(),
  notifyStreak: z.boolean().optional(), notifyParentView: z.boolean().optional(),
  notifyGame: z.boolean().optional(), quietAfter21: z.boolean().optional(),
}).strict();
export const NotificationSettingsSchema = SaveNotificationSettingsSchema.extend({
  updatedAt: Time,
  notifySessions: z.boolean(), notifyHomework: z.boolean(), notifyStreak: z.boolean(),
  notifyParentView: z.boolean(), notifyGame: z.boolean(), quietAfter21: z.boolean(),
}).strict();
export const NotificationActionSchema = z.enum(['open', 'continue', 'do_it', 'score']);
export const NotificationSchema = z.object({
  id: Id, kind: z.enum(['announcement', 'parent_summary', 'content_publish']), title: z.string(), body: z.string(), href: z.string(),
  channel: NotificationChannelSchema, status: z.enum(['queued', 'delivered', 'failed']),
  failure: z.string().nullable(), createdAt: Time, deliverAfter: Time, deliveredAt: Time.nullable(), readAt: Time.nullable(),
  topic: z.string().nullable(), action: NotificationActionSchema,
}).strict();
export const NotificationListSchema = z.object({
  updatedAt: Time,
  notifications: z.array(NotificationSchema),
  groups: z.object({ today: z.array(NotificationSchema), earlier: z.array(NotificationSchema) }).strict(),
}).strict();
export const SaveAnnouncementSchema = z.object({
  sectionId: Id, title: z.string().trim().min(1).max(160), body: z.string().trim().min(1).max(4000),
  audience: z.enum(['students', 'parents', 'all']),
  channels: z.array(NotificationChannelSchema).min(1).max(3)
    .refine((channels) => new Set(channels).size === channels.length, 'Remove duplicate channels.'),
}).strict();
export const AnnouncementSchema = SaveAnnouncementSchema.extend({ id: Id, authorId: Id, createdAt: Time }).strict();
export const AnnouncementListSchema = z.object({ updatedAt: Time, announcements: z.array(AnnouncementSchema) }).strict();
const SummaryPart = z.object({ status: z.enum(['available', 'not_configured', 'not_confirmed']), text: z.string() }).strict();
export const ParentSummarySchema = z.object({
  updatedAt: Time,
  child: z.object({ id: Id, name: z.string(), className: z.string().nullable(), sectionName: z.string().nullable(), schoolName: z.string() }).strict(),
  progress: ProgressSchema, currentFocus: z.array(z.object({ conceptId: Id, title: z.string() }).strict()),
  latestResult: z.object({ correct: z.boolean().nullable(), recordedAt: Time }).strict().nullable(),
  observedResult: SummaryPart, aiInterpretation: SummaryPart, teacherConfirmed: SummaryPart, suggestedAction: SummaryPart,
  teacherUpdates: z.array(AnnouncementSchema),
}).strict();
export const AuditLogQuerySchema = z.object({
  before: z.coerce.number().int().nonnegative().optional(), limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict();
export const AuditLogListSchema = z.object({ updatedAt: Time, entries: z.array(z.object({
  id: Id, profileId: Id.nullable(), action: z.string(), requestId: z.string(), createdAt: Time,
}).strict()) }).strict();

export type EvidenceSummary = z.infer<typeof EvidenceSummarySchema>;
export type ConceptInsight = z.infer<typeof ConceptInsightSchema>;
export type ClassInsights = z.infer<typeof ClassInsightsSchema>;
export type Progress = z.infer<typeof ProgressSchema>;
export type SaveNotificationSettings = z.infer<typeof SaveNotificationSettingsSchema>;
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type SaveAnnouncement = z.infer<typeof SaveAnnouncementSchema>;
