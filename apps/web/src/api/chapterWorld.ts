import { ChapterSchema, GameRegistryEntrySchema, LearningModuleSchema, ProgressSchema, SubjectSchema } from '@vidhyasaathy/contracts';
import { z } from 'zod';
import { ConceptListSchema } from '../content/schemas';
import { useRemote } from '../setup/useRemote';
import { safeGameRoute } from '../proto/adapter';
import { ChapterWorldSchema, type ChapterWorld } from './student-flow-types';

export function chapterStops(chapterId: string, counts: Record<string, number>, needsRepair: boolean): ChapterWorld['stops'] {
  const learn = `/student/chapters/${encodeURIComponent(chapterId)}/learn`;
  return [
    { key: 'explore', title: 'Explore', count: counts.explorer ?? 0, detail: 'explorers' },
    { key: 'learn', title: 'Learn', count: (counts.concept ?? 0) + (counts.guided_example ?? 0), detail: 'ideas and examples' },
    { key: 'try', title: 'Try', count: counts.practice ?? 0, detail: 'practice activities' },
    { key: 'fix', title: 'Fix', count: counts.repair ?? 0, detail: 'repair activities' },
    { key: 'play', title: 'Play', count: counts.games ?? 0, detail: 'chapter games' },
    { key: 'master', title: 'Master', count: counts.revision ?? 0, detail: 'revision activities' },
  ].map((stop) => ({ key: stop.key as ChapterWorld['stops'][number]['key'], title: stop.title,
    state: stop.count > 0 && (stop.key !== 'fix' || needsRepair) ? 'open' : 'locked',
    href: stop.key === 'play' ? `/student/chapters/${encodeURIComponent(chapterId)}#chapter-games` : learn, detail: `${stop.count} ${stop.detail}` }));
}

export function useChapterWorld(chapterId: string) {
  const live = useRemote(`/student/chapters/${encodeURIComponent(chapterId)}/world`, ChapterWorldSchema);
  const chapter = useRemote(`/chapters/${encodeURIComponent(chapterId)}`, ChapterSchema);
  const subject = useRemote(chapter.data ? `/subjects/${chapter.data.subjectId}` : null, SubjectSchema);
  const concepts = useRemote(`/chapters/${encodeURIComponent(chapterId)}/concepts`, ConceptListSchema);
  const progress = useRemote('/me/progress', ProgressSchema);
  const modules = useRemote(`/learning/modules?chapterId=${encodeURIComponent(chapterId)}`, z.object({ modules: z.array(LearningModuleSchema) }));
  const registry = useRemote('/learning/games', z.object({ games: z.array(GameRegistryEntrySchema) }));
  let fallback: ChapterWorld | null = null;
  if (chapter.data && concepts.data && modules.data && registry.data) {
    const ideas = concepts.data.map((concept) => ({ conceptId: concept.id, name: concept.title, word: progress.data?.masteryWords.find((row) => row.conceptId === concept.id)?.word ?? 'New' as const }));
    const games = registry.data.games.filter((game) => game.chapterId === chapterId && game.available && safeGameRoute(game.route)).map((game) => ({ id: game.id, title: game.title, href: game.route }));
    const counts: Record<string, number> = { games: games.length };
    modules.data.modules.forEach((module) => { counts[module.type] = (counts[module.type] ?? 0) + 1; });
    fallback = { chapterId, title: chapter.data.title, subjectName: subject.data?.name ?? 'Your subject', concepts: ideas, games, stops: chapterStops(chapterId, counts, ideas.some((idea) => idea.word === "Let's fix this")), sessionId: null, source: 'mock' };
  }
  return { data: live.data ?? fallback, failed: !live.data && [chapter, concepts, modules, registry].some((part) => part.status === 'error'), retry: () => { [live, chapter, concepts, modules, registry].forEach((part) => part.reload()); } };
}
