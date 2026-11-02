import type { LearningEvent, LearningModule } from '@vidhyasaathy/contracts';
import { AnswerSchema } from './adapter';

export function restoredPractice(module: LearningModule, events: LearningEvent[]) {
  const questions = module.questions ?? [];
  const latest = (questionId: string) => {
    const event = events.filter((row) => row.type === 'answer_submitted' && row.result?.moduleId === module.id && row.result?.questionId === questionId).at(-1);
    const parsed = AnswerSchema.safeParse(event?.result);
    return parsed.success ? parsed.data : null;
  };
  const firstUnfinished = questions.findIndex((question) => !latest(question.id)?.correct);
  const index = Math.max(0, firstUnfinished < 0 ? questions.length - 1 : firstUnfinished);
  return { index, result: questions[index] ? latest(questions[index].id) : null };
}
