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
    const baseRequest = {
      clientEventId: crypto.randomUUID(), text: value.trim(), style: homework || thread?.mode === 'homework' ? 'hints' : style,
      mode: homework || thread?.mode === 'homework' ? 'homework' : 'learn', conceptId: thread?.concept?.id ?? params.get('conceptId') ?? undefined,
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
          case 'thread': setThread({ id: event.data.threadId, title: event.data.title, concept: event.data.concept, style: request.style, mode: request.mode, purged: false, messages: [] }); request.threadId = event.data.threadId; setMessages((rows) => rows.map((row) => row.role === 'student' && row.id === rows.at(-2)?.id ? { ...row, id: event.data.studentMessageId, fromLabel: event.data.fromLabel } : row)); break;
          case 'token': update((row) => ({ text: row.text + event.data.text })); break;
          case 'citation': update((row) => ({ citations: [...row.citations, event.data] })); break;
          case 'quickTry': update({ quickTry: event.data }); break;
          case 'followups': update({ followups: event.data.chips }); break;
          case 'done': update({ id: event.data.messageId, text: event.data.text, flags: event.data.flags }); break;
          case 'error': fail(event.data.code); break;
        }
      }, abort.signal);
      recent.reload(); setSnapId(undefined);
    } catch (cause) { if (!abort.signal.aborted) fail(cause instanceof ApiClientError && cause.code in errors ? cause.code : 'provider_down'); }
    finally { busy.current = false; if (!abort.signal.aborted) setPending(false); }
  }
  async function upload(photo: File) {
    if (busy.current) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type) || photo.size > 4 * 1024 * 1024) { setMessages((rows) => [...rows, emptyMessage('Choose a JPG, PNG or WebP photo smaller than 4 MB.')]); return; }
    busy.current = true; setPending(true);
    const abort = new AbortController(); controller.current = abort;
    try {
      const result = await snapDoubt(photo, abort.signal);
      if (result.status === 'extracted') { setText(result.extractedText ?? ''); setSnapId(result.snapId); }
      else setMessages((rows) => [...rows, emptyMessage(result.status === 'not_configured' ? "I can't read photos yet. Type your doubt instead." : "I couldn't read that photo. Try again in better light, or type it.")]);
    } catch { if (!abort.signal.aborted) setMessages((rows) => [...rows, emptyMessage("I couldn't read that photo. Try again in better light, or type it.")]); }
    finally { busy.current = false; if (!abort.signal.aborted) setPending(false); }
  }
  const last = messages.filter((row) => row.role === 'saathy').at(-1);
  const locked = homework || thread?.mode === 'homework';
  return <div className="nb-grid pg-ask"><div className="chat">
    <div className="ask-head"><PageHead title="Ask Saathy" sub="Hints first. You do the thinking, I'll keep you on track." /><div className="nb-tabs" role="tablist">{(['hints', 'explain'] as const).map((id) => <button type="button" role="tab" aria-selected={(locked ? 'hints' : style) === id} className={`nb-tab${(locked ? 'hints' : style) === id ? ' is-active' : ''}`} key={id} disabled={pending || !!locked} onClick={() => setStyle(id)}>{id === 'hints' ? 'Hints mode' : 'Explain fully'}</button>)}</div></div>
    <div className="thread" aria-live="polite">{!messages.length ? <div className="msg"><Saathy mood="think" size="3rem" /><div><div className="meta">Saathy</div><div className="b">{thread?.purged ? 'This chat has been cleared for your privacy. You can ask about this topic again.' : `Hi${me?.profile.name ? ` ${me.profile.name}` : ''}! What are you thinking about?`}</div></div></div> : null}
      {messages.map((row) => <div className={`msg${row.role === 'student' ? ' me' : ''}`} key={row.id}>{row.role === 'saathy' ? <Saathy mood="think" size="3rem" /> : null}<div><div className="meta">{row.role === 'student' ? `You · ${new Date(row.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}${row.fromLabel ? ` · ${row.fromLabel}` : ''}` : 'Saathy'}</div><div className="b"><span className="ask-copy">{row.text || 'Saathy is thinking…'}</span>{row.citations.map((citation) => <div className="nb-meta" key={citation.chunkId}>{citation.noteTitle}{citation.page !== undefined ? ` · p. ${citation.page}` : ''}</div>)}{row.quickTry && thread ? <QuickQuestion key={row.quickTry.itemId} item={row.quickTry} threadId={thread.id} /> : null}{row.id === 'ask-error' && retry ? <button className="nb-btn nb-btn--ghost nb-btn--sm" disabled={pending} onClick={() => { void send(retry.text, undefined, retry); }}>Retry</button> : null}</div></div>{row.role === 'student' ? <span className="nb-avatar">{me?.profile.name?.slice(0, 1)}</span> : null}</div>)}
    </div>
    <div className="ask-suggestions">{last?.followups?.filter((chip) => chip.kind !== 'ask_teacher').map((chip) => <button className="nb-chip nb-chip--sky" key={chip.kind} disabled={pending} onClick={() => { if (chip.kind !== 'ask_teacher') void send(chip.label, chip.kind); }}>{chip.label}</button>)}</div>
    <form className="composer" onSubmit={(event) => { event.preventDefault(); void send(); }}><input ref={file} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={(event) => { const photo = event.target.files?.[0]; if (photo) void upload(photo); event.target.value = ''; }} /><button type="button" className="nb-btn nb-btn--quiet nb-btn--sm" aria-label="Snap your notebook" disabled={pending} onClick={() => file.current?.click()}><svg className="i" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7l2-3h4l2 3" /><circle cx="12" cy="13" r="3.5" /></svg></button><textarea className="nb-text" aria-label="Your doubt" rows={2} maxLength={800} placeholder="Ask a doubt, or snap your notebook…" value={text} disabled={pending} onChange={(event) => setText(event.target.value)} /><button className="nb-btn nb-btn--primary" disabled={pending || !text.trim()}><svg className="i" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6" /></svg> Send</button></form>
  </div><aside className="nb-col"><Card title="Recent doubts" meta={<a className="nb-link" href="#" onClick={(event) => event.preventDefault()}>All</a>}>{recent.data?.threads.length ? recent.data.threads.map((row) => <button className="doubt" key={row.id} disabled={pending} onClick={() => { void open(row.id); }}><b>{row.title}</b><span className="nb-meta">{row.subjectName} · {relativeDay(row.updatedAt)}</span></button>) : <p className="nb-note">Your recent doubts will appear here.</p>}{recent.error ? <button className="nb-btn nb-btn--ghost nb-btn--sm" onClick={recent.reload}>Retry</button> : null}</Card>
    <Card title="Talking about">{thread?.concept ? <div className="nb-row ask-context"><SubjectIcon subject={thread.concept.subjectName} /><div><div className="nb-row__t">{thread.concept.name}</div><div className="nb-row__s">{thread.concept.subjectName} · {thread.concept.chapterLabel}</div></div></div> : <p className="nb-note">{home.data ? 'Ask about the idea you are working on.' : 'Your current topic will appear here.'}</p>}</Card>
    <Sticky color="lilac" who="How Saathy helps">1. Asks what you already know<br />2. Gives one hint at a time<br />3. Lets you finish the step<br /><br />Your chats stay private. Teachers and parents only see which topics you asked about.</Sticky>
    <Card title="Saved explanations" meta={saved.data ? String(saved.data.items.length) : undefined} grow>{saved.data?.items.length ? saved.data.items.map((row) => <div className="doubt" key={row.id}><b>{row.title}</b><span className="nb-meta">{row.subjectName} · saved {relativeDay(row.savedAt)}</span></div>) : <p className="nb-note">No saved explanations here yet.</p>}{saved.error ? <button className="nb-btn nb-btn--ghost nb-btn--sm" onClick={saved.reload}>Retry</button> : null}</Card>
  </aside></div>;
}
