import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Database } from '../db/index.ts';
import type { SourceChunk } from './provider.ts';

type BookSection = { id: string; title: string; content: string };
type BookChapter = { grade: number; number: number; title: string; sections: BookSection[] };
const ganitaManjari = JSON.parse(readFileSync(new URL('../data/ganita-manjari.json', import.meta.url), 'utf8')) as BookChapter[];
const modelBooks = [
  { name: 'Ganita Manjari', key: 'ganita-manjari', chapters: ganitaManjari, offset: 9_000_000, subject: /math/i },
  { name: 'Exploration', key: 'science-exploration', chapters: JSON.parse(readFileSync(new URL('../data/science-exploration.json', import.meta.url), 'utf8')) as BookChapter[], offset: 10_000_000, subject: /science|physics|chemistry|biology/i },
  { name: 'Understanding Society', key: 'understanding-society', chapters: JSON.parse(readFileSync(new URL('../data/understanding-society.json', import.meta.url), 'utf8')) as BookChapter[], offset: 11_000_000, subject: /social|sst|history|geography|economics|civics/i },
];

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

// VidhyaSaathy chapter titles vary by curriculum edition. Require a meaningful
// title-token overlap before using the Grade 9 Ganita Manjari corpus.
export function retrieveGanitaManjari(chapterTitle: string, question: string): SourceChunk[] {
  return retrieveModelBooks('Mathematics', chapterTitle, question);
}

/** The model's three textbook indexes, scoped to the current subject/chapter. */
export function retrieveModelBooks(subject: string, chapterTitle: string, question: string): SourceChunk[] {
  const stop = new Set(['the', 'and', 'this', 'that', 'what', 'which', 'explain', 'around', 'world', 'introduction', 'exploring', 'understanding', 'describing', 'with', 'from']);
  const words = (value: string) => new Set((value.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((word) => word.length > 2 && !stop.has(word)));
  const chapterWords = words(chapterTitle);
  const questionWords = words(question);
  const hits = modelBooks.filter((book) => book.subject.test(subject)).flatMap((book) => book.chapters.flatMap((chapter) => {
    const overlap = [...words(chapter.title)].filter((word) => chapterWords.has(word)).length;
    if (!overlap) return [];
    return chapter.sections.map((section, index) => {
      const text = `${section.title}\n${section.content}`;
      const score = [...questionWords].filter((word) => text.toLowerCase().includes(word)).length;
      return { book, chapter, section, index, score, overlap };
    });
  })).filter((hit) => hit.score > 0).sort((a, b) => b.overlap - a.overlap || b.score - a.score).slice(0, 3);
  return hits.map(({ book, chapter, section, index }) => ({
    id: book.offset + chapter.number * 100 + index,
    noteId: `${book.key}-${chapter.number}`,
    title: `${book.name}, Class ${chapter.grade}, Chapter ${chapter.number}: ${chapter.title}, ${section.title}`,
    position: index,
    text: section.content.slice(0, 5000),
  }));
}
