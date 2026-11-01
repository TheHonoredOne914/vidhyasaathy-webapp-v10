import { and, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { LearningPreferencesSchema, NotebookProgressSchema, SubjectPathSchema, SubjectsBoardSchema, type GameId } from '@vidhyasaathy/contracts';
import { gameModules } from '@vidhyasaathy/core/games';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { resourceId } from '../content/access.ts';
import type { Db } from '../db/index.ts';
import { learningPreferences, items, learningSessions, concepts, profiles } from '../db/schema.ts';
import { gameCheckpointMap, gameSessions } from '../db/schema-phase4.ts';
import { GAME_TITLES } from './games.ts';
import type { GamesBoard } from '@vidhyasaathy/contracts';
import { parseInput } from '../errors.ts';
import { notebookProgress, ownWorld, parentHome, subjectPath, subjectsBoard, teacherHome } from '../notebook/views.ts';
import { practiceSet } from '../practice/service.ts';

export function registerNotebookRoutes(app: FastifyInstance, db: Db, now: () => number) {
  const student = { preHandler: requireRole('student') };
  app.get('/student/subjects-board', student, async (request) =>
    SubjectsBoardSchema.parse(subjectsBoard(ownWorld(db, request, now()))));
  app.get('/student/subjects/:id/path', student, async (request) =>
    SubjectPathSchema.parse(subjectPath(ownWorld(db, request, now()), resourceId(request))));
  app.get('/student/progress', student, async (request) =>
    NotebookProgressSchema.parse(notebookProgress(db, ownWorld(db, request, now()))));
  app.get('/teacher/home', { preHandler: requireRole('teacher') }, async (request) => teacherHome(db, request, now()));
  app.get('/parents/children/:id/home', { preHandler: requireRole('parent') }, async (request) =>
    parentHome(db, request, resourceId(request), now()));
  app.get('/student/games', student, async (request) => {
    const timestamp = now();
    const world = ownWorld(db, request, timestamp);
    const chapters = world.subjectRows.flatMap((subject) => subjectPath(world, subject.id).chapters.map((chapter) => ({
      chapterId: chapter.chapterId, title: chapter.title, subjectId: subject.id,
      games: (Object.keys(gameModules) as GameId[]).map((gameId) => {
        const available = practiceSet(db, request, chapter.chapterId, gameId, 1, timestamp).items.length > 0;
        return { gameId, state: !chapter.lockReason && available ? 'open' : 'locked',
          opensAfter: chapter.lockReason ? chapter.lockReason : available ? null : 'Your teacher shares practice for this chapter.' };
      }),
    })));
    const { school, profile } = requireAuth(request);
    const mapped = db.select().from(gameCheckpointMap).where(eq(gameCheckpointMap.schoolId, school.id)).all();
    const bank = db.select().from(items).where(eq(items.schoolId, school.id)).all();
    const rounds = db.select().from(gameSessions).where(and(eq(gameSessions.schoolId, school.id), eq(gameSessions.profileId, profile.id))).all();
    const sectionId = db.select().from(profiles).where(eq(profiles.id, profile.id)).get()?.sectionId;
    const lessons = db.select().from(learningSessions).where(and(eq(learningSessions.schoolId, school.id), eq(learningSessions.sectionId, sectionId ?? ''))).all();
    const conceptRows = db.select().from(concepts).where(eq(concepts.schoolId, school.id)).all();
    const games: GamesBoard['games'] = [];
    for (const [gameId, title] of Object.entries(GAME_TITLES)) {
      const mapping = mapped.find((row) => row.gameId === gameId);
      const item = mapping ? bank.find((row) => row.id === mapping.itemId) : undefined;
      const chapter = item ? chapters.find((row) => row.chapterId === item.chapterId) : undefined;
      if (!chapter) continue;
      const subject = world.subjectRows.find((row) => row.id === chapter.subjectId)!;
      const released = lessons.some((row) => row.chapterId === chapter.chapterId && row.status === 'published' && row.releaseAt !== null && row.releaseAt <= timestamp);
      const completed = rounds.filter((row) => row.gameId === gameId && row.finishedAt !== null).sort((a, b) => (b.bestValue ?? 0) - (a.bestValue ?? 0));
      const best = completed[0];
      games.push({ gameId, title, subjectId: subject.id, subjectName: subject.name, topic: chapter.title, chapterId: chapter.chapterId,
        href: `/student/chapters/${encodeURIComponent(chapter.chapterId)}/practice/engine/${gameId}`, state: !released ? 'opens_later' : best ? 'played' : 'new',
        ...(!released ? { opensAfter: 'Your teacher will share this lesson first.' } : {}),
        ...(best?.bestKind && best.bestValue !== null && best.bestLabel ? { best: { kind: best.bestKind as 'score', value: best.bestValue, label: best.bestLabel } } : {}) });
    }
    const today = games.find((row) => row.state === 'new') ?? games.find((row) => row.state === 'played');
    if (today) today.state = 'today';
    const todayMapping = today ? mapped.find((row) => row.gameId === today.gameId) : undefined;
    const todayConcept = conceptRows.find((row) => row.id === todayMapping?.conceptId);
    return { chapters, subjects: world.subjectRows.map((subject) => ({ id: subject.id, name: subject.name, count: games.filter((row) => row.subjectId === subject.id).length })),
      total: games.length, games, todaysGame: today ? { gameId: today.gameId, chapterId: today.chapterId, title: today.title, href: today.href,
        blurb: `Explore ${today.topic} through a short game.`, conceptName: todayConcept?.title ?? today.topic,
        lessonNote: `From your released lesson: ${today.topic}`, estMinutes: 5 } : null,
      atomForge: { status: 'ready', label: 'Enter the atom', href: '/student/games/atom' } };
  });
  app.get('/student/settings', student, async (request) => {
    const { school, profile } = requireAuth(request);
    const row = db.select().from(learningPreferences).where(and(
      eq(learningPreferences.schoolId, school.id), eq(learningPreferences.profileId, profile.id),
    )).get();
    return LearningPreferencesSchema.parse(row?.preferences ?? {});
  });
  app.put('/student/settings', student, async (request) => {
    const preferences = parseInput(LearningPreferencesSchema, request.body);
    const { school, profile } = requireAuth(request);
    db.insert(learningPreferences).values({ schoolId: school.id, profileId: profile.id, preferences, updatedAt: now() })
      .onConflictDoUpdate({ target: learningPreferences.profileId, set: { preferences, updatedAt: now() } }).run();
    return preferences;
  });
}
