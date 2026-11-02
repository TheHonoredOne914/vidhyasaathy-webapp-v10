import { randomUUID } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { and, eq, isNull } from 'drizzle-orm';
import {
  ConceptLessonSchema, type Answer,
} from '@vidhyasaathy/contracts';
import { evaluateBadges } from '@vidhyasaathy/core/badges';
import { buildCatchup } from '@vidhyasaathy/core/catchup';
import { buildDailyChallenge, DAILY_CHALLENGE_MINUTES, type ChallengeItem } from '@vidhyasaathy/core/daily-challenge';
import { dushmanRetirement, selectDushman } from '@vidhyasaathy/core/dushman';
import { chapterBand, clampLevel, levelWord, type Band, type Level } from '@vidhyasaathy/core/learning';
import { pickNextAction, type NextActionCandidate, getFollowupCandidates, type FollowupItemRow } from '@vidhyasaathy/core/next-action';
import { decayedMastery, frustrationRadar, revisionRadar, type RadarState } from '@vidhyasaathy/core/radars';
import { buildNightlyPlan, replanAfterMiss, type NightItem } from '@vidhyasaathy/core/study-plan';
import {
  absentDays, applyStreakDay, emptyStreak, endOfTomorrowIst, istDay, shiftIstDay,
} from '@vidhyasaathy/core/streak';
import { buildWarmup, type WarmupCard } from '@vidhyasaathy/core/warmup';
import { xpFromEvidence, type XpRow } from '@vidhyasaathy/core/xp';
import { assignmentAccess, assignmentQuestions, markItem } from '../assessment/service.ts';
import { requireAuth } from '../auth/middleware.ts';
import { publicItem } from '../content/sessions.ts';
import type { Db } from '../db/index.ts';
import {
  answerEvidence, assignmentDrafts, assignments, attempts, badgeAwards, badgeCatalog, chapterBands, chapters,
  conceptLadders, conceptLessons, conceptPrereqs, concepts, dailyChallenges, dushmanEntries, dushmanEvents,
  items, learningEvents, learningSessions, noteConcepts, notes, planCompletionEvents, profiles, sections,
  sessionProgress, slides, streakFreezeLedger, streakStates, streakTouches, studentConceptStates, studyPlanItems,
  studyPlans, subjects,
} from '../db/schema.ts';
import { followupItems } from '../db/schema-phase4.ts';
import { ApiException } from '../errors.ts';
import { found, scope } from '../school/access.ts';
import { recordAnswer } from '../learning/record.ts';
import { dispatchStudent, notifyBadge } from './notify.ts';
import { touchStreak } from './streak-store.ts';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CHALLENGE_MS = DAILY_CHALLENGE_MINUTES * 60_000;

type DayState = 'done' | 'freeze' | 'missed' | 'today' | 'future';

function asLevel(value: number | null | undefined): Level | null {
  if (value === 1 || value === 2 || value === 3 || value === 4) return value;
  return null;
}

function weekdayName(day: string) {
  const [year, month, date] = day.split('-').map(Number);
  return WEEKDAYS[new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1)).getUTCDay()] ?? day;
}

function istClock(at: number) {
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hour12: true, timeZone: 'Asia/Kolkata' }).format(at).toLowerCase();
}

function weekDates(today: string) {
  const [year, month, date] = today.split('-').map(Number);
  const weekday = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1)).getUTCDay();
  const monday = shiftIstDay(today, -(weekday === 0 ? 6 : weekday - 1));
  return Array.from({ length: 7 }, (_, index) => shiftIstDay(monday, index));
}

function dayState(day: string, today: string, touched: ReadonlySet<string>, frozen: ReadonlySet<string>): DayState {
  if (day > today) return 'future';
  if (touched.has(day)) return 'done';
  if (frozen.has(day)) return 'freeze';
  if (day === today) return 'today';
  return 'missed';
}

function studentRow(db: Db, request: FastifyRequest) {
  const { school, profile } = requireAuth(request);
  const enrolled = found(db.select().from(profiles).where(scope(profiles, school.id, profile.id)).get());
  if (!enrolled.sectionId) throw new ApiException(403, 'FORBIDDEN', 'This content is not available for your account.');
  const section = found(db.select().from(sections).where(scope(sections, school.id, enrolled.sectionId)).get());
  return { school, profile: enrolled, section };
}

function loadWorld(db: Db, request: FastifyRequest, now: number) {
  const { school, profile, section } = studentRow(db, request);
  const subjectRows = db.select().from(subjects).where(and(eq(subjects.schoolId, school.id), eq(subjects.classId, section.classId))).all();
  const subjectIds = new Set(subjectRows.map((row) => row.id));
  const chapterRows = db.select().from(chapters).where(eq(chapters.schoolId, school.id)).all()
    .filter((row) => subjectIds.has(row.subjectId))
    .sort((a, b) => a.position - b.position || a.title.localeCompare(b.title));
  const chapterIds = new Set(chapterRows.map((row) => row.id));
  const conceptRows = db.select().from(concepts).where(eq(concepts.schoolId, school.id)).all()
    .filter((row) => chapterIds.has(row.chapterId));
  const conceptIds = new Set(conceptRows.map((row) => row.id));
  const edges = db.select().from(conceptPrereqs).where(eq(conceptPrereqs.schoolId, school.id)).all()
    .filter((row) => conceptIds.has(row.conceptId) && conceptIds.has(row.prereqId));
  const ladders = db.select().from(conceptLadders).where(and(eq(conceptLadders.schoolId, school.id), eq(conceptLadders.profileId, profile.id))).all();
  const states = db.select().from(studentConceptStates).where(and(eq(studentConceptStates.schoolId, school.id), eq(studentConceptStates.profileId, profile.id))).all();
  const evidence = db.select().from(answerEvidence).where(and(eq(answerEvidence.schoolId, school.id), eq(answerEvidence.profileId, profile.id))).all();
  const touches = db.select().from(streakTouches).where(and(eq(streakTouches.profileId, profile.id), eq(streakTouches.schoolId, school.id))).all();
  const ledger = db.select().from(streakFreezeLedger).where(and(eq(streakFreezeLedger.profileId, profile.id), eq(streakFreezeLedger.schoolId, school.id))).all();
  const sessions = db.select().from(learningSessions).where(and(
    eq(learningSessions.schoolId, school.id), eq(learningSessions.sectionId, section.id), eq(learningSessions.status, 'published'),
  )).all();
  const sessionIds = new Set(sessions.map((row) => row.id));
  const progress = db.select().from(sessionProgress).where(and(eq(sessionProgress.schoolId, school.id), eq(sessionProgress.profileId, profile.id))).all()
    .filter((row) => sessionIds.has(row.sessionId));
  const slideRows = db.select().from(slides).where(eq(slides.schoolId, school.id)).all().filter((row) => sessionIds.has(row.sessionId))
    .sort((a, b) => a.position - b.position);
  const itemRows = db.select().from(items).where(eq(items.schoolId, school.id)).all().filter((row) => chapterIds.has(row.chapterId));
  const lessonRows = db.select().from(conceptLessons).where(eq(conceptLessons.schoolId, school.id)).all().filter((row) => conceptIds.has(row.conceptId));
  const noteLinks = db.select().from(noteConcepts).where(eq(noteConcepts.schoolId, school.id)).all().filter((row) => conceptIds.has(row.conceptId));
  const noteRows = db.select().from(notes).where(eq(notes.schoolId, school.id)).all();
  const events = db.select().from(learningEvents).where(and(eq(learningEvents.schoolId, school.id), eq(learningEvents.profileId, profile.id))).all();
  const dushman = db.select().from(dushmanEntries).where(and(eq(dushmanEntries.schoolId, school.id), eq(dushmanEntries.profileId, profile.id))).all();
  const awards = db.select().from(badgeAwards).where(and(eq(badgeAwards.schoolId, school.id), eq(badgeAwards.profileId, profile.id))).all();
  const catalog = db.select().from(badgeCatalog).all();
  const challenges = db.select().from(dailyChallenges).where(and(eq(dailyChallenges.schoolId, school.id), eq(dailyChallenges.profileId, profile.id))).all();
  const homework = db.select().from(assignments).where(and(
    eq(assignments.schoolId, school.id), eq(assignments.sectionId, section.id), eq(assignments.status, 'published'),
  )).all();
  const drafts = db.select().from(assignmentDrafts).where(and(eq(assignmentDrafts.schoolId, school.id), eq(assignmentDrafts.profileId, profile.id))).all();
  const plans = db.select().from(studyPlans).where(and(eq(studyPlans.schoolId, school.id), eq(studyPlans.profileId, profile.id), eq(studyPlans.status, 'active'))).all();
  const bands = db.select().from(chapterBands).where(and(eq(chapterBands.schoolId, school.id), eq(chapterBands.profileId, profile.id))).all();
  const people = db.select().from(profiles).where(eq(profiles.schoolId, school.id)).all();
  return {
    school, profile, section, subjectRows, chapterRows, conceptRows, edges, ladders, states, evidence, touches, ledger,
    sessions, progress, slideRows, itemRows, lessonRows, noteLinks, noteRows, events, dushman, awards, catalog, challenges,
    homework, drafts, plans, bands, people, now,
  };
}

