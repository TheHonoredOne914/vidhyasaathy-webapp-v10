import { and, eq } from 'drizzle-orm';
import { levelWord, type Level } from '@vidhyasaathy/core/learning';
import { istDay, shiftIstDay } from '@vidhyasaathy/core/streak';
import type { FastifyRequest } from 'fastify';
import { requireAuth } from '../auth/middleware.ts';
import { parentSummary, sectionAccess, visibleAnnouncements } from '../dashboard/views.ts';
import { rebuildProfileStreak } from '../daily/streak-store.ts';
import type { Db } from '../db/index.ts';
import {
  aiDraftJobs, answerEvidence, assignmentItems, assignments, attempts, badgeAwards, badgeCatalog, chapters, classes,
  conceptLadders, conceptPrereqs, concepts, diagnosticResults, profiles, sections, streakFreezeLedger,
  streakTouches, subjects, teacherAssignments,
} from '../db/schema.ts';
import { found, scope } from '../school/access.ts';

type Pupil = typeof profiles.$inferSelect;
const words = ['New', "Let's fix this", 'Almost there', 'Mastered', 'Top form'] as const;
const minutes = (ms: number) => Math.round(ms / 60000);
const sumTime = (rows: { timeMs: number }[]) => rows.reduce((sum, row) => sum + row.timeMs, 0);

export function notebookWorld(db: Db, schoolId: string, pupil: Pupil, now: number) {
  const section = pupil.sectionId ? db.select().from(sections).where(scope(sections, schoolId, pupil.sectionId)).get() : null;
  const classRow = section ? db.select().from(classes).where(scope(classes, schoolId, section.classId)).get() : null;
  const sourceClass = Number(classRow?.name.match(/\d+/)?.[0] ?? 9);
  const subjectRows = section ? db.select().from(subjects).where(and(eq(subjects.schoolId, schoolId), eq(subjects.classId, section.classId))).all() : [];
  const subjectIds = new Set(subjectRows.map((row) => row.id));
  const chapterRows = db.select().from(chapters).where(eq(chapters.schoolId, schoolId)).all()
    .filter((row) => subjectIds.has(row.subjectId)).sort((a, b) => a.position - b.position || a.title.localeCompare(b.title));
  const chapterIds = new Set(chapterRows.map((row) => row.id));
  const allConcepts = db.select().from(concepts).where(eq(concepts.schoolId, schoolId)).all().filter((row) => chapterIds.has(row.chapterId));
  // Prior-class diagnostic concepts belong to bridges, not the chapter's new-idea goal ring.
  const conceptRows = allConcepts.filter((row) => row.sourceClass === null || row.sourceClass >= sourceClass);
  const conceptIds = new Set(allConcepts.map((row) => row.id));
  const ladders = db.select().from(conceptLadders).where(and(eq(conceptLadders.schoolId, schoolId), eq(conceptLadders.profileId, pupil.id))).all();
  const evidence = db.select().from(answerEvidence).where(and(eq(answerEvidence.schoolId, schoolId), eq(answerEvidence.profileId, pupil.id))).all()
    .filter((row) => conceptIds.has(row.conceptId) && row.createdAt <= now);
  const edges = db.select().from(conceptPrereqs).where(eq(conceptPrereqs.schoolId, schoolId)).all().filter((row) => conceptIds.has(row.conceptId));
  const mastery = (id: string) => ladders.find((row) => row.conceptId === id)?.masteryLevel ?? null;
  const word = (id: string) => levelWord(mastery(id) as Level | null);
  const done = (id: string) => (mastery(id) ?? 0) >= 3;
  const today = istDay(now);
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const monday = shiftIstDay(today, -(weekday === 0 ? 6 : weekday - 1));
  const week = evidence.filter((row) => istDay(row.createdAt) >= monday);
  const homework = pupil.sectionId ? db.select().from(assignments).where(and(eq(assignments.schoolId, schoolId),
    eq(assignments.sectionId, pupil.sectionId), eq(assignments.status, 'published'))).all()
    .filter((row) => chapterIds.has(row.chapterId) && row.publishedAt !== null && row.publishedAt <= now) : [];
  const answers = db.select().from(attempts).where(and(eq(attempts.schoolId, schoolId), eq(attempts.profileId, pupil.id))).all();
  const members = db.select().from(assignmentItems).where(eq(assignmentItems.schoolId, schoolId)).all();
  const handedIn = (id: string) => {
    const links = members.filter((row) => row.assignmentId === id);
    return links.length > 0 && links.every((link) => answers.some((row) => row.assignmentId === id && row.itemId === link.itemId));
  };
  return { schoolId, pupil, now, subjectRows, chapterRows, conceptRows, allConcepts, evidence, edges, mastery, word, done,
    today, monday, week, homework, handedIn };
}

