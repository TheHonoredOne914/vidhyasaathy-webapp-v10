import { StudentHomeSchema } from '@vidhyasaathy/contracts';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiClientError, getJson } from '../api/client';
import { useSession } from '../session';
import { useRemote } from '../setup/useRemote';
import { usePageMeta } from '../meta';
import { Saathy } from '../student/notebook/Saathy';
import { Card, PageHead, Sticky, SubjectIcon } from '../student/notebook/ui';
import { answerQuickTry, confirmSnap, getThread, relativeDay, SavedSchema, snapDoubt, streamAsk, ThreadsSchema, type AskMessage, type AskRequest, type AskThread, type QuickTry, type QuickTryResult } from '../student/ask/askApi';
import '../student/notebook/pages/ask.css';

// Chats and saved explanations must never enter the offline/localStorage cache.
function usePrivateList<T>(path: string, schema: Parameters<typeof getJson<T>>[1]) {
  const { me } = useSession();
  const owner = me?.profile.id;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(false); setData(null);
    void getJson(path, schema, controller.signal).then((next) => { if (!controller.signal.aborted) setData(next); }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(!(cause instanceof ApiClientError && cause.status === 404));
    });
    return () => controller.abort();
  }, [path, schema, attempt, owner]);
  return { data, error, reload: () => setAttempt((value) => value + 1) };
}

function QuickQuestion({ item, threadId }: { item: QuickTry; threadId: string }) {
  const [selected, setSelected] = useState(item.answered?.optionId ?? '');
  const [result, setResult] = useState<QuickTryResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const eventId = useRef(crypto.randomUUID());
  const busy = useRef(false);
  async function answer(optionId: string) {
    if (busy.current || result || item.answered) return;
    busy.current = true; setPending(true); setSelected(optionId); setError(false);
    try { setResult(await answerQuickTry(item.itemId, { clientEventId: eventId.current, threadId, optionId })); }
    catch { setError(true); }
    finally { busy.current = false; setPending(false); }
  }
  return <><div className="nb-q__label"><span className="nb-label">Quick try</span></div><div>{item.stem}</div>
    <div className="mini-q">{item.options.map((option) => {
      const right = result ? result.correctOptionId === option.id : item.answered?.optionId === option.id && item.answered.correct;
      const wrong = selected === option.id && (result ? !result.correct : item.answered?.correct === false);
      return <button type="button" className={`nb-opt${right ? ' is-right' : wrong ? ' is-wrong' : selected === option.id ? ' is-picked' : ''}`} key={option.id} disabled={pending || !!result || !!item.answered || (error && selected !== option.id)} onClick={() => { void answer(option.id); }}>{option.text}</button>;
    })}</div>{result ? <p role="status">{result.explanation}</p> : null}
    {error ? <p className="nb-note">Your answer has not been confirmed. <button className="nb-btn nb-btn--ghost nb-btn--sm" onClick={() => { void answer(selected); }}>Retry</button></p> : null}</>;
}

const errors: Record<string, string> = {
  provider_down: "I can't reach my notes right now. Try again in a minute.", timeout: "I can't reach my notes right now. Try again in a minute.",
  budget: "That's enough questions for today. Your teacher can help, or try again tomorrow.", rate_limit: 'Slow down a little, then ask again.',
};

export function AskPanel() {
  const [params] = useSearchParams();
  const { me } = useSession();
  const home = useRemote('/student/home', StudentHomeSchema);
  const recent = usePrivateList('/ask/threads?limit=20', ThreadsSchema);
  const saved = usePrivateList('/ask/saved?limit=10', SavedSchema);
  const [thread, setThread] = useState<AskThread | null>(null);
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [allRecent, setAllRecent] = useState(false);
  const emptyMessage = (text: string): AskMessage => ({ id: crypto.randomUUID(), role: 'saathy' as const, text, createdAt: new Date().toISOString(), citations: [], flags: undefined, quickTry: undefined, followups: undefined });
  const [text, setText] = useState(params.get('q') ?? '');
  const homework = params.get('from') === 'homework' || params.get('mode') === 'homework' || !!params.get('assignmentItemId') || !!params.get('item');
  const [style, setStyle] = useState<'hints' | 'explain'>('hints');
  const [pending, setPending] = useState(false);
  const [retry, setRetry] = useState<AskRequest | null>(null);
  const [snapId, setSnapId] = useState<string>();
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  usePageMeta('Ask Saathy — VidhyaSaathy', "Hints first. You do the thinking, I'll keep you on track.");
  async function open(id: string) {
    if (busy.current) return;
    busy.current = true; setPending(true); setRetry(null);
    const abort = new AbortController(); controller.current = abort;
    try { const next = await getThread(id, abort.signal); setThread(next); setMessages(next.messages); setStyle(next.style); }
    catch { if (!abort.signal.aborted) setMessages((rows) => [...rows, emptyMessage('I couldn’t open that doubt. Try again in a minute.')]); }
    finally { busy.current = false; setPending(false); }
  }
  async function send(value = text, followupKind?: AskRequest['followupKind'], previous?: AskRequest) {
    if (busy.current || !value.trim() || value.trim().length > 800) return;
    busy.current = true; setPending(true); setRetry(null);
    const abort = new AbortController(); controller.current = abort;
    const baseRequest: AskRequest = {
      clientEventId: crypto.randomUUID(), text: value.trim(), style: homework || thread?.mode === 'homework' ? 'hints' : style,
      mode: homework || thread?.mode === 'homework' ? 'homework' : 'learn', conceptId: thread?.concept?.id ?? params.get('conceptId') ?? (params.has('chapterId') ? undefined : home.data?.nextAction?.conceptId ?? home.data?.warmup?.conceptId ?? home.data?.learningPath?.nodes[0]?.conceptId),
      chapterId: params.get('chapterId') ?? undefined, assignmentItemId: params.get('assignmentItemId') ?? params.get('item') ?? undefined, snapId, followupKind,
      from: { kind: homework ? 'homework' : params.get('from') === 'practice' ? 'practice' : params.get('from') === 'lesson' ? 'lesson' : params.get('from') === 'session' ? 'session' : 'home', ref: params.get('ref') ?? params.get('assignmentItemId') ?? params.get('item') ?? undefined, label: params.get('label') ?? undefined },
    };
    const request: AskRequest = previous ?? (thread?.id ? { ...baseRequest, threadId: thread.id } : baseRequest);
    const replyId = crypto.randomUUID();
    setMessages((rows) => [...rows.filter((row) => row.id !== 'ask-error'), ...(previous ? [] : [{ ...emptyMessage(request.text), role: 'student' as const }]), { ...emptyMessage(''), id: replyId }]);
    setText('');
    function update(change: Partial<AskMessage> | ((row: AskMessage) => Partial<AskMessage>)) {
      setMessages((rows) => rows.map((row) => row.id === replyId ? { ...row, ...(typeof change === 'function' ? change(row) : change) } : row));
    }
    function fail(code: string) { update({ id: 'ask-error', text: errors[code] ?? 'Please check your question and try again.', citations: [], quickTry: undefined, followups: [] }); if (['provider_down', 'timeout'].includes(code)) setRetry(request); }
    try {
      if (request.snapId) await confirmSnap(request.snapId, request.text, abort.signal);
      await streamAsk(request, (event) => {
        switch (event.type) {
... (+43 lines) [see remaining: rtk proxy git show 'rebuild-local:apps/web/src/ai/AskPanel.tsx' | tail -n +110]
