import { BankItemSchema, SaveItemSchema, type SaveItem } from '@vidhyasaathy/contracts';
import { type FormEvent, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { postJson, putJson } from '../api/client';
import { audienceFrom } from '../content/audience';
import { ConceptListSchema } from '../content/schemas';
import { usePageMeta } from '../meta';
import { useMutation } from '../setup/useMutation';
import { useRemote } from '../setup/useRemote';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { Field, fieldClass } from '../ui/Field';
import { SelectField } from '../ui/SelectField';
import { Skeleton } from '../ui/Skeleton';
import { AccessDenied } from '../routes/AccessDenied';
import { LessonFrame } from '../routes/content/LessonFrame';
import { BankListSchema } from './schemas';

export function QuestionBankPage() {
  const { pathname } = useLocation();
  const { chapterId = '' } = useParams();
  const audience = audienceFrom(pathname);
  const concepts = useRemote(chapterId ? `/chapters/${chapterId}/concepts` : null, ConceptListSchema);
  const bank = useRemote(chapterId ? `/chapters/${chapterId}/items` : null, BankListSchema);
  const form = useMutation();
  const [kind, setKind] = useState<SaveItem['type']>('mcq');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Pick<SaveItem, 'difficulty' | 'sourceRef'>>({ difficulty: 1, sourceRef: null });
  const [conceptId, setConceptId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [pairs, setPairs] = useState([{ left: '', right: '' }, { left: '', right: '' }]);
  const [answer, setAnswer] = useState('');
  const [accepted, setAccepted] = useState('');
  const [gate, setGate] = useState<string | null>(null);
  usePageMeta('Question bank — VidhyaSaathy', 'Questions for this chapter that can be added to homework or a quiz.');

  if (concepts.denied || bank.denied) return <AccessDenied />;
  if ((concepts.status === 'loading' && !concepts.data) || (bank.status === 'loading' && !bank.data)) {
    return <LessonFrame kicker="Question bank" title="Questions"><Skeleton /></LessonFrame>;
  }
  if (!concepts.data || !bank.data) {
    const failed = concepts.status === 'error' ? concepts : bank;
    return <ErrorState title="Could not load the question bank" message={failed.message ?? 'Try again.'} onRetry={() => { concepts.reload(); bank.reload(); }} />;
  }

  const conceptOptions = concepts.data.map((concept) => ({ value: concept.id, label: concept.title }));

  function reset() {
    setEditingId(null);
    setMetadata({ difficulty: 1, sourceRef: null });
    setPrompt('');
    setOptions(['', '']);
    setPairs([{ left: '', right: '' }, { left: '', right: '' }]);
    setAnswer('');
    setAccepted('');
    setGate(null);
  }

  function edit(id: string, item: SaveItem) {
    reset();
    setEditingId(id);
    setMetadata({ difficulty: item.difficulty, sourceRef: item.sourceRef });
    setKind(item.type);
    setConceptId(item.conceptId);
    setPrompt(item.prompt);
    if (item.type === 'mcq') { setOptions(item.options); setAnswer(item.answer); }
    if (item.type === 'match_pairs') setPairs(item.pairs);
    if (item.type === 'short_answer') setAccepted(item.acceptedAnswers.join('\n'));
    if (item.type === 'flashcard') setAccepted(item.answer);
  }

  async function addQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!conceptId) {
      setGate('Choose a concept.');
      return;
    }
    if (kind === 'mcq' && (options.some((option) => !option.trim()) || !answer)) {
      setGate('Enter each option and choose the correct one.');
      return;
    }
    if ((kind === 'short_answer' || kind === 'flashcard') && !accepted.trim()) {
      setGate('Enter an accepted answer.');
      return;
    }
    setGate(null);
    const base = { conceptId, prompt, ...metadata };
    const content = kind === 'mcq' ? { ...base, type: kind, options, answer }
      : kind === 'match_pairs' ? { ...base, type: kind, pairs }
      : kind === 'flashcard' ? { ...base, type: kind, answer: accepted }
      : { ...base, type: kind, acceptedAnswers: accepted.split('\n').map((value) => value.trim()).filter(Boolean) };
    const saved = await form.submit(SaveItemSchema, content, async (data) => {
        if (editingId) await putJson(`/items/${editingId}`, BankItemSchema, data);
        else await postJson(`/chapters/${chapterId}/items`, BankItemSchema, data);
    });
    if (!saved) return;
    reset();
    bank.reload();
  }

  return (
    <LessonFrame kicker="Question bank" title="Questions" script="One concept per question." stale={bank}>
      <p className="lesson-actions"><Link to={`/${audience}/chapters/${chapterId}`}>Back to the chapter</Link></p>
      <div className="lesson-card">
        <h2>In the bank</h2>
        {bank.data.length === 0 ? <p>No question in this chapter yet.</p> : (
          <ul className="lesson-list" aria-label="Questions">
              {bank.data.map((item) => <li key={item.id}><span>{item.content.prompt}</span><Button onClick={() => { edit(item.id, item.content); }} aria-label={`Edit ${item.content.prompt}`}>Edit</Button></li>)}
          </ul>
        )}
      </div>
      {concepts.data.length === 0 ? <p>Add a concept on the chapter page before you write a question.</p> : (
        <form className="grid gap-4" noValidate aria-busy={form.pending} onSubmit={(event) => { void addQuestion(event); }}>
            <h2>{editingId ? 'Edit question' : 'Add a question'}</h2>
          <fieldset className="grid gap-1">
            <legend className="font-semibold">Question type</legend>
            <label className="lesson-check"><input type="radio" name="question-type" checked={kind === 'mcq'} onChange={() => { setKind('mcq'); }} /> Multiple choice</label>
            <label className="lesson-check"><input type="radio" name="question-type" checked={kind === 'short_answer'} onChange={() => { setKind('short_answer'); }} /> Short answer</label>
              <label className="lesson-check"><input type="radio" name="question-type" checked={kind === 'match_pairs'} onChange={() => { setKind('match_pairs'); }} /> Match pairs</label>
              <label className="lesson-check"><input type="radio" name="question-type" checked={kind === 'flashcard'} onChange={() => { setKind('flashcard'); }} /> Flashcard</label>
          </fieldset>
          <SelectField id="bank-concept" label="Concept" name="conceptId" value={conceptId} onChange={setConceptId} error={form.errorFor('conceptId')} placeholder="Choose a concept" options={conceptOptions} />
          <Field id="bank-prompt" label="Question" name="prompt" type="text" value={prompt} onChange={setPrompt} error={form.errorFor('prompt')} hint={null} autoComplete="off" maxLength={160} />
          {kind === 'mcq' ? (
            <>
                {options.map((option, index) => <Field key={index} id={`bank-option-${index}`} label={`Option ${index + 1}`} name={`options.${index}`} type="text" value={option} onChange={(value) => { setOptions((current) => current.map((entry, at) => at === index ? value : entry)); setAnswer(''); }} error={form.errorFor('options')} hint={null} autoComplete="off" maxLength={1000} />)}
                {options.length < 8 ? <Button onClick={() => { setOptions((current) => [...current, '']); }}>Add option</Button> : null}
                <SelectField id="bank-answer" label="Correct answer" name="answer" value={answer} onChange={setAnswer} error={form.errorFor('answer')} placeholder="Choose the correct option" options={options.filter((option) => option.trim()).map((option) => ({ value: option, label: option }))} />
            </>
            ) : kind === 'match_pairs' ? (
              <>
                {pairs.map((pair, index) => <div key={index} className="grid gap-3 sm:grid-cols-2">
                  {(['left', 'right'] as const).map((side) => <Field key={side} id={`bank-pair-${index}-${side}`} label={`Pair ${index + 1} ${side}`} name={`pairs.${index}.${side}`} type="text" value={pair[side]} onChange={(value) => { setPairs((current) => current.map((entry, at) => at === index ? { ...entry, [side]: value } : entry)); }} error={side === 'left' ? form.errorFor('pairs') : null} hint={null} autoComplete="off" maxLength={1000} />)}
                </div>)}
                {pairs.length < 12 ? <Button onClick={() => { setPairs((current) => [...current, { left: '', right: '' }]); }}>Add pair</Button> : null}
              </>
            ) : kind === 'short_answer' ? (
              <label className="grid gap-1" htmlFor="bank-accepted">Accepted answer
                <textarea id="bank-accepted" className={fieldClass} value={accepted} onChange={(event) => { setAccepted(event.target.value); }} aria-describedby="accepted-hint" />
                <span id="accepted-hint">One accepted answer per line.</span>
                {form.errorFor('acceptedAnswers') ? <span role="alert">{form.errorFor('acceptedAnswers')}</span> : null}
              </label>
            ) : (
            <Field id="bank-accepted" label="Accepted answer" name="answer" type="text" value={accepted} onChange={setAccepted} error={form.errorFor('answer')} hint={null} autoComplete="off" maxLength={1000} />
          )}
          {gate ? <p role="alert">{gate}</p> : null}
          {form.formError ? <p role="alert">{form.formError}</p> : null}
            <Button type="submit" disabled={form.pending}>{form.pending ? 'Saving question' : editingId ? 'Save question' : 'Add question'}</Button>
            {editingId ? <Button onClick={reset}>Cancel edit</Button> : null}
        </form>
      )}
    </LessonFrame>
  );
}
