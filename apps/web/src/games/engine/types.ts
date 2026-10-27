import type { SubmitPracticeAttempt } from '@vidhyasaathy/contracts';
import type { ReactNode } from 'react';

export type CheckpointAnswer = string | number | string[] | Record<string, string>;
export type Choice = { id: string; label: string };
export type QuizQuestion = { id: string; prompt: string; choices: Choice[] };
export type Feedback = { correct: boolean; feedback: string };
export type RecallQuestion = {
  prompt: string;
  choices: Choice[];
  answerId: string;
  explanation: string;
};

type CheckpointBase = {
  id?: string;
  prompt: string;
  conceptId: string;
  validate: (answer: CheckpointAnswer) => Feedback;
  reteach: { sceneId?: string; narration?: string[]; hint: string; recall?: RecallQuestion };
  recall?: RecallQuestion;
  atMs?: number;
  slowMs?: number;
  review?: boolean;
  practice?: {
    itemId: string;
    toAnswer: (answer: CheckpointAnswer) => SubmitPracticeAttempt['answer'];
  };
};

export type Checkpoint = CheckpointBase & (
  | { kind: 'tap' | 'predict'; choices: Choice[] }
  | { kind: 'drag'; items: Choice[]; targets: Choice[] }
  | { kind: 'slider'; min: number; max: number; step: number; target?: [number, number]; unit: string }
  | { kind: 'order'; items: Choice[] }
  | { kind: 'quiz'; questions: QuizQuestion[] }
  | { kind: 'numeric'; unit: string; min?: number; max?: number; step?: number }
);

export type SceneState = {
  revealed: boolean;
  solved: boolean;
  reducedMotion: boolean;
  narrationIndex: number;
  highlightId: string | null;
  answers: Readonly<Record<string, CheckpointAnswer>>;
};

export type Scene = {
  id: string;
  durationMs: number;
  narration: string[];
  render: (t: number, state: SceneState) => ReactNode;
  signals: string[];
  task?: string;
  conceptStep?: string;
  checkpoint?: Checkpoint;
  focusCheck?: { atMs: number; prompt: string; target: { x: number; y: number; label: string } };
};

export type ArenaStat = { label: string; value: string };
export type ArenaApi = {
  round: number;
  setStats: (stat: ArenaStat) => void;
  reportResult: (correct: boolean) => void;
  hintRequested: boolean;
  registerPrimary: (onCheck: () => void) => void;
  readout: Readonly<Record<string, string>>;
  setReadout: (readout: Record<string, string>) => void;
};
export type ArenaLevel = {
  title: string;
  subtitle: string;
  taskTitle: string;
  taskText: string;
  taskBody?: ReactNode | ((api: ArenaApi) => ReactNode);
  card2: ReactNode | ((api: ArenaApi) => ReactNode);
  primaryLabel: string;
  concept: ReactNode;
  Stage: (props: { api: ArenaApi }) => ReactNode;
  check: (api: ArenaApi) => void;
};
export type ArenaDef = {
  name: string;
  world: string;
  chapterLabel: string;
  levels: ArenaLevel[];
};

export type GameDef = {
  id: string;
  title: string;
  chapterRef: string;
  conceptIds: string[];
  scenes: Scene[];
  arena?: ArenaDef;
};

export type CheckpointResult = {
  conceptId: string;
  correct: boolean;
  attempts: number;
  hintUsed: boolean;
  ms: number;
  source: `game:${string}`;
};

export function checkpointTime(scene: Scene): number {
  return scene.checkpoint?.kind === 'predict' ? 0 : scene.checkpoint?.atMs ?? scene.durationMs;
}

export function validateGame(game: GameDef): void {
  if (game.arena) {
    if (!game.id || !game.title || !game.chapterRef || game.arena.levels.length === 0) throw new Error('An arena needs a title, chapter and levels.');
    if (game.arena.levels.some((level) => !level.title || !level.subtitle || !level.Stage)) throw new Error('Arena levels need titles, subtitles and stages.');
    return;
  }
  if (!game.id || !game.title || !game.chapterRef || game.scenes.length === 0) throw new Error('A game needs a title, chapter and scenes.');
  const ids = new Set<string>();
  const concepts = new Set<string>();
  let interleaved = false;
  let focusChecks = 0;
  let checkpoints = 0;
  for (const [index, scene] of game.scenes.entries()) {
    if (!scene.id || ids.has(scene.id)) throw new Error('Scene IDs must be distinct.');
    ids.add(scene.id);
    if (!Number.isFinite(scene.durationMs) || scene.durationMs <= 0 || scene.durationMs > 45_000) throw new Error('Scenes must last between 1 ms and 45 seconds.');
    if (scene.narration.length === 0 || scene.narration.some((line) => !line.trim() || line.length > 64 || line.includes('\n'))) throw new Error('Use short narration bubbles (at most 64 characters).');
    if (scene.signals.length !== scene.narration.length || scene.signals.some((signal) => !signal)) throw new Error('Signal the subject of each narration bubble.');
    if (scene.focusCheck) {
      focusChecks += 1;
      const { atMs, target } = scene.focusCheck;
      if ((index + 1) % 3 === 0 || atMs < 0 || atMs + 4000 > scene.durationMs || target.x < 5 || target.x > 95 || target.y < 5 || target.y > 95) throw new Error('Focus checks need four playback seconds in a reward scene.');
    }
    const checkpoint = scene.checkpoint;
    if (!checkpoint) continue;
    checkpoints += 1;
    if (!game.conceptIds.includes(checkpoint.conceptId)) throw new Error('Checkpoint concepts must belong to the game.');
    if (checkpoint.review && concepts.has(checkpoint.conceptId)) interleaved = true;
    concepts.add(checkpoint.conceptId);
    if (checkpointTime(scene) < 0 || checkpointTime(scene) > scene.durationMs) throw new Error('Checkpoints must be inside their scene.');
    if (checkpoint.kind === 'predict' && checkpoint.atMs !== undefined && checkpoint.atMs !== 0) throw new Error('Predictions must precede the reveal.');
    if (checkpoint.reteach.sceneId && !ids.has(checkpoint.reteach.sceneId)) throw new Error('Reteach can replay only this or an earlier scene.');
    const recall = checkpoint.recall ?? checkpoint.reteach.recall;
    if (!recall || recall.choices.length < 2 || !recall.choices.some((choice) => choice.id === recall.answerId)) throw new Error('Every checkpoint needs an answerable retrieval question.');
    if (checkpoint.kind === 'slider' && (checkpoint.min >= checkpoint.max || checkpoint.step <= 0 || (checkpoint.target && (checkpoint.target[0] > checkpoint.target[1] || checkpoint.target[0] < checkpoint.min || checkpoint.target[1] > checkpoint.max)))) throw new Error('Use valid slider bounds and target range.');
  }
  if (!interleaved) throw new Error('Interleave a checkpoint from an earlier concept.');
  if (checkpoints < 3) throw new Error('Include at least three checkpoints for retrieval practice.');
  if (focusChecks < 1 || focusChecks > 2) throw new Error('Include one or two optional focus checks.');
}
