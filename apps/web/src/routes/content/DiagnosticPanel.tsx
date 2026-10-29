import { DiagnosticOfferSchema, DiagnosticResultSchema } from '@vidhyasaathy/contracts';
import { useState } from 'react';
import { postJson } from '../../api/client';
import { useRemote } from '../../setup/useRemote';
import { Button } from '../../ui/Button';
import { ConfidenceChips, type ConfidenceChoice } from '../../ui/ConfidenceChips';

export function DiagnosticPanel({ chapterId }: { chapterId: string }) {
  const offer = useRemote(`/chapters/${chapterId}/diagnostic`, DiagnosticOfferSchema);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<Record<string, ConfidenceChoice>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  if (message) return <div className="lesson-card"><h2>Earlier ideas</h2><p>{message}</p></div>;
  if (!offer.data?.offered) return null;
  const questions = offer.data.questions;

  async function submit() {
    if (questions.some((item) => item.type !== 'mcq' || !answers[item.id] || !confidence[item.id])) {
      setError("Answer each question, and choose Sure, Unsure, or Guess.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await postJson(`/chapters/${chapterId}/diagnostic`, DiagnosticResultSchema, {
        answers: questions.map((item) => ({ itemId: item.id, answer: answers[item.id], confidence: confidence[item.id] })),
      });
      setMessage(result.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this check.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="lesson-card">
      <h2>{offer.data.title}</h2>
      <p>These questions are from earlier classes. Haven&apos;t learned this yet is a fair answer.</p>
      {questions.map((item) => item.type === 'mcq' ? (
        <fieldset key={item.id} className="grid gap-3">
          <legend className="font-semibold">{item.prompt}</legend>
          {item.options.map((option) => (
            <label key={option} className="lesson-check">
              <input type="radio" name={`diag-${item.id}`} checked={answers[item.id] === option} onChange={() => { setAnswers((current) => ({ ...current, [item.id]: option })); }} />
              {option}
            </label>
          ))}
          <ConfidenceChips name={`diag-confidence-${item.id}`} value={confidence[item.id] ?? ''} onChange={(value) => { setConfidence((current) => ({ ...current, [item.id]: value })); }} />
        </fieldset>
      ) : null)}
      {error ? <p role="alert">{error}</p> : null}
      <Button type="button" disabled={pending} onClick={() => { void submit(); }}>{pending ? 'Saving' : 'Save this check'}</Button>
    </div>
  );
}
