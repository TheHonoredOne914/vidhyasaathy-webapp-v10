import type { GameRegistryEntry, LearningModule } from '@vidhyasaathy/contracts';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../session';
import { Saathy } from '../student/notebook/Saathy';
import { MasteryChip } from '../student/notebook/ui';
import { learningApi, rememberSession, safeGameRoute, sessionPath, type AnswerResult, type LearningSession, type LearningSummary } from '../proto/adapter';
import { MathText } from './SaathyArtifacts';
import '../proto/learning.css';
import './saathy-studio.css';

type Stage = 'Explore' | 'Learn' | 'Try' | 'Fix' | 'Play' | 'Master';
const STAGES: Stage[] = ['Explore', 'Learn', 'Try', 'Fix', 'Play', 'Master'];

// The same chapter shelf is available beside a learning step and inside chat.
// All content and evaluation come from the authenticated learning API.
export function LearningStudio({ chapterId, title, onClose }: { chapterId: string; title: string; onClose: () => void }) {
  const { me } = useSession();
  const dialog = useRef<HTMLDialogElement>(null);
  const [session, setSession] = useState<LearningSession | null>(null);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [games, setGames] = useState<GameRegistryEntry[]>([]);
  const [stage, setStage] = useState<Stage>('Explore');
  const [flow, setFlow] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [cards, setCards] = useState<LearningModule[]>([]);
  const [again, setAgain] = useState<LearningModule[]>([]);
  const [known, setKnown] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [summary, setSummary] = useState<LearningSummary | null>(null);
  const [game, setGame] = useState<GameRegistryEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const lock = useRef(false);
  const eventId = useRef(crypto.randomUUID());
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.showModal();
    return () => { if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  useEffect(() => {
    let active = true;
    setError('');
    void Promise.all([learningApi.modules(chapterId), learningApi.start(chapterId), learningApi.games()]).then(([bank, saved, registry]) => {
      if (!active) return;
      setModules(bank.modules); setCards(bank.modules.filter((item) => item.type === 'concept'));
      setSession(saved); setGames(registry.games.filter((item) => item.chapterId === chapterId && item.available && safeGameRoute(item.route)));
      if (me) rememberSession(me.profile.id, saved, title);
    }).catch(() => { if (active) setError('Could not open this chapter. Your saved learning is safe.'); });
    return () => { active = false; };
  }, [chapterId, attempt, me, title]);
  const ideas = modules.filter((item) => item.type === 'concept');
  const slides = modules.flatMap((item) => (item.slides ?? []).map((slide) => ({ ...slide, moduleId: item.id })));
  const questions = modules.filter((item) => item.type === 'practice').flatMap((module) => (module.questions ?? []).map((question) => ({ module, question })));
  const slide = slides[index];
  const card = cards[index];
  const current = questions[index];
  function change(next: Stage) { setStage(next); setIndex(0); setResult(null); setAnswer(''); setFlipped(false); setError(''); setGame(null); }
  async function evidence(moduleId: string, type: 'module_opened' | 'revision_requested') {
    if (!session) return;
    try { await learningApi.event(session.id, moduleId, type, crypto.randomUUID()); }
    catch { setError('This visit could not be saved. Please try again.'); }
  }
  useEffect(() => {
    if (stage === 'Learn' && slide && session) void evidence(slide.moduleId, 'module_opened');
  }, [stage, index, session?.id]);
  useEffect(() => {
    if (stage !== 'Master' || !session) return;
    let active = true;
    void learningApi.summary(session.id).then((value) => { if (active) setSummary(value); }).catch(() => { if (active) setError('Could not load your report. Reopen Master to retry.'); });
    return () => { active = false; };
  }, [stage, session?.id]);
  function move(delta: number) { setIndex((value) => Math.max(0, Math.min(slides.length - 1, value + delta))); }
  async function check() {
    if (!current || !session || lock.current || !answer) return;
    lock.current = true; setBusy(true); setError('');
    try { setResult(await learningApi.answer(session.id, current.module.id, current.question.id, answer, eventId.current)); }
    catch { setError('Your answer has not been confirmed. Retry to save the same attempt.'); }
    finally { lock.current = false; setBusy(false); }
  }
  function rateCard(revisit: boolean) {
    if (!card) return;
    void evidence(card.id, 'revision_requested');
    if (revisit) setAgain((rows) => [...rows, card]); else setKnown((value) => value + 1);
    setIndex((value) => value + 1); setFlipped(false);
  }
  return <dialog ref={dialog} className="saathy-studio proto-learning" aria-label={`${title} learning modules`} onCancel={onClose} onKeyDown={(event) => {
    if (stage !== 'Learn' || /INPUT|TEXTAREA|BUTTON/.test((event.target as HTMLElement).tagName)) return;
    if (event.key === 'ArrowRight' || event.key === ' ') { event.preventDefault(); move(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
  }}>
    <header className="studio-header"><button type="button" className="nb-btn nb-btn--ghost" onClick={onClose}>Exit learning modules</button><div><b>{title}</b><p className="nb-note">One idea at a time, at your pace.</p></div><Saathy size="3.4rem" mood={busy ? 'think' : 'happy'} /></header>
    <nav className="proto-phases" aria-label="Learning module stages">{STAGES.map((item) => <button type="button" className="nb-btn nb-btn--ghost" key={item} aria-current={stage === item ? 'step' : undefined} disabled={busy} onClick={() => change(item)}>{item}</button>)}</nav>
    <div className="studio-body" tabIndex={0}>
      {error ? <p role="alert">{error} {!session ? <button className="nb-btn" onClick={() => setAttempt((value) => value + 1)}>Retry opening chapter</button> : null}</p> : null}
      {!session ? <p role="status">Opening your chapter notebook…</p> : <>
        {stage === 'Explore' ? <><h2>How you’ll learn</h2><p>Explore the chapter, learn from slides, try a question, revisit cards, then play and reflect.</p><div className="proto-actions"><button className="nb-btn nb-btn--ghost" aria-pressed={!flow} onClick={() => setFlow(false)}>Concept map</button><button className="nb-btn nb-btn--ghost" aria-pressed={flow} onClick={() => setFlow(true)}>Chapter flow</button><Link className="nb-btn" to={sessionPath(session.id)} onClick={onClose}>Continue my saved plan</Link></div>{flow ? <ol className="studio-flow">{ideas.map((idea) => <li key={idea.id}><details><summary>{idea.objective}</summary><MathText text={idea.content} /></details></li>)}</ol> : <div className="studio-map"><strong>{title}</strong><div>{ideas.map((idea, i) => <button type="button" key={idea.id} className="nb-chip nb-chip--sky" onClick={() => { change('Learn'); setIndex(Math.max(0, slides.findIndex((item) => item.moduleId === idea.id))); }}><span>{i + 1}. {idea.objective}</span></button>)}</div></div>}<button className="nb-btn" onClick={() => change('Learn')}>Slides se seekho</button></> : null}
        {stage === 'Learn' ? slide ? <><article className="studio-paper" key={slide.id}><p className="nb-note">{slide.kicker}</p><h2>{slide.title}</h2><ul>{slide.bullets.map((line, i) => <li key={i}><MathText text={line} /></li>)}</ul>{slide.note ? <p className="nb-note">{slide.note}</p> : null}</article><p aria-live="polite">Slide {index + 1} of {slides.length}</p><div className="studio-dots">{slides.map((item, i) => <button key={item.id} aria-label={`Go to slide ${i + 1}`} aria-pressed={index === i} onClick={() => setIndex(i)}>{i + 1}</button>)}</div><div className="proto-actions"><button className="nb-btn nb-btn--ghost" disabled={index === 0} onClick={() => move(-1)}>Previous slide</button>{index < slides.length - 1 ? <button className="nb-btn" onClick={() => move(1)}>Next slide</button> : <button className="nb-btn" onClick={() => change('Try')}>Try the quiz</button>}</div></> : <p>No published slides for this chapter yet.</p> : null}
        {stage === 'Try' ? current ? <section className="studio-paper"><p>Question {index + 1} of {questions.length}</p><h2><MathText text={current.question.prompt} /></h2><form onSubmit={(event) => { event.preventDefault(); void check(); }}><fieldset disabled={busy || !!result}><legend>Your answer</legend>{current.question.options?.length ? current.question.options.map((option) => <label className="proto-choice" key={option}><input type="radio" name="studio-answer" checked={answer === option} onChange={() => { setAnswer(option); eventId.current = crypto.randomUUID(); }} /><MathText text={option} /></label>) : <input aria-label="Quiz answer" maxLength={2000} value={answer} onChange={(event) => { setAnswer(event.target.value); eventId.current = crypto.randomUUID(); }} />}<label className="proto-choice"><input type="radio" name="studio-answer" checked={answer === "Haven't learned this yet"} onChange={() => { setAnswer("Haven't learned this yet"); eventId.current = crypto.randomUUID(); }} />Haven't learned this yet</label></fieldset>{!result ? <button className="nb-btn" disabled={busy || !answer}>{busy ? 'Checking…' : 'Check answer'}</button> : null}</form>{result ? <><p role="status">{result.feedback} <MasteryChip level={result.word} /></p>{!result.correct ? <div className="proto-actions"><button className="nb-btn nb-btn--ghost" onClick={() => { setResult(null); setAnswer(''); eventId.current = crypto.randomUUID(); }}>Try again</button><button className="nb-btn nb-btn--ghost" onClick={() => change('Fix')}>Revisit flashcards</button></div> : null}<button className="nb-btn" onClick={() => { setIndex((value) => value + 1); setResult(null); setAnswer(''); eventId.current = crypto.randomUUID(); }}>Next question</button></> : null}</section> : <><h2>{questions.length ? 'Your practice is saved' : 'No published questions yet'}</h2><button className="nb-btn" onClick={() => change('Master')}>See my report</button><button className="nb-btn nb-btn--ghost" onClick={() => change('Try')}>Try the quiz again</button></> : null}
        {stage === 'Fix' ? card ? <><p>Card {index + 1} of {cards.length}</p><button className={`studio-paper studio-flash${flipped ? ' is-flipped' : ''}`} aria-label={flipped ? 'Show flashcard front' : 'Flip flashcard'} aria-pressed={flipped} onClick={() => setFlipped((value) => !value)}><span className="nb-label">{flipped ? 'Recall cue' : 'Can you explain this?'}</span><h2>{card.objective}</h2>{flipped ? <p><MathText text={card.content} /></p> : <p>Think first, then tap to turn the card.</p>}</button><div className="proto-actions"><button className="nb-btn nb-btn--ghost" disabled={!flipped} onClick={() => rateCard(true)}>Not yet</button><button className="nb-btn" disabled={!flipped} onClick={() => rateCard(false)}>Got it</button><button className="nb-btn nb-btn--ghost" onClick={() => { setCards((rows) => { const copy = [...rows]; for (let i = copy.length - 1; i > index; i--) { const j = index + Math.floor(Math.random() * (i - index + 1)); [copy[i], copy[j]] = [copy[j]!, copy[i]!]; } return copy; }); setFlipped(false); }}>Shuffle remaining cards</button></div></> : <><h2>Revision pouch</h2><p>{known} cards felt familiar. {again.length} ready for another look.</p>{again.length ? <button className="nb-btn" onClick={() => { setCards(again); setAgain([]); setIndex(0); setFlipped(false); }}>Revisit not-yet cards</button> : null}<button className="nb-btn nb-btn--ghost" onClick={() => { setCards(ideas); setAgain([]); setKnown(0); setIndex(0); }}>Restart deck</button><button className="nb-btn" onClick={() => change('Play')}>Explore games</button></> : null}
        {stage === 'Play' ? game ? <><button className="nb-btn" onClick={() => setGame(null)}>Back to games</button><iframe className="proto-game-frame" src={game.route} title={game.title} /></> : <><h2>Play with the idea</h2>{games.length ? games.map((item) => <article className="studio-paper" key={item.id}><h3>{item.title}</h3><p>{item.description}</p><button className="nb-btn" onClick={() => setGame(item)}>Play {item.title}</button></article>) : <p>No connected game is published for this chapter yet. Keep exploring your notebook.</p>}</> : null}
        {stage === 'Master' ? <><h2>Your learning, gathered together</h2>{summary ? <><p>{summary.attempted} answers saved · {summary.correct} correct · {summary.notTaught} not learned yet, with no penalty.</p>{summary.concepts.map((item) => <p key={item.conceptId}>{ideas.find((idea) => idea.conceptId === item.conceptId)?.objective ?? 'Chapter idea'} <MasteryChip level={item.word} /></p>)}<p className="nb-note">This report uses saved answer evidence. Flashcard self-reflection never changes your assessed progress.</p><Link className="nb-btn" to={sessionPath(session.id)} onClick={onClose}>Return to my learning plan</Link></> : <p role="status">Gathering your saved evidence…</p>}</> : null}
      </>}
    </div>
  </dialog>;
}