type World = ReturnType<typeof loadWorld>;

function conceptName(world: World, id: string | null) {
  return world.conceptRows.find((row) => row.id === id)?.title ?? null;
}

function orderedConcepts(world: World, chapterId: string) {
  const rows = world.conceptRows.filter((row) => row.chapterId === chapterId);
  const ids = new Set(rows.map((row) => row.id));
  const needs = new Map(rows.map((row) => [row.id, [] as string[]]));
  for (const edge of world.edges) {
    if (needs.has(edge.conceptId) && ids.has(edge.prereqId)) needs.get(edge.conceptId)?.push(edge.prereqId);
  }
  const pending = rows.map((row) => row.id);
  const ordered: string[] = [];
  while (pending.length) {
    const index = pending.findIndex((id) => (needs.get(id) ?? []).every((prereq) => ordered.includes(prereq)));
    const id = index < 0 ? pending.shift() : pending.splice(index, 1)[0];
    if (id) ordered.push(id);
  }
  return ordered.flatMap((id) => {
    const row = rows.find((concept) => concept.id === id);
    return row ? [row] : [];
  });
}

function radarOf(world: World): RadarState[] {
  return world.conceptRows.map((concept) => {
    const ladder = world.ladders.find((row) => row.conceptId === concept.id);
    const state = world.states.find((row) => row.conceptId === concept.id);
    return {
      conceptId: concept.id, name: concept.title, level: asLevel(ladder?.masteryLevel ?? null),
      mastery: state?.mastery ?? ladder?.masteryScore ?? 0,
      updatedAt: state?.updatedAt ?? ladder?.updatedAt ?? world.now,
      nextReview: state?.nextReview ?? null,
    };
  });
}

function sessionFocus(world: World, sessionId: string) {
  const slide = world.slideRows.filter((row) => row.sessionId === sessionId).at(-1);
  return slide ? world.conceptRows.find((row) => row.id === slide.conceptId) ?? null : null;
}

/** Tonight's session is only advertised once the server clock passes its release time. */
function tonightSession(world: World, today: string) {
  return world.sessions.find((session) => {
    if (session.releaseAt == null || session.releaseAt > world.now) return false;
    const progress = world.progress.find((row) => row.sessionId === session.id);
    if (progress?.completedAt != null) return false;
    return istDay(session.releaseAt) === today;
  }) ?? null;
}

/** A released-later-today session shows the locked card instead of an open one that would 403. */
function upcomingSession(world: World, today: string) {
  return world.sessions.find((session) => {
    if (session.releaseAt == null || session.releaseAt <= world.now) return false;
    if (istDay(session.releaseAt) !== today) return false;
    const progress = world.progress.find((row) => row.sessionId === session.id);
    return progress?.completedAt == null;
  }) ?? null;
}

function cardsFor(world: World, conceptId: string): WarmupCard[] {
  const lesson = world.lessonRows.find((row) => row.conceptId === conceptId);
  const parsed = lesson ? ConceptLessonSchema.safeParse(lesson.body) : null;
  if (parsed?.success && parsed.data.flashcards.length >= 2) {
    return parsed.data.flashcards.slice(0, 4).map((card) => ({ front: card.front, back: card.back }));
  }
  const link = world.noteLinks.find((row) => row.conceptId === conceptId);
  const note = link ? world.noteRows.find((row) => row.id === link.noteId) : undefined;
  if (!note) return [];
  const sentences = note.body.split(/(?<=\.)\s+/).map((part) => part.trim()).filter((part) => part.length > 30);
  const distance = sentences.find((part) => /^Distance is/i.test(part));
  const displacement = sentences.find((part) => /^Displacement is/i.test(part));
  if (distance && displacement) return [{ front: 'Distance', back: distance }, { front: 'Displacement', back: displacement }];
  if (sentences.length < 2) return [];
  return [{ front: sentences[0]!.slice(0, 90), back: sentences[1]! }];
}

function levelOneCheck(world: World, conceptId: string) {
  return world.itemRows.find((row) => row.conceptId === conceptId && row.content.type === 'mcq' && clampLevel(row.content.difficulty) === 1);
}

function routingFor(world: World, chapterId: string): Band {
  const saved = world.bands.find((row) => row.chapterId === chapterId)?.band;
  if (saved) return saved;
  const scores = world.conceptRows.filter((row) => row.chapterId === chapterId).flatMap((concept) => {
    const ladder = world.ladders.find((row) => row.conceptId === concept.id);
    return ladder?.masteryLevel == null ? [] : [ladder.masteryScore];
  });
  return chapterBand(scores) ?? '50-75';
}

function streakView(world: World) {
  const update = applyStreakDay(emptyStreak(), world.touches.map((row) => ({ at: row.createdAt, act: row.act })),
    world.ledger.map((row) => ({ kind: row.kind, day: row.day, reason: row.reason })), world.now);
  const today = istDay(world.now);
  const touched = new Set(world.touches.map((row) => row.day));
  const frozen = new Set(world.ledger.filter((row) => row.kind === 'consumed').map((row) => row.day));
  const restartCopy = update.state.currentDays === 1 ? update.restartCopy : null;
  return {
    ...update.state, touchedToday: update.touchedToday, restartCopy,
    week: weekDates(today).map((date) => ({ date, state: dayState(date, today, touched, frozen) })),
  };
}

function focusChapter(world: World, conceptId: string | null) {
  const fromConcept = conceptId ? world.chapterRows.find((row) => row.id === world.conceptRows.find((concept) => concept.id === conceptId)?.chapterId) : undefined;
  return fromConcept ?? world.chapterRows.find((row) => row.title === 'Motion') ?? world.chapterRows[0] ?? null;
}

/** Queue reads retire Dushman entries whose concept has passing evidence, not only new answers. */
function retireMasteredDushman(db: Db, world: World, now: number) {
  for (const row of world.dushman) {
    if (row.status !== 'active') continue;
    const level = asLevel(world.ladders.find((ladder) => ladder.conceptId === row.conceptId)?.masteryLevel ?? null);
    if (!dushmanRetirement(level).retire) continue;
    db.update(dushmanEntries).set({ status: 'retired', retiredAt: now, reason: 'mastered' }).where(eq(dushmanEntries.id, row.id)).run();
    db.insert(dushmanEvents).values({
      id: randomUUID(), profileId: world.profile.id, schoolId: world.school.id, conceptId: row.conceptId,
      kind: 'retired', evidenceId: null, createdAt: now,
    }).run();
    row.status = 'retired';
  }
}

