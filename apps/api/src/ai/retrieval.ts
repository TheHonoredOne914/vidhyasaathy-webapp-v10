import { createHash } from 'node:crypto';
import type { Database } from '../db/index.ts';
import type { SourceChunk } from './provider.ts';

export const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

// Bound and quote tokens: raw questions are never interpreted as FTS query syntax.
export function retrieveNotes(database: Database, schoolId: string, chapterId: string, question: string, now: number): SourceChunk[] {
  const stop = new Set(['what', 'which', 'when', 'where', 'does', 'have', 'with', 'from', 'this', 'that', 'your', 'please', 'explain', 'about', 'the', 'and', 'how', 'why', 'are', 'can', 'for']);
  const tokens = [...new Set((question.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((word) => word.length > 2 && !stop.has(word)))].slice(0, 16);
  if (!tokens.length) return [];
  const query = tokens.map((word) => `"${word}"`).join(' OR ');
  return database.sqlite.prepare(`
    SELECT c.id, c.note_id AS noteId, n.title, c.position, c.text
    FROM note_chunk_fts f JOIN note_chunk c ON c.id = f.rowid JOIN note n ON n.id = c.note_id
    WHERE note_chunk_fts MATCH ? AND c.school_id = ? AND c.chapter_id = ?
      AND n.school_id = ? AND n.status = 'published' AND n.release_at IS NOT NULL AND n.release_at <= ?
    ORDER BY rank, c.id LIMIT 4
  `).all(query, schoolId, chapterId, schoolId, now) as SourceChunk[];
}