type World = ReturnType<typeof notebookWorld>;
function overview(world: World, rows: World['conceptRows']) {
  const done = rows.filter((row) => world.done(row.id)).length;
  const masteryPercent = rows.length === 0 ? 0 : Math.round(rows.reduce((sum, row) => sum + (world.mastery(row.id) ?? 0), 0) / (rows.length * 4) * 100);
  const average = rows.length === 0 ? null : Math.round(rows.reduce((sum, row) => sum + (world.mastery(row.id) ?? 0), 0) / rows.length);
  return { done, total: rows.length, masteryPercent, word: levelWord((average || null) as Level | null) };
}

function ordered(world: World, chapterId: string) {
  const pending = world.conceptRows.filter((row) => row.chapterId === chapterId);
  const result: typeof pending = [];
  while (pending.length) {
    const index = pending.findIndex((row) => !world.edges.some((edge) => edge.conceptId === row.id && pending.some((other) => other.id === edge.prereqId)));
    // Corrupt/cyclic graphs remain visible but locked; reads must not hang.
    result.push(pending.splice(index < 0 ? 0 : index, 1)[0]!);
  }
  return result;
}

export function subjectPath(world: World, subjectId: string) {
  const subject = found(world.subjectRows.find((row) => row.id === subjectId));
  let unfinished: { title: string } | null = null;
  const chapters = world.chapterRows.filter((row) => row.subjectId === subjectId).map((chapter) => {
    const ideas = ordered(world, chapter.id);
    const lockReason = unfinished ? `Finish ${unfinished.title} first.` : null;
    let currentFound = false;
    const stations = ideas.map((idea) => {
      const unmet = world.edges.filter((edge) => edge.conceptId === idea.id).map((edge) => world.allConcepts.find((row) => row.id === edge.prereqId))
          .find((row) => row && world.conceptRows.some((idea) => idea.id === row.id) && !world.done(row.id));
      const reason = lockReason ?? (unmet ? `Try ${unmet.title} first.` : null);
      const status = world.done(idea.id) ? 'done' : reason ? 'locked' : currentFound ? 'next' : 'current';
      if (status === 'current') currentFound = true;
      return { conceptId: idea.id, title: idea.title, word: world.word(idea.id), status, lockReason: status === 'done' ? null : reason };
    });
    const goal = overview(world, ideas);
    if (!unfinished && goal.done < goal.total) unfinished = chapter;
    return { chapterId: chapter.id, title: chapter.title, lockReason, stations, goal: { done: goal.done, total: goal.total },
      atAGlance: words.map((word) => ({ word, count: stations.filter((row) => row.word === word).length })),
      nextUp: stations.find((row) => row.status === 'current') ?? null };
  });
  return { subjectId, name: subject.name, chapters, nextUp: chapters.find((row) => row.nextUp)?.nextUp ?? null };
}

export function subjectsBoard(world: World) {
  return { subjects: world.subjectRows.map((subject) => {
    const chapterIds = new Set(world.chapterRows.filter((row) => row.subjectId === subject.id).map((row) => row.id));
    const ideas = world.conceptRows.filter((row) => chapterIds.has(row.chapterId));
    const ids = new Set(world.allConcepts.filter((row) => chapterIds.has(row.chapterId)).map((row) => row.id));
    const due = world.homework.filter((row) => chapterIds.has(row.chapterId) && !world.handedIn(row.id)).sort((a, b) => a.dueAt - b.dueAt)[0];
    return { subjectId: subject.id, name: subject.name, ...overview(world, ideas), nextIdea: subjectPath(world, subject.id).nextUp,
      due: due ? { assignmentId: due.id, title: due.title, dueAt: due.dueAt, state: due.dueAt < world.now ? 'overdue' : 'due' } : null,
      weekMinutes: minutes(sumTime(world.week.filter((row) => ids.has(row.conceptId)))) };
  }) };
}

