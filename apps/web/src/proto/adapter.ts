import { z } from 'zod';
import { GameRegistryEntrySchema, LearningEventSchema, LearningModuleSchema, LearningPlanSchema, TutorResponseSchema, type LearningContext, type TeachingMode } from '@vidhyasaathy/contracts';
import { getJson, postJson } from '../api/client';

export const SessionSchema = z.object({ id: z.string(), sessionId: z.string(), chapterId: z.string(), plan: LearningPlanSchema, events: z.array(LearningEventSchema) });
export type LearningSession = z.infer<typeof SessionSchema>;
export const SummarySchema = SessionSchema.extend({ attempted: z.number(), correct: z.number(), notTaught: z.number(), concepts: z.array(z.object({ conceptId: z.string(), word: z.string() })) });
export type LearningSummary = z.infer<typeof SummarySchema>;
export const AnswerSchema = z.object({ correct: z.boolean(), notTaught: z.boolean(), word: z.string(), feedback: z.string(), repairModuleId: z.string().optional() });
export type AnswerResult = z.infer<typeof AnswerSchema>;
export const learningApi = {
  modules: (chapterId: string, signal?: AbortSignal) => getJson(`/learning/modules?chapterId=${encodeURIComponent(chapterId)}`, z.object({ modules: z.array(LearningModuleSchema) }), signal),
  games: (signal?: AbortSignal) => getJson('/learning/games', z.object({ games: z.array(GameRegistryEntrySchema) }), signal),
  plan: (chapterId: string) => postJson('/learning/plan', LearningPlanSchema, { chapterId }),
  start: (chapterId: string, planId?: string) => postJson('/learning/sessions', SessionSchema, { chapterId, ...(planId ? { planId } : {}) }),
  session: (id: string, signal?: AbortSignal) => getJson(`/learning/sessions/${encodeURIComponent(id)}`, SessionSchema, signal),
  summary: (id: string, signal?: AbortSignal) => getJson(`/learning/sessions/${encodeURIComponent(id)}/summary`, SummarySchema, signal),
  event: (sessionId: string, moduleId: string, type: 'module_opened' | 'module_completed' | 'explorer_changed' | 'revision_requested', id: string) => postJson(`/learning/sessions/${encodeURIComponent(sessionId)}/events`, SessionSchema, { id, type, moduleId }),
  answer: (sessionId: string, moduleId: string, questionId: string, answer: string, eventId: string) => postJson(`/learning/modules/${encodeURIComponent(moduleId)}/answers`, AnswerSchema, { sessionId, questionId, answer, eventId }),
  tutor: (context: LearningContext, mode: TeachingMode, moduleId: string, question: string) => postJson('/learning/tutor', TutorResponseSchema, { context, mode, moduleId, question }),
};

// Only resume pointers live here. Answers, chats and scores remain on the server.
const ResumeSchema = z.array(z.object({ id: z.string(), chapterId: z.string(), title: z.string(), completed: z.boolean(), updatedAt: z.string() }));
export type ResumeEntry = z.infer<typeof ResumeSchema>[number];
export function resumeEntries(owner: string): ResumeEntry[] {
  try { return ResumeSchema.parse(JSON.parse(localStorage.getItem(`learning-resume:${owner}`) ?? '[]')); } catch { return []; }
}
export function rememberSession(owner: string, session: LearningSession, title?: string) {
  try {
    const rows = resumeEntries(owner);
    const previous = rows.find((row) => row.id === session.id);
    localStorage.setItem(`learning-resume:${owner}`, JSON.stringify([{ id: session.id, chapterId: session.chapterId, title: title ?? previous?.title ?? 'Learning session', completed: session.plan.status === 'completed', updatedAt: new Date().toISOString() }, ...rows.filter((row) => row.id !== session.id)].slice(0, 50)));
    window.dispatchEvent(new Event('learning-resume-changed'));
  } catch { /* Resume still works through the session URL when storage is unavailable. */ }
}

export function sessionPath(id: string) { return `/student/learning/sessions/${encodeURIComponent(id)}`; }
export function safeGameRoute(route: string) { return route.startsWith('/student/') && !/[\\\r\n]/.test(route) && !route.includes('/atom'); }
