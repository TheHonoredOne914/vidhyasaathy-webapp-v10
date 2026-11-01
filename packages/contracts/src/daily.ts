import { z } from 'zod';
import { AnswerSchema } from './assessment.ts';
import { PublicItemSchema } from './content.ts';

const Id = z.string().uuid();
const Time = z.number().int().nonnegative();
const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const FriendlyWord = z.enum(["Let's fix this", 'Almost there', 'Mastered', 'Top form', 'New', 'Up next']);

export const DailyClientSchema = z.object({ clientEventId: Id }).strict();

const NextActionSchema = z.object({
  kind: z.enum(['catchup', 'unfinished', 'due', 'revision', 'new', 'game']),
  title: z.string(), conceptId: Id.nullable(), conceptName: z.string().nullable(),
  estMinutes: z.number().int().positive(), href: z.string(), resumeState: z.string().nullable(),
}).strict();

export const StudentHomeSchema = z.object({
  greeting: z.object({ name: z.string(), dateIST: Day, line: z.string() }).strict(),
  nextAction: NextActionSchema.nullable(),
  catchUp: z.object({ copy: z.string(), estMinutes: z.number().int().positive(), href: z.string() }).strict().nullable(),
  warmup: z.object({
    conceptId: Id, conceptName: z.string(), estMinutes: z.literal(2), href: z.string(),
  }).strict().nullable(),
  streak: z.object({
    currentDays: z.number().int().nonnegative(), freezesHeld: z.number().int().min(0).max(2),
    touchedToday: z.boolean(), restartCopy: z.string().nullable(),
    week: z.array(z.object({
      date: Day, state: z.enum(['done', 'freeze', 'missed', 'today', 'future']),
    }).strict()).length(7),
  }).strict(),
  xp: z.number().int().nonnegative(),
  subjects: z.array(z.object({
    id: Id, name: z.string(), chapterLabel: z.string(), done: z.number().int().nonnegative(), total: z.number().int().nonnegative(),
  }).strict()),
  todaysGoal: z.object({
    items: z.array(z.object({ id: z.string(), label: z.string(), done: z.boolean(), href: z.string() }).strict()),
    done: z.number().int().nonnegative(), total: z.number().int().nonnegative(),
  }).strict(),
  fromTeacher: z.array(z.object({
    id: Id, title: z.string(), subject: z.string(),
    badge: z.enum(['due_today', 'overdue', 'suggested', 'new']), href: z.string(),
  }).strict()),
  todaysGame: z.object({
    gameId: z.string(), title: z.string(), conceptName: z.string(), estMinutes: z.number().int().positive(), href: z.string(),
  }).strict().nullable(),
  learningPath: z.object({
    subject: z.string(), chapter: z.string(),
    nodes: z.array(z.object({ conceptId: Id, name: z.string(), word: FriendlyWord, note: z.string() }).strict()),
  }).strict().nullable(),
  tonightSession: z.object({
    kind: z.literal('locked'), opensAt: Time, title: z.string(), copy: z.string(),
  }).strict().nullable(),
  dailyChallenge: z.object({ status: z.enum(['ready', 'served', 'completed', 'expired']), href: z.string() }).strict(),
  dushman: z.array(z.object({ conceptId: Id, name: z.string() }).strict()),
  newBadges: z.array(z.object({ id: z.string(), name: z.string(), icon: z.string() }).strict()),
}).strict();

export const WarmupStartSchema = z.object({
  warmupId: Id,
  cards: z.array(z.object({ front: z.string(), back: z.string() }).strict()),
  checks: z.array(PublicItemSchema),
}).strict();
export const WarmupCompleteSchema = z.object({
  clientEventId: Id,
  ratings: z.array(z.enum(['knew', 'almost', 'forgot'])).max(24),
}).strict();
export const WarmupSkipResultSchema = z.object({ skipped: z.literal(true) }).strict();
export const WarmupDoneSchema = z.object({ done: z.literal(true) }).strict();

const CatchupStepSchema = z.object({
  conceptId: Id, name: z.string(), kind: z.enum(['recap', 'session']),
  estMinutes: z.number().int().positive(), href: z.string(),
}).strict();
export const CatchupSchema = z.object({
  copy: z.string(), estMinutes: z.number().int().positive(), steps: z.array(CatchupStepSchema),
}).strict();
export const CatchupDoneSchema = z.object({
  done: z.literal(true),
  badges: z.array(z.object({ id: z.string(), name: z.string() }).strict()),
}).strict();

export const DailyChallengeSchema = z.object({
  id: Id, status: z.enum(['served', 'completed', 'expired']), href: z.string(),
  showTimer: z.boolean(), showHindi: z.boolean(), secondsLeft: z.number().int().nonnegative(),
  items: z.array(PublicItemSchema),
}).strict();
export const DailyChallengeAnswerSchema = z.object({
  clientEventId: Id, itemId: Id, answer: AnswerSchema,
  confidence: z.enum(['sure', 'unsure', 'guess']), timeMs: z.number().int().min(0).max(86400000),
}).strict();
export const DailyChallengeAnswerResultSchema = z.object({
  itemId: Id, outcome: z.enum(['yes', 'not_yet']), why: z.string().nullable(),
}).strict();
export const DailyChallengeFinishSchema = z.object({
  status: z.enum(['completed', 'expired']), xp: z.number().int().nonnegative(), answered: z.number().int().nonnegative(),
}).strict();