export function studentHome(db: Db, request: FastifyRequest, now: number) {
  const world = loadWorld(db, request, now);
  const today = istDay(now);
  const fading = revisionRadar(radarOf(world), now);
  const lastTouch = world.touches.map((row) => row.day).sort().at(-1) ?? null;
  const missed = absentDays(lastTouch, now);
  const session = tonightSession(world, today);
  const focus = session ? sessionFocus(world, session.id) : null;
  const locked = upcomingSession(world, today);
  const candidates: NextActionCandidate[] = [];
  for (const row of world.progress) {
    if (row.completedAt != null || (row.viewedSlides <= 0 && row.checkSubmittedAt == null)) continue;
    const open = world.sessions.find((item) => item.id === row.sessionId);
    if (!open) continue;
    const concept = sessionFocus(world, open.id);
    candidates.push({
      id: open.id, kind: 'unfinished', title: concept?.title ?? open.title, conceptId: concept?.id ?? null,
        conceptName: concept?.title ?? null, estMinutes: 14, href: `/student/sessions/${open.id}`,
        resumeState: 'Continue where you left off', dueAt: null, resumeAt: Math.max(row.viewedSlides, 1), lateUntil: null, windowOpen: true,
    });
  }
  for (const draft of world.drafts) {
    const assignment = world.homework.find((row) => row.id === draft.assignmentId);
    if (!assignment) continue;
    candidates.push({
      id: `draft:${assignment.id}`, kind: 'unfinished', title: assignment.title, conceptId: null, conceptName: null,
        estMinutes: 15, href: `/student/assignments/${assignment.id}`, resumeState: 'Your saved work is ready', dueAt: null,
      resumeAt: draft.updatedAt || 1, lateUntil: null, windowOpen: true,
    });
  }
  const horizon = endOfTomorrowIst(now);
  for (const assignment of world.homework) {
    const questions = assignmentQuestions(db, assignment.id);
    const answered = new Set(db.select({ itemId: attempts.itemId }).from(attempts).where(and(
      eq(attempts.assignmentId, assignment.id), eq(attempts.profileId, world.profile.id),
    )).all().map((row) => row.itemId));
    if (questions.length > 0 && questions.every((item) => answered.has(item.id))) continue;
    if (assignment.dueAt >= horizon && !(assignment.dueAt < now && assignment.lateUntil != null && assignment.lateUntil >= now)) continue;
    candidates.push({
      id: assignment.id, kind: 'due', title: assignment.title, conceptId: null, conceptName: null, estMinutes: 15,
      href: `/student/assignments/${assignment.id}`, resumeState: null, dueAt: assignment.dueAt, resumeAt: 0,
      lateUntil: assignment.lateUntil, windowOpen: assignment.publishedAt != null && assignment.publishedAt <= now,
    });
  }
  const repair = fading[0];
  if (repair) {
    const repairChapter = focusChapter(world, repair.conceptId);
    if (repairChapter) {
      candidates.push({
        id: `review:${repair.conceptId}`, kind: 'revision', title: repair.name, conceptId: repair.conceptId, conceptName: repair.name,
        estMinutes: repair.level === 1 ? 10 : 5, href: `/student/chapters/${repairChapter.id}/concepts/${repair.conceptId}`, resumeState: null,
        dueAt: null, resumeAt: 0, lateUntil: null, windowOpen: true,
      });
    }
  }
  if (session && focus) {
    candidates.push({
      id: `session:${session.id}`, kind: 'new', title: focus.title, conceptId: focus.id, conceptName: focus.title,
      estMinutes: 14, href: `/student/sessions/${session.id}`, resumeState: null, dueAt: null, resumeAt: 0, lateUntil: null, windowOpen: true,
    });
  }
  const chapter = focusChapter(world, focus?.id ?? repair?.conceptId ?? null);
  const fallbackConcept = chapter ? orderedConcepts(world, chapter.id)[0] : undefined;
  const gameConcept = focus
    ? { id: focus.id, title: focus.title }
    : repair
      ? { id: repair.conceptId, title: repair.name }
      : fallbackConcept
        ? { id: fallbackConcept.id, title: fallbackConcept.title }
        : undefined;
  if (chapter && gameConcept) {
    const gameId = fading.length === 0 ? 'mcq_rush' : 'quick_revision_quiz';
    candidates.push({
      id: `game:${gameId}`, kind: 'game', title: gameId === 'mcq_rush' ? 'MCQ Rush' : 'Quick revision',
      conceptId: gameConcept.id, conceptName: gameConcept.title, estMinutes: 4,
      href: `/student/chapters/${chapter.id}/practice/${gameId}`, resumeState: null, dueAt: null, resumeAt: 0, lateUntil: null, windowOpen: true,
    });
  }
  // Add followup candidates from unsure answers and wrong quick-tries
  const followupRows = db.select().from(followupItems)
    .where(and(eq(followupItems.profileId, world.profile.id), eq(followupItems.schoolId, world.school.id), isNull(followupItems.completedAt)))
    .all() as FollowupItemRow[];
  candidates.push(...getFollowupCandidates(followupRows, now));
  const decayed = radarOf(world).filter((row) => row.level != null).map((row) => ({
    conceptId: row.conceptId, name: row.name, decayed: decayedMastery(row.mastery, row.updatedAt, now),
  }));
  const tonight = focus ?? gameConcept ?? world.conceptRows[0];
  const catchPlan = tonight ? buildCatchup({ absentDays: missed, decayed, tonight: { conceptId: tonight.id, name: tonight.title } }) : null;
  const next = pickNextAction({
    absentDays: missed, candidates,
    catchUp: catchPlan ? {
      title: catchPlan.copy, conceptId: tonight?.id ?? null, conceptName: tonight?.title ?? null,
      estMinutes: catchPlan.estMinutes, href: '/student/catchup', resumeState: null,
    } : null,
  }, now);
  const tonightId = next?.conceptId ?? tonight?.id ?? null;
  const skipped = world.events.some((row) => row.kind === 'warmup_skipped' && istDay(row.createdAt) === today);
  const prereqs = world.edges.filter((edge) => edge.conceptId === tonightId).flatMap((edge) => {
    const concept = world.conceptRows.find((row) => row.id === edge.prereqId);
    const check = concept ? levelOneCheck(world, concept.id) : undefined;
    if (!concept || !check) return [];
    return [{ conceptId: concept.id, name: concept.title, flashcards: cardsFor(world, concept.id), checks: [{ id: check.id, level: 1 as const }] }];
  });
  const offer = tonightId ? buildWarmup(tonightId, prereqs, fading, { skippedDay: skipped ? today : null, today }) : null;
  const streak = streakView(world);
  const xpRows: XpRow[] = world.evidence.map((row) => ({ kind: 'answer', correct: row.correct, confidence: row.confidence }));
  for (const row of world.progress) if (row.completedAt != null) xpRows.push({ kind: 'session_completed' });
  for (const row of world.challenges) if (row.status === 'completed') xpRows.push({ kind: 'daily_challenge_completed' });
  const challenge = world.challenges.find((row) => row.day === today);
  const activeDushman = world.dushman.filter((row) => row.status === 'active').flatMap((row) => {
    const name = conceptName(world, row.conceptId);
    return name ? [{ conceptId: row.conceptId, name }] : [];
  });
  const plan = world.plans[0];
  const planItems = plan ? db.select().from(studyPlanItems).where(eq(studyPlanItems.planId, plan.id)).all() : [];
  const goalItems = planItems.filter((row) => row.night === today && (row.status === 'planned' || row.status === 'folded')).map((row) => {
    const planChapter = focusChapter(world, row.conceptId);
    return {
      id: row.id, label: conceptName(world, row.conceptId) ?? row.kind, done: false,
      href: planChapter ? `/student/chapters/${planChapter.id}/concepts/${row.conceptId}` : '/student?panel=subjects',
    };
  });
  if (!goalItems.length) {
    if (next) goalItems.push({ id: next.href, label: next.title, done: false, href: next.href });
    if (!challenge || challenge.status !== 'completed') goalItems.push({ id: 'daily-challenge', label: '5-minute challenge', done: false, href: '/student/challenge' });
    if (activeDushman[0]) goalItems.push({ id: activeDushman[0].conceptId, label: activeDushman[0].name, done: false, href: '/student/dushman' });
  }
  const fromTeacher = [
    ...world.homework.map((row) => {
      const subject = world.subjectRows.find((item) => item.id === world.chapterRows.find((chapterRow) => chapterRow.id === row.chapterId)?.subjectId)?.name ?? 'Class';
      const dueDay = istDay(row.dueAt);
      const badge = dueDay === today ? 'due_today' as const : row.dueAt < now ? 'overdue' as const : istDay(row.publishedAt ?? row.updatedAt) === today ? 'new' as const : 'suggested' as const;
      return { id: row.id, title: row.title, subject, badge, href: `/student/assignments/${row.id}`, sort: badge === 'overdue' ? 0 : 1 };
    }),
    ...world.sessions.filter((row) => row.releaseAt != null && row.releaseAt <= now).map((row) => {
      const subject = world.subjectRows.find((item) => item.id === world.chapterRows.find((chapterRow) => chapterRow.id === row.chapterId)?.subjectId)?.name ?? 'Class';
      const progress = world.progress.find((item) => item.sessionId === row.id);
      const badge = progress ? 'suggested' as const : 'new' as const;
      return { id: row.id, title: row.title, subject, badge, href: `/student/sessions/${row.id}`, sort: 2 };
    }),
  ].sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title)).map(({ sort: _sort, ...row }) => row);
  const pathChapter = chapter;
  const pathSubject = pathChapter ? world.subjectRows.find((row) => row.id === pathChapter.subjectId) : undefined;
  let markedUpNext = false;
  const nodes = pathChapter ? orderedConcepts(world, pathChapter.id).map((concept) => {
    const ladder = world.ladders.find((row) => row.conceptId === concept.id);
    const level = asLevel(ladder?.masteryLevel ?? null);
    const upNext = !markedUpNext && level == null;
    if (upNext) markedUpNext = true;
    return { conceptId: concept.id, name: concept.title, word: upNext ? 'Up next' as const : levelWord(level), note: ladder?.bridge ?? '' };
  }) : [];
  const flagged = frustrationRadar(world.evidence.slice(-30).map((row) => ({ correct: row.correct, timeMs: row.timeMs, at: row.createdAt })), []);
  if (flagged) {
    db.insert(learningEvents).values({
      id: `frustration:${world.profile.id}:${today}`, profileId: world.profile.id, schoolId: world.school.id,
      kind: 'frustration_flagged', conceptId: tonightId, payload: { tone: flagged.tone }, createdAt: now,
    }).onConflictDoNothing().run();
  }
  dispatchStudent(db, world.school.id, world.profile.id, now);
  retireMasteredDushman(db, world, now);
  const line = streak.restartCopy ?? (missed >= 3 ? 'Good to see you.' : "Let's keep going.");
  return {
    greeting: { name: world.profile.name, dateIST: today, line },
    nextAction: next, catchUp: next?.kind === 'catchup' && catchPlan ? { copy: catchPlan.copy, estMinutes: catchPlan.estMinutes, href: '/student/catchup' } : null,
    tonightSession: locked ? {
      kind: 'locked' as const, opensAt: locked.releaseAt ?? now, title: locked.title,
      copy: `Unlocks at ${istClock(locked.releaseAt ?? now)} — your evening plan is ready.`,
    } : null,
    warmup: offer && next?.kind !== 'catchup' ? {
      conceptId: offer.concepts[0]!.conceptId, conceptName: offer.concepts[0]!.name, estMinutes: 2 as const, href: '/student/warmup',
    } : null,
    streak: { currentDays: streak.currentDays, freezesHeld: streak.freezesHeld, touchedToday: streak.touchedToday, restartCopy: streak.restartCopy, week: streak.week },
    xp: xpFromEvidence(xpRows),
    subjects: world.subjectRows.map((subject) => {
      const owned = world.chapterRows.filter((row) => row.subjectId === subject.id);
      const inSubject = world.conceptRows.filter((row) => owned.some((chapterRow) => chapterRow.id === row.chapterId));
      const done = inSubject.filter((concept) => (asLevel(world.ladders.find((row) => row.conceptId === concept.id)?.masteryLevel ?? null) ?? 0) >= 3).length;
      return { id: subject.id, name: subject.name, chapterLabel: (pathChapter && pathChapter.subjectId === subject.id ? pathChapter : owned[0])?.title ?? subject.name, done, total: inSubject.length };
    }),
    todaysGoal: { items: goalItems, done: goalItems.filter((row) => row.done).length, total: goalItems.length },
    fromTeacher, todaysGame: chapter && gameConcept ? {
      gameId: fading.length === 0 ? 'mcq_rush' : 'quick_revision_quiz',
      title: fading.length === 0 ? 'MCQ Rush' : 'Quick revision', conceptName: gameConcept.title, estMinutes: 4,
      href: `/student/chapters/${chapter.id}/practice/${fading.length === 0 ? 'mcq_rush' : 'quick_revision_quiz'}`,
    } : null,
    learningPath: pathChapter && pathSubject ? { subject: pathSubject.name, chapter: pathChapter.title, nodes } : null,
    dailyChallenge: { status: challenge?.status ?? 'ready' as const, href: '/student/challenge' },
    dushman: activeDushman, newBadges: world.awards.filter((row) => row.seenAt == null).slice(0, 5).flatMap((row) => {
      const badge = world.catalog.find((item) => item.id === row.badgeId);
      return badge ? [{ id: row.id, name: badge.nameEn, icon: badge.iconKey }] : [];
    }),
  };
}

