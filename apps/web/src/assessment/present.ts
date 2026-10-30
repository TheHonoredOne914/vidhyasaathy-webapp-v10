import type { Assignment } from '@vidhyasaathy/contracts';
import type { AssignmentDetail } from './schemas';

export type QuestionKind = 'mcq' | 'short_answer' | 'match_pairs' | 'flashcard';

export type QuestionView = {
  id: string;
  prompt: string;
  kind: QuestionKind;
  options: string[];
  left: string[];
  right: string[];
  answer: string | null;
};

export function questionView(item: AssignmentDetail['items'][number]): QuestionView {
  if ('content' in item) {
    const content = item.content;
    if (content.type === 'mcq') {
      return { id: item.id, prompt: content.prompt, kind: 'mcq', options: content.options, left: [], right: [], answer: content.answer };
    }
    if (content.type === 'match_pairs') {
      return {
        id: item.id, prompt: content.prompt, kind: 'match_pairs', options: [],
        left: content.pairs.map((pair) => pair.left), right: content.pairs.map((pair) => pair.right),
        answer: content.pairs.map((pair) => `${pair.left} = ${pair.right}`).join(', '),
      };
    }
    if (content.type === 'short_answer') {
      return { id: item.id, prompt: content.prompt, kind: 'short_answer', options: [], left: [], right: [], answer: content.acceptedAnswers.join(', ') };
    }
    return { id: item.id, prompt: content.prompt, kind: 'flashcard', options: [], left: [], right: [], answer: content.answer };
  }
  if (item.type === 'mcq') return { id: item.id, prompt: item.prompt, kind: 'mcq', options: item.options, left: [], right: [], answer: null };
  if (item.type === 'match_pairs') return { id: item.id, prompt: item.prompt, kind: 'match_pairs', options: [], left: item.left, right: item.right, answer: null };
  if (item.type === 'flashcard') return { id: item.id, prompt: item.prompt, kind: 'flashcard', options: [], left: [], right: [], answer: null };
  return { id: item.id, prompt: item.prompt, kind: 'short_answer', options: [], left: [], right: [], answer: null };
}

export function scoreText(score: Assignment['score']): string {
  if (!score || score.status === 'not_started') return 'Not started';
  if (score.status === 'in_progress') return `${score.correct} correct, ${score.answered} of ${score.total} answered`;
  if (score.status === 'pending_review') return `${score.correct} correct of ${score.total}. Waiting for your teacher.`;
  return `${score.correct} of ${score.total} correct`;
}

/** Student-facing status. Teachers and parents keep the counts in scoreText. */
export function studentScore(score: Assignment['score']): string {
  if (!score || score.status === 'not_started') return 'Not started.';
  if (score.status === 'pending_review') return 'Waiting for your teacher.';
  if (score.status === 'in_progress') return 'Keep going.';
  if (score.total > 0 && score.correct === score.total) return 'Top form on this work.';
  if (score.correct > 0) return 'Almost there.';
  return "Let's fix this.";
}

export function formatDue(ms: number): string {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms));
}

export function dueInput(ms: number): string {
  const date = new Date(ms);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function dueMillis(value: string): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  if (!Number.isSafeInteger(ms) || ms < 0) return null;
  return ms;
}

export function dueNow(items: readonly Assignment[], now = Date.now()): Assignment[] {
  const today = new Date(now);
  return items.filter((item) => {
    const open = !item.score || item.score.status !== 'completed';
    const due = new Date(item.dueAt);
    const sameDay = due.getFullYear() === today.getFullYear() && due.getMonth() === today.getMonth() && due.getDate() === today.getDate();
    return open && (item.dueAt <= now || sameDay);
  }).sort((a, b) => a.dueAt - b.dueAt || a.title.localeCompare(b.title));
}

export function answerText(answer: string | readonly string[]): string {
  return typeof answer === 'string' ? answer : answer.join(', ');
}
