import { SaveItemSchema } from '@vidhyasaathy/contracts';
import type { Database } from '../db/index.ts';

export function offerQuickTry({ sqlite }: Database, threadId: string, schoolId: string, profileId: string, chapterId: string, conceptId: string | null, now: number) {
  if (!conceptId || sqlite.prepare('SELECT 1 FROM ask_quick_try WHERE thread_id=?').get(threadId)) return null;
  const item = sqlite.prepare(`SELECT i.id,i.content FROM item i WHERE i.school_id=? AND i.chapter_id=? AND i.concept_id=?
    AND EXISTS (SELECT 1 FROM learning_session s JOIN profile p ON p.section_id=s.section_id AND p.school_id=s.school_id
      WHERE p.id=? AND s.chapter_id=i.chapter_id AND s.status='published' AND s.release_at<=?)
    AND NOT EXISTS (SELECT 1 FROM answer_evidence e WHERE e.profile_id=? AND e.item_id=i.id AND e.created_at>=?)
    ORDER BY i.position,i.id LIMIT 1`).get(schoolId, chapterId, conceptId, profileId, now, profileId, now - 7 * 86400000) as { id: string; content: string } | undefined;
  if (!item) return null;
  const parsed = SaveItemSchema.safeParse(JSON.parse(item.content));
  if (!parsed.success || parsed.data.type !== 'mcq') return null;
  const content = parsed.data;
  sqlite.prepare('INSERT INTO ask_quick_try (thread_id,item_id,concept_id,chapter_id,content,created_at) VALUES (?,?,?,?,?,?)')
    .run(threadId, item.id, conceptId, chapterId, item.content, now);
  return { itemId: item.id, stem: content.prompt, options: content.options.map((text, i) => ({ id: String(i), text })) };
}