function ownedEvent(db: Db, request: FastifyRequest, id: string) {
  const { school, profile } = requireAuth(request);
  const row = db.select().from(learningEvents).where(eq(learningEvents.id, id)).get();
  if (!row || row.schoolId !== school.id || row.profileId !== profile.id) throw new ApiException(404, 'NOT_FOUND', 'Resource not found.');
  return { school, profile, row };
}

export function startWarmup(db: Db, request: FastifyRequest, clientEventId: string, now: number) {
  const identity = requireAuth(request);
  const offered = db.select().from(learningEvents).where(and(
    eq(learningEvents.schoolId, identity.school.id), eq(learningEvents.profileId, identity.profile.id),
    eq(learningEvents.kind, 'warmup_offered'),
  )).all().find((row) => istDay(row.createdAt) === istDay(now));
  if (offered && offered.id !== clientEventId) {
    const collision = db.select().from(learningEvents).where(eq(learningEvents.id, clientEventId)).get();
    if (collision) throw new ApiException(409, 'EVENT_CONFLICT', 'This event ID already identifies another action.');
    return startWarmup(db, request, offered.id, now);
  }
  const previous = db.select().from(learningEvents).where(eq(learningEvents.id, clientEventId)).get();
  if (previous) {
    const { profile } = requireAuth(request);
    if (previous.profileId !== profile.id || previous.kind !== 'warmup_offered') throw new ApiException(409, 'EVENT_CONFLICT', 'This event ID already identifies another action.');
    const payload = previous.payload as { cards?: { front: string; back: string }[]; checkIds?: string[] };
    const checks = (payload.checkIds ?? []).flatMap((id) => {
      const item = db.select().from(items).where(eq(items.id, id)).get();
      return item ? [publicItem(item)] : [];
    });
    return { warmupId: clientEventId, cards: payload.cards ?? [], checks };
  }
  const home = studentHome(db, request, now);
  if (!home.warmup) throw new ApiException(409, 'WARMUP_UNAVAILABLE', 'There is no warm-up waiting today.');
  const world = loadWorld(db, request, now);
  const fading = revisionRadar(radarOf(world), now);
  const tonightId = home.nextAction?.conceptId ?? home.warmup.conceptId;
  const prereqs = world.edges.filter((edge) => edge.conceptId === tonightId).flatMap((edge) => {
    const concept = world.conceptRows.find((row) => row.id === edge.prereqId);
    const check = concept ? levelOneCheck(world, concept.id) : undefined;
    if (!concept || !check) return [];
    return [{ conceptId: concept.id, name: concept.title, flashcards: cardsFor(world, concept.id), checks: [{ id: check.id, level: 1 as const }] }];
  });
  const offer = buildWarmup(tonightId, prereqs, fading, { today: istDay(now) });
  if (!offer) throw new ApiException(409, 'WARMUP_UNAVAILABLE', 'There is no warm-up waiting today.');
  const cards = offer.concepts.flatMap((concept) => concept.cards);
  const checkIds = offer.concepts.map((concept) => concept.checkId);
  const { school, profile } = requireAuth(request);
  db.insert(learningEvents).values({
    id: clientEventId, profileId: profile.id, schoolId: school.id, kind: 'warmup_offered', conceptId: offer.concepts[0]?.conceptId ?? null,
    payload: { cards, checkIds }, createdAt: now,
  }).run();
  const checks = checkIds.flatMap((id) => {
    const item = world.itemRows.find((row) => row.id === id);
    return item ? [publicItem(item)] : [];
  });
  return { warmupId: clientEventId, cards, checks };
}

