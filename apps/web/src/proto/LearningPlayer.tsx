import { ChapterSchema, TeachingModeSchema, type GameRegistryEntry, type LearningModule, type TutorResponse } from '@vidhyasaathy/contracts';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from '../session';
import { useRemote } from '../setup/useRemote';
import { Card, MasteryChip, PageHead } from '../student/notebook/ui';
import { learningApi, rememberSession, safeGameRoute, sessionPath, type LearningSession, type LearningSummary } from './adapter';
import { ContextualSaathy } from './ContextualSaathy';
import { MODULE_LABELS, ModuleView, phaseFor } from './ModuleView';
import './learning.css';
import { planGameRoute } from './gameReturn';

export function LearningPlayer() {
  const { sessionId = '' } = useParams();
  return <SessionJourney key={sessionId} sessionId={sessionId} />;
}

function SessionJourney({ sessionId }: { sessionId: string }) {
  const { me } = useSession();
  const [params] = useSearchParams();
  const [session, setSession] = useState<LearningSession | null>(null);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [games, setGames] = useState<GameRegistryEntry[]>([]);
  const [summary, setSummary] = useState<LearningSummary | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [intro, setIntro] = useState(true);
  const [showPlan, setShowPlan] = useState(true);
  const [recommendation, setRecommendation] = useState<TutorResponse | null>(null);
  const completion = useRef<{ moduleId: string; step: number; id: string } | null>(null);
  const lock = useRef(false);
  const chapter = useRemote(session ? `/chapters/${session.chapterId}` : null, ChapterSchema);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    void learningApi.session(sessionId, controller.signal).then(async (next) => {
      const bank = await learningApi.modules(next.chapterId, controller.signal);
      if (controller.signal.aborted) return;
      setSession(next); setModules(bank.modules);
      if (next.plan.currentStep > 0 || next.events.some((event) => event.type === 'module_opened')) setIntro(false);
    }).catch(() => { if (!controller.signal.aborted) setError('Your learning session could not load. Please try again.'); });
    void learningApi.games(controller.signal).then((result) => { if (!controller.signal.aborted) setGames(result.games); }).catch(() => { /* Games do not block a learning session. */ });
    return () => controller.abort();
  }, [sessionId, attempt]);
  useEffect(() => { if (session && me) rememberSession(me.profile.id, session, chapter.data?.title); }, [session, me, chapter.data?.title]);
  useEffect(() => {
    if (session?.plan.status !== 'completed') return;
    const controller = new AbortController();
    void learningApi.summary(sessionId, controller.signal).then((result) => { if (!controller.signal.aborted) setSummary(result); }).catch(() => { if (!controller.signal.aborted) setError('The summary could not load. Retry to see your saved session evidence.'); });
    return () => controller.abort();
  }, [session?.plan.status, sessionId, attempt]);
  const module = modules.find((row) => row.id === session?.plan.steps[session.plan.currentStep]?.moduleId);
  useEffect(() => {
    if (!module || intro) return;
    setRecommendation(null);
    const id = crypto.randomUUID();
    void learningApi.event(sessionId, module.id, 'module_opened', id).catch(() => setError('Could not record this step opening. Your last saved position is safe.'));
  }, [module?.id, sessionId, intro]);
  async function complete() {
    if (!module || !session || lock.current) return;
    lock.current = true; setPending(true); setError('');
    if (completion.current?.moduleId !== module.id || completion.current.step !== session.plan.currentStep) completion.current = { moduleId: module.id, step: session.plan.currentStep, id: crypto.randomUUID() };
    try { setSession(await learningApi.event(sessionId, module.id, 'module_completed', completion.current.id)); }
    catch { setError('This step has not been confirmed. Retry Continue to save it safely.'); }
    finally { lock.current = false; setPending(false); }
  }
  async function refreshEvidence() {
    try { setSession(await learningApi.session(sessionId)); }
    catch { setError('The answer was saved, but the session could not refresh. You can retry loading it.'); }
  }
  const availableGames = games.filter((row) => row.available && row.chapterId === session?.chapterId && safeGameRoute(row.route));
  const currentGame = availableGames.find((row) => row.id === session?.plan.steps[session.plan.currentStep]?.activityId) ?? (module?.type === 'explorer' ? availableGames.find((row) => row.conceptIds.includes(module.conceptId)) ?? availableGames[0] : undefined);
  const phase = session?.plan.status === 'completed' ? 'Complete' : intro ? 'Intro' : module ? phaseFor(module.type) : 'Learn';
  const errorView = error ? <p role="alert">{error} <button className="nb-btn nb-btn--ghost" onClick={() => setAttempt((value) => value + 1)}>Reload saved session</button></p> : null;
  if (!session || !me) return <div className="proto-learning"><PageHead title="Your learning notebook" />{errorView ?? <p role="status">Opening your saved step…</p>}</div>;
  const repairId = session.events.filter((event) => event.type === 'answer_submitted' && event.result?.moduleId === module?.id).at(-1)?.result?.repairModuleId;
  const repair = modules.find((row) => row.id === repairId) ?? modules.find((row) => row.type === 'repair' && row.id.split(':topic:')[1]?.split(':')[0] === module?.id.split(':topic:')[1]?.split(':')[0]);
  const mode = TeachingModeSchema.safeParse(params.get('mode'));
  return <div className="proto-learning">
    <PageHead eyebrow="Learn with Saathy" title={chapter.data?.title ?? 'Your learning journey'} sub={module?.objective ?? 'Take a moment to recall what you learned.'} />
    <nav aria-label="Session stages" className="proto-phases">{['Intro', 'Learn', 'Explore', 'Practise', 'Review', 'Complete'].map((item) => <span className="proto-phase" key={item} aria-current={phase === item ? 'step' : undefined}>{item}</span>)}</nav>
    <div className="proto-actions"><Link className="nb-link" to="/student?panel=study">Study sessions</Link><Link className="nb-link" to={`/student/chapters/${session.chapterId}/learn`}>Chapter overview</Link><button className="nb-btn nb-btn--ghost" aria-expanded={showPlan} onClick={() => setShowPlan((value) => !value)}>{showPlan ? 'Fold' : 'Open'} my plan</button></div>
    {errorView}
    <div className="proto-columns"><div className="proto-stack">
      {showPlan ? <Card title="Your learning plan"><ul>{session.plan.objectives.map((objective, i) => <li key={i}>{objective}</li>)}</ul><progress max={session.plan.steps.length} value={session.plan.currentStep} aria-label="Learning steps completed" style={{ width: '100%' }} /><ol className="proto-plan">{session.plan.steps.map((step, i) => { const item = modules.find((row) => row.id === step.moduleId); return <li key={`${step.moduleId}:${i}`} aria-current={i === session.plan.currentStep ? 'step' : undefined}>{item ? `${MODULE_LABELS[item.type]} · ${item.objective}` : 'Learning step'}{i < session.plan.currentStep ? ' · Finished' : ''}</li>; })}</ol></Card> : null}
      {session.plan.status === 'completed' ? <Card title="Your learning, gathered together" tape>{summary ? <><p>You tried {summary.attempted} answers. {summary.correct} were correct. {summary.notTaught ? `${summary.notTaught} marked as not learned yet, with no penalty.` : ''}</p><ul>{summary.concepts.map((concept) => <li key={concept.conceptId}>{modules.find((row) => row.conceptId === concept.conceptId)?.objective ?? 'Chapter idea'} <MasteryChip level={concept.word} /></li>)}</ul><p className="nb-note">These words come from this session's saved evidence.</p><Link className="nb-btn" to={`/student/chapters/${session.chapterId}/learn`}>Revisit the chapter</Link></> : <p role="status">Gathering your saved learning evidence…</p>}</Card>
        : intro ? <Card title="A little plan for this chapter" tape><p className="proto-copy">Start with one idea. Follow a worked example, explore, practise, and return to anything that needs another look.</p><p>No rush. Each completed step is saved so you can come back later.</p><button className="nb-btn" onClick={() => setIntro(false)}>Begin learning</button></Card>
          : module ? <ModuleView key={`${module.id}:${session.plan.currentStep}`} module={module} sessionId={sessionId} events={session.events} repair={repair} pending={pending} onEvidence={() => { void refreshEvidence(); }} onComplete={() => { void complete(); }} />
            : <Card title="This step is unavailable"><p>Your plan references material that could not be loaded.</p><button className="nb-btn" onClick={() => setAttempt((value) => value + 1)}>Retry</button></Card>}
      {currentGame && module && session.plan.status !== 'completed' ? <Card title="Saathy suggests an exploration"><h3>{currentGame.title}</h3><p>{currentGame.description}</p><Link className="nb-btn nb-btn--ghost" to={planGameRoute(currentGame.route, sessionId, session.plan.currentStep, module.id, currentGame.id)}>Play {currentGame.title}</Link><p className="nb-note">Your plan stays at this step. Come back whenever you are ready.</p></Card> : null}
      {recommendation ? <Card title="A suggested next step"><p>{recommendation.suggestedAction}</p>{recommendation.nextModuleId ? <p className="nb-note">{modules.find((row) => row.id === recommendation.nextModuleId)?.objective ?? 'Continue your saved plan.'}</p> : null}</Card> : null}
    </div><aside className="proto-stack" aria-label="Contextual Saathy">{module && !intro && session.plan.status !== 'completed' ? <ContextualSaathy key={module.id} module={module} initialMode={mode.success ? mode.data : 'explain'} context={{ studentId: me.profile.id, subjectId: session.plan.subjectId, chapterId: session.chapterId, conceptId: module.conceptId, sessionId, step: session.plan.currentStep, recentAttempts: session.events.filter((event) => event.type === 'answer_submitted').slice(-5).map((event) => ({ questionId: String(event.result?.questionId ?? ''), answer: String(event.result?.answer ?? ''), correct: event.result?.correct === true })) }} onAction={setRecommendation} /> : <Card title="Your place is saved"><p className="nb-note">Open this session from Study sessions to continue. Your session link also works on your other signed-in devices.</p><Link className="nb-link" to={sessionPath(session.id)}>Session link</Link></Card>}</aside></div>
  </div>;
}
