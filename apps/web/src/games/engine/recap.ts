import { z } from 'zod';
import { readCachedMe, readStorage, writeStorage } from '../../storage';
import type { Checkpoint, CheckpointResult, GameDef, RecallQuestion } from './types';

export const RECAP_KEY = 'vs.games.recap';
export const RECAP_DAY_MS = 86_400_000;
export const SLOW_CHECKPOINT_MS = 20_000;

const QuestionSchema = z.object({
  prompt: z.string(), choices: z.array(z.object({ id: z.string(), label: z.string() })),
  answerId: z.string(), explanation: z.string(),
});
const RecapItemSchema = z.object({
  id: z.string(), owner: z.string(), conceptId: z.string(), gameId: z.string(),
  question: QuestionSchema, missedAt: z.number().nonnegative(), reviewedAt: z.number().nonnegative().nullable(),
});
export type RecapItem = z.infer<typeof RecapItemSchema>;
export type RetrievalItem = { id: string; conceptId: string; question: RecallQuestion; priority: number };
export type CheckpointHistory = { sceneId: string; result: CheckpointResult };

export function recapOwner(): string {
  const me = readCachedMe()?.me;
  return me ? `${me.school.id}:${me.profile.id}` : 'guest';
}

export function readRecap(): RecapItem[] {
  try {
    const parsed = z.array(RecapItemSchema).safeParse(JSON.parse(readStorage(RECAP_KEY) ?? '[]'));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function scheduleRecap(items: readonly RecapItem[], now: number, owner: string): RecapItem | null {
  return items.filter((item) => item.owner === owner && now - Math.max(item.missedAt, item.reviewedAt ?? 0) > RECAP_DAY_MS)
    .sort((a, b) => Math.max(a.missedAt, a.reviewedAt ?? 0) - Math.max(b.missedAt, b.reviewedAt ?? 0))[0] ?? null;
}

export function rememberCheckpoint(gameId: string, sceneId: string, checkpoint: Checkpoint, result: CheckpointResult, now = Date.now()): void {
  if (result.correct && result.ms <= (checkpoint.slowMs ?? SLOW_CHECKPOINT_MS)) return;
  const owner = recapOwner();
  const question = checkpoint.recall ?? checkpoint.reteach.recall;
  if (!question) return;
  const id = `${gameId}:${sceneId}`;
  const entries = readRecap().filter((entry) => entry.id !== id || entry.owner !== owner);
  entries.push({ id, owner, conceptId: checkpoint.conceptId, gameId, question, missedAt: now, reviewedAt: null });
  writeStorage(RECAP_KEY, JSON.stringify(entries));
}

export function reviewRecap(id: string, owner: string, now = Date.now()): void {
  writeStorage(RECAP_KEY, JSON.stringify(readRecap().map((item) => item.id === id && item.owner === owner ? { ...item, reviewedAt: now } : item)));
}

export function buildEndRecap(game: GameDef, history: readonly CheckpointHistory[]): RetrievalItem[] {
  return game.scenes.flatMap((scene): RetrievalItem[] => {
    if (!scene.checkpoint) return [];
    const results = history.filter((entry) => entry.sceneId === scene.id).map((entry) => entry.result);
    if (results.length === 0) return [];
    const wrong = results.some((result) => !result.correct);
    const slow = results.some((result) => result.ms > (scene.checkpoint?.slowMs ?? SLOW_CHECKPOINT_MS));
    const question = scene.checkpoint.recall ?? scene.checkpoint.reteach.recall;
    return question ? [{ id: `${game.id}:${scene.id}`, conceptId: scene.checkpoint.conceptId, question, priority: wrong ? 2 : slow ? 1 : 0 }] : [];
  }).sort((a, b) => b.priority - a.priority).slice(0, 3);
}