export function skipWarmup(db: Db, request: FastifyRequest, clientEventId: string, now: number) {
  const { school, profile } = studentRow(db, request);
  const today = istDay(now);
  const existing = db.select().from(learningEvents).where(and(eq(learningEvents.profileId, profile.id), eq(learningEvents.kind, 'warmup_skipped'))).all()
    .find((row) => istDay(row.createdAt) === today);
  if (existing) return { skipped: true as const };
  const prior = db.select().from(learningEvents).where(eq(learningEvents.id, clientEventId)).get();
  if (prior) throw new ApiException(409, 'EVENT_CONFLICT', 'This event ID already identifies another action.');
  db.insert(learningEvents).values({
    id: clientEventId, profileId: profile.id, schoolId: school.id, kind: 'warmup_skipped', conceptId: null,
    payload: { day: today }, createdAt: now,
  }).run();
  return { skipped: true as const };
}

export function completeWarmup(db: Db, request: FastifyRequest, warmupId: string, ratings: readonly string[], clientEventId: string, now: number) {
  const { school, profile, row } = ownedEvent(db, request, warmupId);
  if (row.kind !== 'warmup_offered') throw new ApiException(404, 'NOT_FOUND', 'Resource not found.');
  const cards = (row.payload as { cards?: unknown[] }).cards ?? [];
  if (ratings.length !== cards.length) throw new ApiException(400, 'INVALID_RATINGS', 'Rate each card once.');
  const done = db.select().from(learningEvents).where(eq(learningEvents.id, clientEventId)).get();
  if (done) {
    if (done.profileId !== profile.id || done.kind !== 'warmup_completed') throw new ApiException(409, 'EVENT_CONFLICT', 'This event ID already identifies another action.');
    return { done: true as const };
  }
  db.insert(learningEvents).values({
    id: clientEventId, profileId: profile.id, schoolId: school.id, kind: 'warmup_completed', conceptId: row.conceptId,
    payload: { warmupId, ratings }, createdAt: now,
  }).run();
  touchStreak(db, profile.id, school.id, 'warmup', clientEventId, now);
  return { done: true as const };
}

export function studentCatchup(db: Db, request: FastifyRequest, now: number) {
  const world = loadWorld(db, request, now);
  const today = istDay(now);
  const lastTouch = world.touches.map((row) => row.day).sort().at(-1) ?? null;
  const missed = absentDays(lastTouch, now);
  const fading = radarOf(world).filter((row) => row.level != null).map((row) => ({
    conceptId: row.conceptId, name: row.name, decayed: decayedMastery(row.mastery, row.updatedAt, now),
  }));
  const session = tonightSession(world, today);
  const focus = session ? sessionFocus(world, session.id) : world.conceptRows[0];
  if (!focus) throw new ApiException(404, 'CATCHUP_UNAVAILABLE', 'There is no catch-up waiting.');
  const plan = buildCatchup({ absentDays: missed, decayed: fading, tonight: { conceptId: focus.id, name: focus.title } });
  if (!plan) throw new ApiException(404, 'CATCHUP_UNAVAILABLE', 'There is no catch-up waiting.');
  const offerId = `recovery-offered:${world.profile.id}:${today}`;
  db.insert(learningEvents).values({
    id: offerId, profileId: world.profile.id, schoolId: world.school.id, kind: 'recovery_offered', conceptId: focus.id,
    payload: { absentDays: missed, absenceStartDay: lastTouch ? shiftIstDay(lastTouch, 1) : today, steps: plan.steps.map((step) => step.conceptId) },
    createdAt: now,
  }).onConflictDoNothing().run();
  db.insert(learningEvents).values({
    id: `absence:${world.profile.id}:${today}`, profileId: world.profile.id, schoolId: world.school.id, kind: 'absence_detected',
    conceptId: null, payload: { absentDays: missed }, createdAt: now,
  }).onConflictDoNothing().run();
  return {
    copy: plan.copy, estMinutes: plan.estMinutes,
    steps: plan.steps.map((step) => {
      const chapterId = world.conceptRows.find((row) => row.id === step.conceptId)?.chapterId;
      return {
        conceptId: step.conceptId, name: step.name, kind: step.kind, estMinutes: step.estMinutes,
        href: step.kind === 'session' && session ? `/student/sessions/${session.id}?compact=1`
          : chapterId ? `/student/chapters/${chapterId}/concepts/${step.conceptId}?compact=1` : '/student?panel=subjects',
      };
    }),
  };
}

export function completeCatchup(db: Db, request: FastifyRequest, clientEventId: string, now: number) {
  const { school, profile } = studentRow(db, request);
  const offer = db.select().from(learningEvents).where(and(eq(learningEvents.profileId, profile.id), eq(learningEvents.kind, 'recovery_offered'))).all()
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  if (!offer) throw new ApiException(409, 'CATCHUP_UNAVAILABLE', 'Open the catch-up before finishing it.');
  const prior = db.select().from(learningEvents).where(eq(learningEvents.id, clientEventId)).get();
  if (prior) {
    if (prior.profileId !== profile.id || prior.kind !== 'recovery_completed') throw new ApiException(409, 'EVENT_CONFLICT', 'This event ID already identifies another action.');
    return { done: true as const, badges: [] };
  }
  const payload = offer.payload as { absentDays?: number; absenceStartDay?: string; steps?: string[] };
  const steps = payload.steps ?? [];
  const evidence = db.select().from(answerEvidence).where(and(eq(answerEvidence.profileId, profile.id), eq(answerEvidence.schoolId, school.id))).all();
  const since = evidence.filter((row) => row.createdAt >= offer.createdAt);
  const recaps = steps.slice(0, -1);
  const ready = recaps.every((conceptId) => since.filter((row) => row.conceptId === conceptId).length >= 2);
  const sessionStep = steps.at(-1);
  const sessionReady = sessionStep ? since.filter((row) => row.conceptId === sessionStep).length >= 3 : false;
  if (!ready || !sessionReady) throw new ApiException(409, 'CATCHUP_INCOMPLETE', 'Finish each small step first.');
  db.insert(learningEvents).values({
    id: clientEventId, profileId: profile.id, schoolId: school.id, kind: 'recovery_completed', conceptId: sessionStep ?? null,
    payload: { absentDays: payload.absentDays ?? 0, absenceStartDay: payload.absenceStartDay ?? null }, createdAt: now,
  }).run();
  touchStreak(db, profile.id, school.id, 'catchup', clientEventId, now);
  const history = db.select().from(badgeAwards).where(eq(badgeAwards.profileId, profile.id)).all()
    .map((row) => ({ badgeId: row.badgeId, scopeKey: row.scopeKey }));
  const awards = evaluateBadges({
    id: clientEventId, kind: 'recovery_completed', absentDays: payload.absentDays ?? 0, absenceStartDay: payload.absenceStartDay ?? null,
  }, history);
  const names = [];
  for (const award of awards) {
    const inserted = db.insert(badgeAwards).values({
      id: `badge:${profile.id}:${award.badgeId}:${award.scopeKey}`, profileId: profile.id, schoolId: school.id,
      badgeId: award.badgeId, scopeKey: award.scopeKey, triggerEventId: award.triggerEventId, awardedAt: now, seenAt: null,
    }).onConflictDoNothing().run();
    if (!inserted.changes) continue;
    notifyBadge(db, school.id, profile.id, award.badgeId, award.scopeKey, now);
    const badge = db.select().from(badgeCatalog).where(eq(badgeCatalog.id, award.badgeId)).get();
    if (badge) names.push({ id: award.badgeId, name: badge.nameEn });
  }
  return { done: true as const, badges: names };
}

