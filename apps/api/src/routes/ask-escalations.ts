import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { scrubPii, guardAnswer } from '../../../../packages/core/ask.ts';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import type { Database } from '../db/index.ts';
import { ApiException, parseInput } from '../errors.ts';

export function registerAskEscalations(app: FastifyInstance, { sqlite }: Database, now: () => number) {
  app.post('/ask/escalate', { preHandler: requireRole('student') }, async (request) => {
    const input = parseInput(z.object({ messageId: z.string().min(1).max(100), alsoTellTeacher: z.literal(true) }).strict(), request.body);
    const { school, profile } = requireAuth(request);
    const pupil = sqlite.prepare('SELECT section_id FROM profile WHERE id=? AND school_id=?').get(profile.id, school.id) as { section_id: string | null };
    const row = sqlite.prepare(`SELECT t.id,t.concept_id,t.chapter_id,t.title FROM ask_message m JOIN ask_thread t ON t.id=m.thread_id
      WHERE m.id=? AND m.role='saathy' AND t.school_id=? AND t.profile_id=? AND m.created_at>=?`)
      .get(input.messageId, school.id, profile.id, now() - 86400000) as { id: string; concept_id: string | null; chapter_id: string; title: string } | undefined;
    if (!row) throw new ApiException(404, 'NOT_FOUND', 'This explanation is not available.');
    const teacher = sqlite.prepare(`SELECT p.id,p.name FROM teacher_assignment a JOIN profile p ON p.id=a.teacher_profile_id AND p.school_id=a.school_id
      JOIN chapter c ON c.subject_id=a.subject_id AND c.school_id=a.school_id
      WHERE a.school_id=? AND a.section_id=? AND c.id=? ORDER BY p.id LIMIT 1`)
      .get(school.id, pupil.section_id ?? '', row.chapter_id) as { id: string; name: string } | undefined;
    if (!teacher) throw new ApiException(409, 'TEACHER_UNAVAILABLE', 'Ask your teacher in class about this idea.');
    const prior = sqlite.prepare('SELECT id FROM doubt_escalation WHERE school_id=? AND profile_id=? AND message_id=?').get(school.id, profile.id, input.messageId) as { id: string } | undefined;
    const escalationId = prior?.id ?? randomUUID();
    if (!prior) sqlite.prepare(`INSERT INTO doubt_escalation (id,school_id,profile_id,section_id,teacher_id,message_id,concept_id,question_text,status,created_at,thread_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(escalationId, school.id, profile.id, pupil.section_id!, teacher.id, input.messageId, row.concept_id, row.title, 'open', now(), row.id);
    return { escalationId, teacherName: teacher.name, copy: `Sent to ${teacher.name}. You'll see their reply here.` };
  });
  app.get('/teacher/escalations', { preHandler: requireRole('teacher') }, async (request) => {
    const { school, profile } = requireAuth(request);
    const { sectionId } = parseInput(z.object({ sectionId: z.string().optional() }), request.query);
    const rows = sqlite.prepare(`SELECT e.id,p.name AS studentName,c.title AS conceptName,e.question_text AS questionText,e.status,e.created_at AS createdAt,e.teacher_reply AS teacherReply
      FROM doubt_escalation e JOIN profile p ON p.id=e.profile_id AND p.school_id=e.school_id LEFT JOIN concept c ON c.id=e.concept_id AND c.school_id=e.school_id
      WHERE e.school_id=? AND e.teacher_id=? AND (? IS NULL OR e.section_id=?)
      AND EXISTS (SELECT 1 FROM teacher_assignment a JOIN chapter ch ON ch.subject_id=a.subject_id
        JOIN ask_thread t ON t.chapter_id=ch.id
        WHERE t.id=e.thread_id AND a.school_id=e.school_id AND a.teacher_profile_id=? AND a.section_id=e.section_id)
      ORDER BY e.created_at DESC LIMIT 50`).all(school.id, profile.id, sectionId ?? null, sectionId ?? null, profile.id);
    return { items: rows };
  });
  app.post('/teacher/escalations/:id/reply', { preHandler: requireRole('teacher') }, async (request) => {
    const { school, profile } = requireAuth(request);
    const { id } = parseInput(z.object({ id: z.string().min(1).max(100) }), request.params);
    const { text } = parseInput(z.object({ text: z.string().trim().min(1).max(2000) }).strict(), request.body);
    const names = (sqlite.prepare('SELECT name FROM profile WHERE school_id=?').all(school.id) as { name: string }[]).map((p) => p.name);
    const safe = guardAnswer(scrubPii(text, names), [], false).text;
    const result = sqlite.prepare(`UPDATE doubt_escalation SET teacher_reply=?,status='replied',replied_at=? WHERE id=? AND school_id=? AND teacher_id=?
      AND EXISTS (SELECT 1 FROM teacher_assignment a JOIN chapter ch ON ch.subject_id=a.subject_id AND ch.school_id=a.school_id
        JOIN ask_thread t ON t.chapter_id=ch.id AND t.school_id=a.school_id
        WHERE t.id=doubt_escalation.thread_id AND a.school_id=doubt_escalation.school_id AND a.teacher_profile_id=? AND a.section_id=doubt_escalation.section_id)`)
      .run(safe, now(), id, school.id, profile.id, profile.id);
    if (!result.changes) throw new ApiException(404, 'NOT_FOUND', 'This doubt is not available.');
    return { ok: true };
  });
}