export const DushmanListSchema = z.object({
  entries: z.array(z.object({
    conceptId: Id, name: z.string(), word: FriendlyWord, href: z.string(), retired: z.boolean(),
  }).strict()),
}).strict();

const PlanItemSchema = z.object({
  id: Id, conceptId: Id, conceptName: z.string(), kind: z.enum(['repair', 'learn', 'revise', 'practice', 'warmup']),
  estMinutes: z.number().int().positive(), status: z.enum(['planned', 'done', 'folded', 'dropped']), note: z.string().nullable(),
}).strict();
export const StudentStudyPlanSchema = z.object({
  plan: z.object({
    id: Id, goal: z.string(), examDate: Day, minutesPerNight: z.number().int(),
    nights: z.array(z.object({ night: Day, minutes: z.number().int().nonnegative(), items: z.array(PlanItemSchema) }).strict()),
  }).strict().nullable(),
}).strict();
export const SaveStudentStudyPlanSchema = z.object({
  clientEventId: Id, examDate: Day, minutesPerNight: z.number().int().min(5).max(180).default(25),
  goal: z.string().trim().min(1).max(200),
}).strict();

export const StudentStreakSchema = z.object({
  currentDays: z.number().int().nonnegative(), longestDays: z.number().int().nonnegative(),
  freezesHeld: z.number().int().min(0).max(2), touchedToday: z.boolean(), lastDay: Day.nullable(),
  restartCopy: z.string().nullable(),
  week: z.array(z.object({ date: Day, state: z.enum(['done', 'freeze', 'missed', 'today', 'future']) }).strict()).length(7),
  history: z.array(z.object({ day: Day, act: z.string() }).strict()),
  freezes: z.array(z.object({ kind: z.enum(['earned', 'consumed']), day: Day, reason: z.string() }).strict()),
}).strict();

export const BadgeShelfSchema = z.object({
  badges: z.array(z.object({
    id: z.string(), name: z.string(), nameHi: z.string(), description: z.string(), icon: z.string(),
    awards: z.array(z.object({
      id: z.string(), scopeKey: z.string(), awardedAt: Time, seen: z.boolean(),
    }).strict()),
  }).strict()),
}).strict();

export const HomeworkQuerySchema = z.object({
  tab: z.enum(['all', 'todo', 'submitted', 'graded']).default('all'),
}).strict();
export const HomeworkListSchema = z.object({
  counts: z.object({
    all: z.number().int().nonnegative(), todo: z.number().int().nonnegative(),
    submitted: z.number().int().nonnegative(), graded: z.number().int().nonnegative(),
  }).strict(),
  items: z.array(z.object({
    id: Id, title: z.string(), subject: z.string(), teacher: z.string(),
    count: z.number().int().nonnegative(), status: z.enum(['todo', 'submitted', 'graded', 'overdue']),
    dueAt: Time, lateUntil: Time.nullable(),
    score: z.object({ earned: z.number().int().nonnegative(), outOf: z.number().int().positive() }).strict().nullable(),
    comment: z.string().nullable(),
  }).strict()),
}).strict();
export const SaveHomeworkDraftSchema = z.object({ itemId: Id, answer: AnswerSchema }).strict();
export const HomeworkDraftSavedSchema = z.object({ saved: z.literal(true), itemId: Id, updatedAt: Time }).strict();
export const BadgeSeenSchema = z.object({ id: z.string(), seen: z.literal(true) }).strict();
export const PlanItemDoneSchema = z.object({ done: z.literal(true) }).strict();

export type StudentHome = z.infer<typeof StudentHomeSchema>;
export type WarmupStart = z.infer<typeof WarmupStartSchema>;

export const StudySessionStateSchema = z.enum(['new', 'in_progress', 'upcoming', 'done']);
export const StudentStudySessionSchema = z.object({
  id: Id, chapterId: z.string().min(1), chapterTitle: z.string(), subject: z.string(), title: z.string(),
  state: StudySessionStateSchema, releaseAt: Time.nullable(), slides: z.number().int().nonnegative(),
  viewedSlides: z.number().int().nonnegative(), completedAt: Time.nullable(),
}).strict();
export const StudentStudySessionsSchema = z.object({
  counts: z.object({
    waiting: z.number().int().nonnegative(), upcoming: z.number().int().nonnegative(), done: z.number().int().nonnegative(),
  }).strict(),
  sessions: z.array(StudentStudySessionSchema),
}).strict();
export type StudentStudySession = z.infer<typeof StudentStudySessionSchema>;
export type StudentStudySessions = z.infer<typeof StudentStudySessionsSchema>;