export function notebookProgress(db: Db, world: World) {
  rebuildProfileStreak(db, world.pupil.id, world.schoolId, world.now);
  const month = world.today.slice(0, 7);
  const days = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
  const touches = db.select().from(streakTouches).where(and(eq(streakTouches.schoolId, world.schoolId), eq(streakTouches.profileId, world.pupil.id))).all();
  const freezes = db.select().from(streakFreezeLedger).where(and(eq(streakFreezeLedger.schoolId, world.schoolId), eq(streakFreezeLedger.profileId, world.pupil.id))).all();
  const catalog = db.select().from(badgeCatalog).all();
  const awards = db.select().from(badgeAwards).where(and(eq(badgeAwards.schoolId, world.schoolId), eq(badgeAwards.profileId, world.pupil.id))).all();
  return { ...subjectsBoard(world), month,
    calendar: Array.from({ length: days }, (_, i) => {
      const day = `${month}-${String(i + 1).padStart(2, '0')}`;
      return { day, studied: touches.some((row) => row.day === day), frozen: freezes.some((row) => row.day === day && row.kind === 'consumed') };
    }),
    ideasToLookAt: world.conceptRows.filter((row) => world.mastery(row.id) !== null && !world.done(row.id))
      .map((row) => ({ conceptId: row.id, title: row.title, word: world.word(row.id) })),
    week: Array.from({ length: 7 }, (_, i) => {
      const day = shiftIstDay(world.monday, i);
      return { day, minutes: minutes(sumTime(world.week.filter((row) => istDay(row.createdAt) === day))) };
    }),
    confidence: (['sure', 'unsure', 'guess'] as const).map((confidence) => {
      const rows = world.evidence.filter((row) => row.confidence === confidence && !row.notTaught && row.correct !== null);
      const correct = rows.filter((row) => row.correct).length;
      return { confidence, answers: rows.length, accuracyPercent: rows.length ? Math.round(correct / rows.length * 100) : null };
    }),
    wins: awards.filter((row) => istDay(row.awardedAt).startsWith(month)).map((row) => ({ id: row.id,
      title: catalog.find((badge) => badge.id === row.badgeId)?.nameEn ?? 'A learning win', awardedAt: row.awardedAt })),
  };
}

export function ownWorld(db: Db, request: FastifyRequest, now: number) {
  const { school, profile } = requireAuth(request);
  return notebookWorld(db, school.id, found(db.select().from(profiles).where(scope(profiles, school.id, profile.id)).get()), now);
}

export function parentHome(db: Db, request: FastifyRequest, childId: string, now: number) {
  // Reuse the established linked-child and school guard. Do not return its legacy nested response.
  const summary = parentSummary(db, request, childId, now);
  const { school } = requireAuth(request);
  const pupil = found(db.select().from(profiles).where(scope(profiles, school.id, childId)).get());
  const world = notebookWorld(db, school.id, pupil, now);
  const idea = (row: World['conceptRows'][number]) => ({ conceptId: row.id, title: row.title, word: world.word(row.id) });
  return { child: summary.child, weekMinutes: minutes(sumTime(world.week)),
    homework: { done: world.homework.filter((row) => world.handedIn(row.id)).length, total: world.homework.length },
    streakDays: rebuildProfileStreak(db, pupil.id, school.id, now).state.currentDays,
    subjects: subjectsBoard(world).subjects.map(({ subjectId, name, word, done, total }) => ({ subjectId, name, word, done, total })),
    gotIt: world.conceptRows.filter((row) => world.done(row.id)
      && world.week.some((answer) => answer.conceptId === row.id && answer.correct && !answer.notTaught)).map(idea),
    workingOn: world.conceptRows.filter((row) => world.mastery(row.id) !== null && !world.done(row.id)).map(idea),
    remarks: visibleAnnouncements(db, request).map(({ id, title, body, sectionId, createdAt }) => ({ id, title, body, sectionId, createdAt }))
      .filter((row) => row.sectionId === pupil.sectionId),
    teacherRemark: summary.teacherConfirmed,
    comingUp: world.homework.filter((row) => !world.handedIn(row.id)).sort((a, b) => a.dueAt - b.dueAt)
      .map(({ id, title, dueAt }) => ({ assignmentId: id, title, dueAt })),
  };
}

