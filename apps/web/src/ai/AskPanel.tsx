import { StudentHomeSchema } from '@vidhyasaathy/contracts';
import { BookOpen, Camera, Lightbulb, ListChecks, Map, PenLine, Sparkles, StickyNote } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiClientError, getJson } from '../api/client';
import { useSession } from '../session';
import { useRemote } from '../setup/useRemote';
import { usePageMeta } from '../meta';
import { Saathy } from '../student/notebook/Saathy';
import { Card, PageHead, SubjectIcon } from '../student/notebook/ui';
import { answerQuickTry, confirmSnap, getThread, relativeDay, SavedSchema, snapDoubt, streamAsk, ThreadsSchema, type AskMessage, type AskRequest, type AskThread, type QuickTry, type QuickTryResult } from '../student/ask/askApi';
import '../student/notebook/pages/ask.css';
import './ask-v2.css';

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

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const today = () => new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

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
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  usePageMeta('Ask Saathy — VidhyaSaathy', "Hints first. You do the thinking, I'll keep you on track.");
  // keep the newest turn in view while Saathy streams (only once a thread exists)
  useEffect(() => { if (messages.length || thread) bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages.length, pending, thread?.id]);
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
          case 'thread': setThread({ id: event.data.threadId, title: event.data.title, concept: event.data.concept, style: request.style, mode: request.mode, purged: false, messages: [] }); setMessages((rows) => rows.map((row) => row.role === 'student' && row.id === rows.at(-2)?.id ? { ...row, id: event.data.studentMessageId, fromLabel: event.data.fromLabel } : row)); break;
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
  const currentPath = params.has('chapterId') ? null : home.data?.learningPath;
  const contextId = params.get('conceptId') ?? home.data?.nextAction?.conceptId ?? home.data?.warmup?.conceptId ?? currentPath?.nodes[0]?.conceptId;
  const currentTopic = currentPath?.nodes.find((node) => node.conceptId === contextId);
  const topicName = thread?.concept?.name ?? currentTopic?.name ?? currentPath?.chapter ?? 'my chapter';
  const streamingId = pending ? last?.id : undefined;
  const prefill = (value: string) => { setText(value); input.current?.focus(); };
  const chipSend = (value: string) => { void send(value); };
  const fresh = !messages.length && !thread;
  return <div className="nb-grid pg-ask ask-v2">
    <section className="chat av2-chat" aria-label="Ask Saathy chat">
      <div className="av2-head">
        <span className="av2-head__mascot"><Saathy mood={pending ? 'think' : 'happy'} size="2.6rem" label="" /></span>
        <PageHead title="Ask Saathy" sub="Hints first. You do the thinking, I'll keep you on track." />
        <div className="av2-mode" role="tablist" aria-label="Answer style">
          <button type="button" role="tab" aria-selected={(locked ? 'hints' : style) === 'hints'} className={`av2-mode__btn${(locked ? 'hints' : style) === 'hints' ? ' is-on' : ''}`} disabled={pending || !!locked} onClick={() => setStyle('hints')}><Lightbulb className="i" />Hints mode</button>
          <button type="button" role="tab" aria-selected={(locked ? 'hints' : style) === 'explain'} className={`av2-mode__btn${(locked ? 'hints' : style) === 'explain' ? ' is-on' : ''}`} disabled={pending || !!locked} onClick={() => setStyle('explain')}>Explain fully</button>
        </div>
      </div>

      <div className="thread av2-thread" aria-live="polite">
        {fresh ? <div className="av2-hero">
          <p className="av2-hero__kicker">Ask Saathy · Today · {today()}</p>
          <Saathy mood="happy" size="7rem" label="Saathy, your learning companion" />
          <h2 className="av2-hero__title">{greeting()}, {me?.profile.name ?? 'there'} — ready when you are ☁</h2>
          <p className="av2-hero__sub">{currentTopic ? `I've read ${currentTopic.name} properly — every section. Ask me anything from it, or start below. Pehle main check kar lungi tum kahan ho, phir waise hi samjhaungi.` : 'Jo poochna hai poochho — I first see where you stand, then teach it your way. Hints pehle, poori answer baad me.'}</p>
          <div className="av2-hero__chips">
            {currentPath ? <span className="av2-chip">{currentPath.subject} · {currentPath.chapter}</span> : null}
            <span className="av2-chip">trained on your books</span>
            <span className="av2-chip">Saathy v.1</span>
          </div>
          <div className="av2-cards">
            {([
              { label: 'Samjha do', desc: 'step by step, your book, your pace', Icon: BookOpen, act: () => chipSend(`Help me understand ${topicName}`) },
              { label: 'Yeh solve karo', desc: 'guided — no copy-paste answers', Icon: PenLine, act: () => prefill('Solve this: ') },
              { label: 'Test me', desc: 'quick questions at my level', Icon: ListChecks, act: () => chipSend(`Give me one quick practice question on ${topicName}`) },
              { label: 'Notebook snap', desc: 'photo likho, main padh lungi', Icon: Camera, act: () => file.current?.click() },
              { label: 'Seedha point me', desc: '5 short revise points', Icon: StickyNote, act: () => chipSend(`Summarise ${topicName} in 5 short points I can revise`) },
              { label: 'Meri position', desc: 'what to revise, what is strong', Icon: Map, act: () => chipSend('What are my weakest topics right now, and what should I revise first?') },
            ] as const).map((card, i) => <button type="button" key={card.label} className="av2-card" style={{ animationDelay: `${i * 70}ms` }} onClick={card.act}>
              <span className="av2-card__icon"><card.Icon className="i" /></span>
              <span className="av2-card__t">{card.label}</span>
              <span className="av2-card__d">{card.desc}</span>
            </button>)}
          </div>
          <div className="av2-how">
            <p className="av2-how__who"><Sparkles className="i" />How Saathy works</p>
            <ol>
              <li><b>Ask anything</b> from your books — main pehle level check karungi, phir exactly usi depth pe samjhaungi.</li>
              <li><b>Ek baar ek hint</b> — hints mode me poori answer nahi, sirf agla step. Sochna tumhe hi hai.</li>
              <li><b>Notebook snap</b> — photo bhejo, main padh kar doubt nikaal dungi.</li>
              <li>Your chats stay private. Teachers and parents only see which topics you asked about.</li>
            </ol>
          </div>
        </div> : null}
        {!messages.length && thread?.purged ? <div className="msg"><Saathy mood="sleep" size="3rem" /><div><div className="meta">Saathy</div><div className="b">This chat has been cleared for your privacy. You can ask about this topic again.</div></div></div> : null}
        {messages.map((row) => {
          const isSaathy = row.role === 'saathy';
          const isError = row.id === 'ask-error';
          const mood = isError ? 'oops' : row.id === streamingId ? 'think' : 'happy';
          return <div className={`msg av2-msg${row.role === 'student' ? ' me' : ''}`} key={row.id}>
            {isSaathy ? <Saathy mood={mood} size="3rem" /> : null}
            <div>
              <div className="meta">{isSaathy ? 'Saathy' : `You · ${new Date(row.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}${row.fromLabel ? ` · ${row.fromLabel}` : ''}`}</div>
              <div className="b"><span className="ask-copy">{row.text || (row.id === streamingId ? 'Saathy is thinking…' : '')}</span>{row.citations.map((citation) => <div className="nb-meta" key={citation.chunkId}>{citation.noteTitle}{citation.page !== undefined ? ` · p. ${citation.page}` : ''}</div>)}{row.quickTry && thread ? <QuickQuestion key={row.quickTry.itemId} item={row.quickTry} threadId={thread.id} /> : null}{isError && retry ? <button className="nb-btn nb-btn--ghost nb-btn--sm" disabled={pending} onClick={() => { void send(retry.text, undefined, retry); }}>Retry</button> : null}</div>
            </div>
            {row.role === 'student' ? <span className="nb-avatar">{me?.profile.name?.slice(0, 1)}</span> : null}
          </div>;
        })}
        <div ref={bottom} />
      </div>

      <div className="ask-suggestions">{!messages.length && !thread && currentTopic ? <button className="nb-chip nb-chip--sky" disabled={pending} onClick={() => { void send(`Help me understand ${currentTopic.name}`); }}>{currentTopic.name}</button> : null}{last?.followups?.filter((chip) => chip.kind !== 'ask_teacher').map((chip) => <button className="nb-chip nb-chip--sky" key={chip.kind} disabled={pending} onClick={() => { if (chip.kind !== 'ask_teacher') void send(chip.label, chip.kind); }}>{chip.label}</button>)}</div>

      <form className="composer av2-composer" onSubmit={(event) => { event.preventDefault(); void send(); }}>
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={(event) => { const photo = event.target.files?.[0]; if (photo) void upload(photo); event.target.value = ''; }} />
        <div className="av2-composer__tools">
          <button type="button" className="av2-tool" aria-label="Snap your notebook" disabled={pending} onClick={() => file.current?.click()}><Camera className="i" /></button>
          <span className={`av2-tool av2-hint${(locked ? 'hints' : style) === 'hints' ? ' is-on' : ''}`} title="Hints mode: sirf agla step, poori answer nahi"><Lightbulb className="i" />Hints</span>
        </div>
        <textarea ref={input} className="av2-input" aria-label="Your doubt" rows={2} maxLength={800} placeholder="Ask Saathy anything… (Enter to send, Shift+Enter for a new line)" value={text} disabled={pending} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} />
        <button type="submit" className="av2-send" aria-label="Send" disabled={pending || !text.trim()}>
          <svg className="i" viewBox="0 0 24 24" aria-hidden><path d="M12 19V5M6 11l6-6 6 6" /></svg>
        </button>
        <p className="av2-note">Saathy answers from your class books &amp; teacher&apos;s notes — always double-check important steps. ☁</p>
      </form>
    </section>

    <aside className="nb-col av2-rail">
      <div className="av2-id">
        <Saathy mood="happy" size="4.2rem" label="" />
        <p className="av2-id__name">Saathy</p>
        <p className="av2-id__role">VidhyaSaathy&apos;s AI Tutor</p>
        <p className="av2-id__tag">Ask. Learn. Grow.</p>
        <p className="av2-id__about">Trained on your school books and teacher notes to give accurate, context-aware answers — at exactly your depth.</p>
      </div>
      <Card title="Model information" tape>
        <dl className="av2-facts">
          <div><dt>Model name</dt><dd>Saathy v.1</dd></div>
          <div><dt>Trained on</dt><dd>Your books + NCERT</dd></div>
          <div><dt>Answer style</dt><dd>Hints first, honesty always</dd></div>
          <div><dt>Subjects</dt><dd>Maths · Science · SST</dd></div>
        </dl>
      </Card>
      <Card title="Key features">
        <ul className="av2-features">
          <li><b>Level-first teaching</b> — checks your depth, then teaches at it</li>
          <li><b>Context aware</b> — knows your class, chapter and current topic</li>
          <li><b>One hint at a time</b> — you finish the step, no copy-paste</li>
          <li><b>Safe &amp; honest</b> — school-appropriate, admits what it doesn&apos;t know</li>
        </ul>
      </Card>
      <Card title="Recent doubts" meta={<button type="button" className="nb-link" aria-expanded={allRecent} onClick={() => setAllRecent((value) => !value)}>{allRecent ? 'Recent' : 'All'}</button>}>{recent.data?.threads.length ? recent.data.threads.slice(0, allRecent ? 20 : 3).map((row) => <button className="doubt" key={row.id} disabled={pending} onClick={() => { void open(row.id); }}><b>{row.title}</b><span className="nb-meta">{row.subjectName} · {relativeDay(row.updatedAt)}</span></button>) : <p className="nb-note">Your recent doubts will appear here.</p>}{recent.error ? <button className="nb-btn nb-btn--ghost nb-btn--sm" onClick={recent.reload}>Retry</button> : null}</Card>
      <Card title="Talking about">{thread?.concept ? <div className="nb-row ask-context"><SubjectIcon subject={thread.concept.subjectName} /><div><div className="nb-row__t">{thread.concept.name}</div><div className="nb-row__s">{thread.concept.subjectName} · {thread.concept.chapterLabel}</div></div></div> : currentTopic && currentPath ? <div className="nb-row ask-context"><SubjectIcon subject={currentPath.subject} /><div><div className="nb-row__t">{currentTopic.name}</div><div className="nb-row__s">{currentPath.subject} · {currentPath.chapter}</div></div></div> : <p className="nb-note">Your current topic will appear here.</p>}</Card>
      <Card title="Saved explanations" meta={saved.data ? String(saved.data.items.length) : undefined} grow>{saved.data?.items.length ? saved.data.items.map((row) => <div className="doubt" key={row.id}><b>{row.title}</b><span className="nb-meta">{row.subjectName} · saved {relativeDay(row.savedAt)}</span></div>) : <p className="nb-note">No saved explanations here yet.</p>}{saved.error ? <button className="nb-btn nb-btn--ghost nb-btn--sm" onClick={saved.reload}>Retry</button> : null}</Card>
      <div className="av2-honest">
        <p className="av2-honest__who"><Sparkles className="i" />Only from your books</p>
        <p>Saathy answers from your class books and your teacher&apos;s notes — aur jab kuch pata na ho, seedha bol deta hai.</p>
      </div>
    </aside>
  </div>;
}
