import { AskResponseSchema, type AskResponse } from '@vidhyasaathy/contracts';
import { useRef, useState } from 'react';
import { ApiClientError, postJson } from '../../../../api/client';
import { Citation } from '../../../../ai/Citation';
import { Saathy } from '../../Saathy';
import { Card, NbButton } from '../../ui';
import '../../pages/lesson.css';

export function PageAsk({ chapterId, title, topic }: { chapterId: string; title: string; topic: string }) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);

  async function ask(text: string) {
    if (busy.current) return;
    if (text.trim().length < 2) { setError('Write a question first.'); return; }
    busy.current = true;
    setPending(true);
    setError(null);
    setResponse(null);
    setQuestion(text);
    try {
      setResponse(await postJson('/ask', AskResponseSchema, { chapterId, question: `${topic}: ${text}`.slice(0, 1000), hintLevel: 1, socratic: false }));
    } catch (cause) {
      setError(cause instanceof ApiClientError ? cause.message : 'Could not ask right now. Try again.');
    } finally { busy.current = false; setPending(false); }
  }

  return <Card grow>
    <div className="nb-saathy-tip"><Saathy mood="think" size="3.6rem" /><div><h3 className="nb-h3">{title}</h3><div className="nb-text">I'll explain it another way.</div></div></div>
    <div className="ls-actions"><button type="button" className="nb-chip nb-chip--sky" disabled={pending} onClick={() => { void ask('Explain it more simply.'); }}>Explain simpler</button><button type="button" className="nb-chip nb-chip--sky" disabled={pending} onClick={() => { void ask('Can you give another example?'); }}>Another example</button></div>
    <form className="ls-ask" onSubmit={(event) => { event.preventDefault(); void ask(question); }}>
      <label className="nb-meta">Type your doubt…<textarea className="nb-input nb-input--lined" rows={2} maxLength={800} value={question} disabled={pending} onChange={(event) => { setQuestion(event.target.value); }} /></label>
      <NbButton size="sm" type="submit" disabled={pending}>{pending ? 'Asking…' : 'Ask Saathy'}</NbButton>
    </form>
    {error ? <p role="alert" className="nb-text">{error}</p> : null}
    {response ? <div className="nb-text" role="status">{response.status === 'not_configured' ? 'Saathy is not connected yet. Your teacher’s notes are still available.' : response.message}{response.citations.map((citation) => <Citation key={`${citation.noteId}-${citation.locator}`} citation={citation} />)}</div> : null}
  </Card>;
}