function challengeItems(world: World, chapterId: string): ChallengeItem[] {
  return world.itemRows.filter((row) => row.chapterId === chapterId && row.content.type === 'mcq' && row.content.role !== 'diagnostic').map((row) => {
    const level = clampLevel(row.content.difficulty);
    return { id: row.id, conceptId: row.conceptId, level, seeded: row.content.role === 'practice' || row.content.role === 'check' || row.content.role == null, board: level === 4 };
  });
}

export function serveChallenge(db: Db, request: FastifyRequest, now: number) {
  const world = loadWorld(db, request, now);
  const today = istDay(now);
  const existing = world.challenges.find((row) => row.day === today);
  const present = (row: typeof world.challenges[number]) => ({
    id: row.id, status: row.status, href: '/student/challenge',
    showTimer: false, showHindi: false,
    items: row.itemIds.flatMap((id) => {
      const item = world.itemRows.find((candidate) => candidate.id === id) ?? db.select().from(items).where(eq(items.id, id)).get();
      return item ? [publicItem(item)] : [];
    }),
  });
  if (existing) {
    if (!existing.itemIds.length) {
      // A legacy empty served row would 400/409 the whole day; drop it and deal a fresh hand.
      db.delete(dailyChallenges).where(eq(dailyChallenges.id, existing.id)).run();
    } else {
      const chapterId = world.itemRows.find((row) => existing.itemIds.includes(row.id))?.chapterId ?? world.chapterRows[0]?.id;
      const routing = chapterId ? routingFor(world, chapterId) : '50-75';
      const view = present(existing);
      const secondsLeft = existing.startedAt == null ? CHALLENGE_MS / 1000 : Math.max(0, Math.round((existing.startedAt + CHALLENGE_MS - now) / 1000));
      return { ...view, secondsLeft, showTimer: routing === '75-100', showHindi: routing === '0-25' };
    }
  }
  const home = studentHome(db, request, now);
  const tonightId = home.nextAction?.conceptId ?? world.conceptRows[0]?.id;
  const concept = tonightId ? world.conceptRows.find((row) => row.id === tonightId) : undefined;
  const chapterId = concept?.chapterId ?? world.chapterRows[0]?.id;
  if (!chapterId || !tonightId) throw new ApiException(404, 'CHALLENGE_UNAVAILABLE', 'No challenge is ready.');
  const routing = routingFor(world, chapterId);
  const fading = revisionRadar(radarOf(world), now).map((row) => row.conceptId);
  const dushmanIds = world.dushman.filter((row) => row.status === 'active').map((row) => row.conceptId);
  const ladder = asLevel(world.ladders.find((row) => row.conceptId === tonightId)?.ladderLevel ?? null) ?? 2;
  const built = buildDailyChallenge({
    fadingConceptIds: fading, dushmanConceptIds: dushmanIds, tonightConceptId: tonightId, ladderLevel: ladder,
    items: challengeItems(world, chapterId),
  }, routing);
  const id = randomUUID();
  if (!built.itemIds.length) {
    // Never persist an empty challenge: a served row without items bricks every later request for the day.
    return { id, status: 'served' as const, href: '/student/challenge', secondsLeft: CHALLENGE_MS / 1000,
      showTimer: built.timerVisible, showHindi: built.hindiTerms, items: [] };
  }
  db.insert(dailyChallenges).values({
    id, profileId: world.profile.id, schoolId: world.school.id, day: today, itemIds: built.itemIds,
    status: 'served', correct: 0, total: built.itemIds.length, startedAt: now, completedAt: null,
  }).run();
  const saved = db.select().from(dailyChallenges).where(eq(dailyChallenges.id, id)).get();
  if (!saved) throw new ApiException(500, 'INTERNAL_ERROR', 'The request could not be completed.');
  return { ...present(saved), secondsLeft: CHALLENGE_MS / 1000, showTimer: built.timerVisible, showHindi: built.hindiTerms };
}

export function answerChallenge(db: Db, request: FastifyRequest, challengeId: string, input: {
  clientEventId: string; itemId: string; answer: Answer; confidence: 'sure' | 'unsure' | 'guess'; timeMs: number;
}, now: number) {
  const { school, profile } = studentRow(db, request);
  const challenge = found(db.select().from(dailyChallenges).where(eq(dailyChallenges.id, challengeId)).get());
  if (challenge.profileId !== profile.id || challenge.schoolId !== school.id) throw new ApiException(404, 'NOT_FOUND', 'Resource not found.');
  if (challenge.day !== istDay(now)) throw new ApiException(409, 'CHALLENGE_CLOSED', 'This challenge belongs to an earlier day.');
  if (challenge.status !== 'served') throw new ApiException(409, 'CHALLENGE_CLOSED', 'This challenge is already finished.');
  if (!challenge.itemIds.includes(input.itemId)) throw new ApiException(400, 'INVALID_ITEM', 'That question is not in today’s challenge.');
  if (challenge.startedAt != null && now > challenge.startedAt + CHALLENGE_MS) throw new ApiException(409, 'CHALLENGE_CLOSED', 'The five minutes are over.');
  const existing = db.select().from(attempts).where(eq(attempts.clientEventId, input.clientEventId)).get();
  if (existing) {
    if (existing.profileId !== profile.id || existing.itemId !== input.itemId) throw new ApiException(409, 'EVENT_CONFLICT', 'This event ID already identifies another answer.');
    const item = found(db.select().from(items).where(eq(items.id, existing.itemId)).get());
    const feedback = mistakeForSafe(item.content, existing.answer);
    return { itemId: existing.itemId, outcome: existing.correct ? 'yes' as const : 'not_yet' as const, why: existing.correct ? null : feedback };
  }
  const evidenceId = `challenge:${challenge.id}:${input.itemId}`;
  const answered = db.select().from(answerEvidence).where(eq(answerEvidence.id, evidenceId)).get();
  if (answered) {
    const item = found(db.select().from(items).where(scope(items, school.id, input.itemId)).get());
    return { itemId: item.id, outcome: answered.correct ? 'yes' as const : 'not_yet' as const, why: answered.correct ? null : mistakeForSafe(item.content, answered.answer) };
  }
  const item = found(db.select().from(items).where(scope(items, school.id, input.itemId)).get());
  const marked = markItem(item.content, input.answer);
  if (marked === null) throw new ApiException(400, 'UNMARKED', 'This question needs a teacher.');
  const feedback = mistakeForSafe(item.content, input.answer);
  db.insert(attempts).values({
    id: randomUUID(), clientEventId: input.clientEventId, schoolId: school.id, assignmentId: null, profileId: profile.id,
    itemId: item.id, conceptId: item.conceptId, answer: input.answer, correct: marked, needsReview: false,
    timeMs: input.timeMs, clientTs: now, serverTs: now, updatedAt: now, gradedBy: null, gradedAt: null,
  }).run();
  recordAnswer(db, {
    id: evidenceId, schoolId: school.id, profileId: profile.id, conceptId: item.conceptId,
    chapterId: item.chapterId, itemId: item.id, level: clampLevel(item.content.difficulty), correct: marked,
    confidence: input.confidence, source: 'game:daily_challenge', timeMs: input.timeMs,
    answer: typeof input.answer === 'string' ? input.answer : input.answer,
  }, now);
  return { itemId: item.id, outcome: marked ? 'yes' as const : 'not_yet' as const, why: marked ? null : feedback };
}

function mistakeForSafe(content: typeof items.$inferSelect.content, answer: unknown) {
  if (content.type !== 'mcq' || typeof answer !== 'string') return null;
  return content.mistakes?.find((row) => row.option === answer)?.explanation ?? content.explanation ?? null;
}