export function teacherHome(db: Db, request: FastifyRequest, now: number) {
  const { school, profile } = requireAuth(request);
  const assigned = db.select().from(teacherAssignments).where(and(eq(teacherAssignments.schoolId, school.id), eq(teacherAssignments.teacherProfileId, profile.id))).all();
  const groups = [...new Set(assigned.map((row) => row.sectionId))].map((id) => sectionAccess(db, request, id));
  const pupils = db.select().from(profiles).where(and(eq(profiles.schoolId, school.id), eq(profiles.role, 'student'))).all()
    .filter((row) => groups.some((group) => group.section.id === row.sectionId));
  const worlds = pupils.map((pupil) => {
    const world = notebookWorld(db, school.id, pupil, now);
    const ids = new Set(assigned.filter((row) => row.sectionId === pupil.sectionId).map((row) => row.subjectId));
    world.subjectRows = world.subjectRows.filter((row) => ids.has(row.id));
    const chapterIds = new Set(world.chapterRows.filter((row) => ids.has(row.subjectId)).map((row) => row.id));
    world.chapterRows = world.chapterRows.filter((row) => chapterIds.has(row.id));
    world.conceptRows = world.conceptRows.filter((row) => chapterIds.has(row.chapterId));
    const concepts = new Set(world.allConcepts.filter((row) => chapterIds.has(row.chapterId)).map((row) => row.id));
    world.evidence = world.evidence.filter((row) => concepts.has(row.conceptId));
    world.week = world.week.filter((row) => concepts.has(row.conceptId));
    world.homework = world.homework.filter((row) => chapterIds.has(row.chapterId));
    return world;
  });
  const diagnostics = db.select().from(diagnosticResults).where(and(eq(diagnosticResults.schoolId, school.id), eq(diagnosticResults.skipped, false))).all();
  const errors = new Map<string, number>();
  for (const row of worlds.flatMap((world) => world.week).filter((row) => row.correct === false && !row.notTaught && row.errorType)) {
    errors.set(row.errorType!, (errors.get(row.errorType!) ?? 0) + 1);
  }
  const common = [...errors].sort((a, b) => b[1] - a[1])[0];
  const chapterIds = new Set(worlds.flatMap((world) => world.chapterRows.map((row) => row.id)));
  // Also include assigned chapters in an empty class, without widening access to another subject.
  for (const row of db.select().from(chapters).where(eq(chapters.schoolId, school.id)).all()) {
    if (assigned.some((assignment) => assignment.subjectId === row.subjectId)) chapterIds.add(row.id);
  }
  const jobs = db.select().from(aiDraftJobs).where(eq(aiDraftJobs.schoolId, school.id)).all();
  return { kpis: {
    diagnostic: { done: worlds.reduce((sum, world) => sum + world.chapterRows.filter((chapter) => diagnostics.some((row) => row.profileId === world.pupil.id && row.chapterId === chapter.id)).length, 0),
      total: worlds.reduce((sum, world) => sum + world.chapterRows.length, 0) },
    handedIn: { done: worlds.reduce((sum, world) => sum + world.homework.filter((row) => world.handedIn(row.id)).length, 0),
      total: worlds.reduce((sum, world) => sum + world.homework.length, 0) },
    studiedThisWeek: { done: worlds.filter((world) => world.week.length > 0).length, total: pupils.length },
    commonMistake: common ? { errorType: common[0], count: common[1] } : null,
  },
    heatTable: groups.map((group) => ({ sectionId: group.section.id, name: group.section.name,
      concepts: [...new Map(worlds.filter((world) => world.pupil.sectionId === group.section.id).flatMap((world) => world.conceptRows).map((row) => [row.id, row])).values()]
        .map((concept) => {
          const groupWorlds = worlds.filter((world) => world.pupil.sectionId === group.section.id);
          return { conceptId: concept.id, title: concept.title, total: groupWorlds.length,
            counts: words.map((word) => ({ word, count: groupWorlds.filter((world) => world.word(concept.id) === word).length })) };
        }) })),
    reviewQueue: jobs.filter((row) => chapterIds.has(row.chapterId) && assigned.some((assignment) => assignment.sectionId === row.sectionId && assignment.subjectId === db.select().from(chapters).where(scope(chapters, school.id, row.chapterId)).get()?.subjectId)
      && ['ready', 'failed', 'not_configured'].includes(row.status))
      .map(({ id, chapterId, sectionId, status, createdAt, message }) => ({ id, chapterId, sectionId, status, createdAt, message })),
    nudges: worlds.flatMap((world) => {
      const last = world.evidence.reduce((latest, row) => Math.max(latest, row.createdAt), 0);
      const needsHelp = world.conceptRows.find((row) => world.mastery(row.id) === 1);
      const reason = last < now - 3 * 86400000 ? 'No study recorded in the last three days.' : needsHelp ? `A little help with ${needsHelp.title}.` : null;
      return reason ? [{ profileId: world.pupil.id, name: world.pupil.name, sectionId: world.pupil.sectionId, reason }] : [];
    }),
  };
}
