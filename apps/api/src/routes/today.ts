import { TodayPlanSchema, type TodayAction } from '@vidhyasaathy/contracts';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { chapterAccess } from '../content/access.ts';
import { studentHome, studentHomework } from '../daily/service.ts';
import type { Database } from '../db/index.ts';
import { chapters } from '../db/schema.ts';
import { moduleBank } from '../learning/proto-content.ts';
import { sessionPlan, type StudySession } from '../learning/proto-store.ts';
import { statusWordFor } from '../learning/status-word.ts';

export function registerTodayRoutes(app: FastifyInstance, database: Database, now: () => number) {
  const { db, sqlite } = database;
  app.get('/student/today', { preHandler: requireRole('student') }, async (request) => {
    const { school, profile } = requireAuth(request);
    const time = now();
    const home = studentHome(db, request, time);
    const catalog = db.select().from(chapters).where(eq(chapters.schoolId, school.id)).all().filter((row) => {
      if (!home.subjects.some((subject) => subject.id === row.subjectId)) return false;
      try { chapterAccess(db, request, row.id); return true; } catch { return false; }
    });
    const candidates: TodayAction[] = [];
    const sessions = sqlite.prepare('SELECT * FROM proto_study_session WHERE school_id=? AND profile_id=? ORDER BY updated_at DESC,rowid DESC').all(school.id, profile.id) as StudySession[];
    for (const session of sessions) {
      const chapter = catalog.find((row) => row.id === session.chapter_id);
      const plan = sessionPlan(session);
      if (!chapter || plan.status === 'completed') continue;
      const step = moduleBank(db, school.id, chapter).modules.find((row) => row.id === plan.steps[plan.currentStep]?.moduleId);
      candidates.push({ kind: 'continue_session', title: `Continue ${chapter.title}`, subtitle: step?.objective ?? 'Your next idea is ready.',
        href: `/student/learning/sessions/${session.id}`, estMinutes: 10, chapterId: chapter.id, sessionId: session.id });
    }
    for (const item of studentHomework(db, request, 'todo', time).items.filter((row) => row.dueAt <= time + 2 * 86_400_000)) {
      candidates.push({ kind: 'homework', title: item.title, subtitle: 'A little time for your teacher’s task.', href: `/student/assignments/${item.id}`, estMinutes: 15 });
    }
    const weak = sqlite.prepare('SELECT c.id,c.chapter_id,c.title,s.mastery,s.attempts FROM student_concept_state s JOIN concept c ON c.id=s.concept_id AND c.school_id=s.school_id WHERE s.school_id=? AND s.profile_id=? AND s.attempts>0 AND s.mastery<0.4 ORDER BY s.mastery,c.id').all(school.id, profile.id) as { id: string; chapter_id: string; title: string; mastery: number; attempts: number }[];
    for (const concept of weak.filter((row) => catalog.some((chapter) => chapter.id === row.chapter_id))) {
      candidates.push({ kind: 'fix', title: concept.title, subtitle: 'Let’s try this idea together.', href: `/student/chapters/${concept.chapter_id}/concepts/${concept.id}`,
        estMinutes: 5, chapterId: concept.chapter_id, conceptId: concept.id, status: statusWordFor(concept.mastery, concept.attempts) });
    }
    if (home.catchUp) candidates.push({ kind: 'catchup', title: 'Welcome back', subtitle: home.catchUp.copy, href: '/student/catchup', estMinutes: home.catchUp.estMinutes });
    const unstarted = catalog.filter((chapter) => !sessions.some((session) => session.chapter_id === chapter.id));
    for (const chapter of [...unstarted, ...catalog.filter((row) => !unstarted.includes(row))]) {
      candidates.push({ kind: 'start_chapter', title: chapter.title, subtitle: 'Explore one idea at a time.', href: `/student/chapters/${chapter.id}/learn`, estMinutes: 10, chapterId: chapter.id, status: 'New' });
    }
    if (!candidates.length) candidates.push({ kind: 'start_chapter', title: 'Explore your chapters', subtitle: 'Choose an idea to begin.', href: '/student/chapters', estMinutes: 10 });
    const unique = candidates.filter((row, index) => candidates.findIndex((other) => other.href === row.href) === index);
    return TodayPlanSchema.parse({ date: home.greeting.dateIST, greeting: `${home.greeting.name}, ${home.greeting.line}`, primary: unique[0], next: unique.slice(1, 4), streakDays: home.streak.currentDays, source: 'live' });
  });
}