export function finishChallenge(db: Db, request: FastifyRequest, challengeId: string, now: number) {
  const { school, profile } = studentRow(db, request);
  const challenge = found(db.select().from(dailyChallenges).where(eq(dailyChallenges.id, challengeId)).get());
  if (challenge.profileId !== profile.id || challenge.schoolId !== school.id) throw new ApiException(404, 'NOT_FOUND', 'Resource not found.');
  const answered = db.select().from(answerEvidence).where(and(eq(answerEvidence.profileId, profile.id), eq(answerEvidence.schoolId, school.id))).all()
    .filter((row) => row.source === 'game:daily_challenge' && challenge.itemIds.includes(row.itemId) && istDay(row.createdAt) === challenge.day && (challenge.startedAt == null || row.createdAt >= challenge.startedAt));
  const timeUp = challenge.startedAt != null && now >= challenge.startedAt + CHALLENGE_MS;
  if (challenge.status === 'expired' || (challenge.status === 'served' && !answered.length && timeUp)) {
    // Time ran out with nothing tried: close the day honestly, with no XP or streak credit.
    if (challenge.status === 'served') db.update(dailyChallenges).set({ status: 'expired', correct: 0, completedAt: now }).where(eq(dailyChallenges.id, challenge.id)).run();
    return { status: 'expired' as const, xp: 0, answered: 0 };
  }
  if (challenge.status !== 'completed') {
    if (challenge.day !== istDay(now)) throw new ApiException(409, 'CHALLENGE_CLOSED', 'This challenge belongs to an earlier day.');
    if (!answered.length || (answered.length < challenge.itemIds.length && (challenge.startedAt == null || now < challenge.startedAt + CHALLENGE_MS))) {
      throw new ApiException(409, 'CHALLENGE_INCOMPLETE', 'Try the questions before finishing.');
    }
    const right = answered.filter((row) => row.correct).length;
    db.update(dailyChallenges).set({ status: 'completed', correct: right, total: challenge.itemIds.length, completedAt: now })
      .where(eq(dailyChallenges.id, challenge.id)).run();
    touchStreak(db, profile.id, school.id, 'daily_challenge', challenge.id, now);
  }
  return { status: 'completed' as const, xp: 15, answered: answered.length };
}

export function studentDushman(db: Db, request: FastifyRequest, now: number) {
  const world = loadWorld(db, request, now);
  retireMasteredDushman(db, world, now);
  const chapter = world.chapterRows[0];
  const routing = chapter ? routingFor(world, chapter.id) : '50-75';
  const picks = selectDushman(world.conceptRows.map((concept) => ({
    conceptId: concept.id, name: concept.title, level: asLevel(world.ladders.find((row) => row.conceptId === concept.id)?.masteryLevel ?? null),
  })), world.evidence.map((row) => ({
    conceptId: row.conceptId, correct: row.correct, confidence: row.confidence, notTaught: row.notTaught, createdAt: row.createdAt,
  })), routing);
  const active = world.dushman.filter((row) => row.status === 'active');
  for (const pick of picks) {
    if (active.length >= 3) break;
    if (world.dushman.some((row) => row.conceptId === pick.conceptId && row.status === 'active')) continue;
    const id = randomUUID();
    db.insert(dushmanEntries).values({
      id, profileId: world.profile.id, schoolId: world.school.id, conceptId: pick.conceptId, status: 'active',
      queuedAt: now, retiredAt: null, reason: 'weakest',
    }).run();
    db.insert(dushmanEvents).values({
      id: randomUUID(), profileId: world.profile.id, schoolId: world.school.id, conceptId: pick.conceptId,
      kind: 'queued', evidenceId: null, createdAt: now,
    }).run();
    active.push({ id, profileId: world.profile.id, schoolId: world.school.id, conceptId: pick.conceptId, status: 'active', queuedAt: now, retiredAt: null, reason: 'weakest' });
  }
  const rows = db.select().from(dushmanEntries).where(and(eq(dushmanEntries.profileId, world.profile.id), eq(dushmanEntries.schoolId, world.school.id))).all();
  return {
    entries: rows.filter((row) => row.status === 'active').slice(0, 3).map((row) => {
      const concept = world.conceptRows.find((item) => item.id === row.conceptId);
      const chapterId = concept?.chapterId ?? chapter?.id ?? row.conceptId;
      const level = asLevel(world.ladders.find((item) => item.conceptId === row.conceptId)?.masteryLevel ?? null);
      return {
        conceptId: row.conceptId, name: concept?.title ?? 'Concept', word: levelWord(level), retired: false,
        href: `/student/chapters/${chapterId}/practice/quick_revision_quiz?concept=${row.conceptId}&skin=dushman`,
      };
    }),
  };
}

function planView(db: Db, world: World, plan: typeof studyPlans.$inferSelect) {
  let rows = db.select().from(studyPlanItems).where(eq(studyPlanItems.planId, plan.id)).all()
    .sort((a, b) => a.orderIdx - b.orderIdx);
  const today = istDay(world.now);
  let guard = 0;
  while (guard < 21) {
    guard += 1;
    const open = rows.filter((row) => row.status === 'planned' || row.status === 'folded');
    const missed = open.find((row) => row.night < today);
    if (!missed) break;
    const current: NightItem[] = rows.map((row) => ({
      conceptId: row.conceptId, kind: row.kind, estMinutes: row.estMinutes, night: row.night, orderIdx: row.orderIdx,
      status: row.status, reason: null,
    }));
    const next = replanAfterMiss(current, missed.night, plan.examDate);
    for (const item of next.items) {
      const row = rows.find((candidate) => candidate.orderIdx === item.orderIdx);
      if (!row || (row.night === item.night && row.status === item.status)) continue;
      db.update(studyPlanItems).set({ night: item.night, status: item.status }).where(eq(studyPlanItems.id, row.id)).run();
    }
    for (const event of next.events) {
      const row = rows.find((candidate) => `${candidate.conceptId}:${candidate.kind}` === event.key);
      if (!row) continue;
      db.insert(planCompletionEvents).values({
        id: `plan:${row.id}:${event.kind}:${missed.night}`, planItemId: row.id, profileId: world.profile.id, schoolId: world.school.id,
        kind: event.kind, createdAt: world.now,
      }).onConflictDoNothing().run();
    }
    rows = db.select().from(studyPlanItems).where(eq(studyPlanItems.planId, plan.id)).all().sort((a, b) => a.orderIdx - b.orderIdx);
  }
  const nights = new Map<string, { night: string; minutes: number; items: { id: string; conceptId: string; conceptName: string; kind: NightItem['kind']; estMinutes: number; status: NightItem['status']; note: string | null }[] }>();
  for (const row of rows) {
    let bucket = nights.get(row.night);
    if (!bucket) {
      bucket = { night: row.night, minutes: 0, items: [] };
      nights.set(row.night, bucket);
    }
    if (row.status === 'planned' || row.status === 'folded' || row.status === 'done') bucket.minutes += row.estMinutes;
    bucket.items.push({
      id: row.id, conceptId: row.conceptId, conceptName: conceptName(world, row.conceptId) ?? row.kind, kind: row.kind,
      estMinutes: row.estMinutes, status: row.status,
      note: row.status === 'folded' ? `Moved to ${weekdayName(row.night)}` : row.status === 'dropped' ? 'Does not fit before the exam' : null,
    });
  }
  return {
    id: plan.id, goal: plan.goal, examDate: plan.examDate, minutesPerNight: plan.minutesPerNight,
    nights: [...nights.values()].sort((a, b) => a.night.localeCompare(b.night)),
  };
}

export function studentStudyPlan(db: Db, request: FastifyRequest, now: number) {
  const world = loadWorld(db, request, now);
  const plan = world.plans[0];
  return { plan: plan ? planView(db, world, plan) : null };
}

