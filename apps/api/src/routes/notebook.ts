import { and, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { LearningPreferencesSchema, NotebookProgressSchema, SubjectPathSchema, SubjectsBoardSchema, type GameId } from '@vidhyasaathy/contracts';
import { gameModules } from '@vidhyasaathy/core/games';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { resourceId } from '../content/access.ts';
import type { Db } from '../db/index.ts';
import { learningPreferences } from '../db/schema.ts';
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
    const first = chapters.find((chapter) => chapter.games.some((game) => game.state === 'open'));
    return { chapters, todaysGame: first ? { chapterId: first.chapterId, gameId: first.games.find((game) => game.state === 'open')!.gameId } : null,
      atomForge: { status: 'paused', label: 'Coming back soon' } };
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