export function saveStudyPlan(db: Db, request: FastifyRequest, input: { clientEventId: string; examDate: string; minutesPerNight: number; goal: string }, now: number) {
  const world = loadWorld(db, request, now);
  const existing = db.select().from(studyPlans).where(eq(studyPlans.id, input.clientEventId)).get();
  if (existing) {
    if (existing.profileId !== world.profile.id) throw new ApiException(409, 'EVENT_CONFLICT', 'This event ID already identifies another plan.');
    return { plan: planView(db, world, existing) };
  }
  const today = istDay(now);
  if (input.examDate <= today) throw new ApiException(400, 'INVALID_DATE', 'Choose an exam date after today.');
  const fading = new Set(revisionRadar(radarOf(world), now).map((row) => row.conceptId));
  const shaky = world.conceptRows.map((concept) => {
    const ladder = world.ladders.find((row) => row.conceptId === concept.id);
    const level = asLevel(ladder?.masteryLevel ?? null);
    return { id: concept.id, shaky: level === 1 || fading.has(concept.id) || (ladder?.masteryScore ?? 1) < 0.6 };
  });
  const built = buildNightlyPlan({
    examDate: input.examDate, minutesPerNight: input.minutesPerNight, concepts: shaky,
    prereqGraph: world.edges.map((edge) => ({ conceptId: edge.conceptId, prereqId: edge.prereqId })),
    levels: world.ladders.map((row) => ({ conceptId: row.conceptId, level: row.masteryLevel })),
  }, today);
  for (const plan of world.plans) {
    db.update(studyPlans).set({ status: 'archived', updatedAt: now }).where(eq(studyPlans.id, plan.id)).run();
  }
  db.insert(studyPlans).values({
    id: input.clientEventId, profileId: world.profile.id, schoolId: world.school.id, goal: input.goal,
    examDate: input.examDate, minutesPerNight: input.minutesPerNight, status: 'active', createdAt: now, updatedAt: now,
  }).run();
  for (const item of built.items) {
    const concept = world.conceptRows.find((row) => row.id === item.conceptId);
    if (!concept) continue;
    db.insert(studyPlanItems).values({
      id: randomUUID(), planId: input.clientEventId, schoolId: world.school.id, night: item.night, conceptId: item.conceptId,
      kind: item.kind, estMinutes: item.estMinutes, orderIdx: item.orderIdx, status: item.status,
    }).run();
  }
  const saved = found(db.select().from(studyPlans).where(eq(studyPlans.id, input.clientEventId)).get());
  return { plan: planView(db, world, saved) };
}

export function completePlanItem(db: Db, request: FastifyRequest, itemId: string, now: number) {
  const { school, profile } = studentRow(db, request);
  const item = found(db.select().from(studyPlanItems).where(eq(studyPlanItems.id, itemId)).get());
  const plan = found(db.select().from(studyPlans).where(eq(studyPlans.id, item.planId)).get());
  if (plan.profileId !== profile.id || plan.schoolId !== school.id) throw new ApiException(404, 'NOT_FOUND', 'Resource not found.');
  if (item.status !== 'done') {
    db.update(studyPlanItems).set({ status: 'done' }).where(eq(studyPlanItems.id, item.id)).run();
    db.insert(planCompletionEvents).values({
      id: randomUUID(), planItemId: item.id, profileId: profile.id, schoolId: school.id, kind: 'done', createdAt: now,
    }).run();
  }
  return { done: true as const };
}

export function studentStreak(db: Db, request: FastifyRequest, now: number) {
  const world = loadWorld(db, request, now);
  const streak = streakView(world);
  const cached = db.select().from(streakStates).where(eq(streakStates.profileId, world.profile.id)).get();
  return {
    currentDays: cached?.currentDays ?? streak.currentDays,
    longestDays: cached?.longestDays ?? streak.longestDays,
    freezesHeld: cached?.freezesHeld ?? streak.freezesHeld,
    touchedToday: streak.touchedToday, lastDay: cached?.lastDay ?? streak.lastDay, restartCopy: streak.restartCopy, week: streak.week,
    history: [...world.touches].sort((a, b) => a.day.localeCompare(b.day)).map((row) => ({ day: row.day, act: row.act })),
    freezes: [...world.ledger].sort((a, b) => a.day.localeCompare(b.day)).map((row) => ({ kind: row.kind, day: row.day, reason: row.reason })),
  };
}

export function studentBadges(db: Db, request: FastifyRequest) {
  const { school, profile } = studentRow(db, request);
  const awards = db.select().from(badgeAwards).where(and(eq(badgeAwards.schoolId, school.id), eq(badgeAwards.profileId, profile.id))).all();
  const catalog = db.select().from(badgeCatalog).all();
  return {
    badges: catalog.map((badge) => ({
      id: badge.id, name: badge.nameEn, nameHi: badge.nameHi, description: badge.descriptionEn, icon: badge.iconKey,
      awards: awards.filter((row) => row.badgeId === badge.id).map((row) => ({
        id: row.id, scopeKey: row.scopeKey, awardedAt: row.awardedAt, seen: row.seenAt != null,
      })),
    })),
  };
}

export function seeBadge(db: Db, request: FastifyRequest, awardId: string, now: number) {
  const { school, profile } = studentRow(db, request);
  const award = found(db.select().from(badgeAwards).where(eq(badgeAwards.id, awardId)).get());
  if (award.profileId !== profile.id || award.schoolId !== school.id) throw new ApiException(404, 'NOT_FOUND', 'Resource not found.');
  if (award.seenAt == null) db.update(badgeAwards).set({ seenAt: now }).where(eq(badgeAwards.id, award.id)).run();
  return { id: award.id, seen: true as const };
}

export function studentHomework(db: Db, request: FastifyRequest, tab: 'all' | 'todo' | 'submitted' | 'graded', now: number) {
  const world = loadWorld(db, request, now);
  const rows = world.homework.map((assignment) => {
    const questions = assignmentQuestions(db, assignment.id);
    const answers = db.select().from(attempts).where(and(eq(attempts.assignmentId, assignment.id), eq(attempts.profileId, world.profile.id))).all();
    const subject = world.subjectRows.find((item) => item.id === world.chapterRows.find((chapterRow) => chapterRow.id === assignment.chapterId)?.subjectId)?.name ?? 'Class';
    const teacher = world.people.find((person) => person.id === assignment.teacherId)?.name ?? 'Teacher';
    const allAnswered = questions.length > 0 && questions.every((item) => answers.some((answer) => answer.itemId === item.id));
    const graded = allAnswered && answers.length > 0 && questions.every((item) => {
      const answer = answers.find((row) => row.itemId === item.id);
      return answer != null && answer.needsReview === false && answer.correct !== null;
    });
    const status = graded ? 'graded' as const : allAnswered ? 'submitted' as const : assignment.dueAt < now ? 'overdue' as const : 'todo' as const;
    const earned = answers.filter((answer) => answer.correct === true).length;
    return {
      id: assignment.id, title: assignment.title, subject, teacher, count: questions.length, status,
      dueAt: assignment.dueAt, lateUntil: assignment.lateUntil,
      score: graded ? { earned, outOf: questions.length } : null, comment: null,
    };
  }).sort((a, b) => Number(b.status === 'overdue') - Number(a.status === 'overdue') || a.dueAt - b.dueAt);
  const bucket = (status: typeof rows[number]['status']) => status === 'overdue' ? 'todo' : status;
  const counts = {
    all: rows.length,
    todo: rows.filter((row) => bucket(row.status) === 'todo').length,
    submitted: rows.filter((row) => row.status === 'submitted').length,
    graded: rows.filter((row) => row.status === 'graded').length,
  };
  return { counts, items: tab === 'all' ? rows : rows.filter((row) => bucket(row.status) === tab) };
}

export function homeworkDrafts(db: Db, request: FastifyRequest, assignmentId: string) {
  const { school, profile } = requireAuth(request);
  const assignment = assignmentAccess(db, request, assignmentId);
  const itemIds = new Set(assignmentQuestions(db, assignment.id).map((item) => item.id));
  return db.select({ itemId: assignmentDrafts.itemId, answer: assignmentDrafts.answer, updatedAt: assignmentDrafts.updatedAt })
    .from(assignmentDrafts).where(and(eq(assignmentDrafts.schoolId, school.id), eq(assignmentDrafts.profileId, profile.id), eq(assignmentDrafts.assignmentId, assignment.id)))
    .all().filter((draft) => itemIds.has(draft.itemId));
}

export function saveHomeworkDraft(db: Db, request: FastifyRequest, assignmentId: string, itemId: string, answer: Answer, now: number) {
  const { school, profile } = requireAuth(request);
  const assignment = assignmentAccess(db, request, assignmentId);
  const question = found(assignmentQuestions(db, assignment.id).find((item) => item.id === itemId));
  db.insert(assignmentDrafts).values({
    profileId: profile.id, schoolId: school.id, assignmentId: assignment.id, itemId: question.id, answer, updatedAt: now,
  }).onConflictDoUpdate({
    target: [assignmentDrafts.profileId, assignmentDrafts.assignmentId, assignmentDrafts.itemId],
    set: { answer, updatedAt: now },
  }).run();
  return { saved: true as const, itemId: question.id, updatedAt: now };
}
