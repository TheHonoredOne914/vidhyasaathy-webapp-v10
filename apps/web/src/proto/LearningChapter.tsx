import { ChapterSchema, type LearningModule } from '@vidhyasaathy/contracts';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useRemote } from '../setup/useRemote';
import { useSession } from '../session';
import { Card, Chip, PageHead } from '../student/notebook/ui';
import { Saathy } from '../student/notebook/Saathy';
import { learningApi, rememberSession, safeGameRoute, sessionPath } from './adapter';
import type { GameRegistryEntry } from '@vidhyasaathy/contracts';
import './learning.css';

export function LearningChapter() {
  const { chapterId = '' } = useParams();
  return <ChapterJourney key={chapterId} chapterId={chapterId} />;
}

function ChapterJourney({ chapterId }: { chapterId: string }) {
  const chapter = useRemote(`/chapters/${chapterId}`, ChapterSchema);
  const { me } = useSession();
  const navigate = useNavigate();
  const [modules, setModules] = useState<LearningModule[] | null>(null);
  const [games, setGames] = useState<GameRegistryEntry[]>([]);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [planning, setPlanning] = useState(false);
  const [readiness, setReadiness] = useState('new');
  const [goal, setGoal] = useState('understand');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    void learningApi.modules(chapterId, controller.signal).then((result) => { if (!controller.signal.aborted) setModules(result.modules); }).catch(() => { if (!controller.signal.aborted) setError('The learning path could not load. Please try again.'); });
    void learningApi.games(controller.signal).then((result) => { if (!controller.signal.aborted) setGames(result.games.filter((game) => game.chapterId === chapterId)); }).catch(() => { /* Chapter learning remains available without games. */ });
    return () => controller.abort();
  }, [chapterId, attempt]);
  async function start() {
    if (busy || !me || !chapter.data) return;
    setBusy(true); setError('');
    try {
      const plan = await learningApi.plan(chapterId);
      const session = await learningApi.start(chapterId, plan.id);
      rememberSession(me.profile.id, session, chapter.data.title);
      navigate(`${sessionPath(session.id)}?mode=${readiness === 'new' ? 'teach_from_zero' : goal === 'revise' ? 'revise' : 'explain'}`);
    } catch { setError('Your plan could not be opened. Try again; your existing sessions are safe.'); }
    finally { setBusy(false); }
  }
  const ideas = modules?.filter((module) => module.type === 'concept') ?? [];
  return <div className="proto-learning">
    <PageHead eyebrow="Your chapter notebook" title={chapter.data?.title ?? 'Learn with Saathy'} sub="One idea, one example, one small step at a time." />
    <p><Link className="nb-link" to={chapter.data ? `/student/subjects/${chapter.data.subjectId}` : '/student?panel=subjects'}>Back to subject</Link></p>
    {chapter.denied ? <p role="alert">This chapter is not available for your account.</p> : null}
    {chapter.status === 'error' ? <p role="alert">Could not load the chapter. <button className="nb-btn nb-btn--ghost" onClick={chapter.reload}>Try again</button></p> : null}
    <div className="proto-columns">
      <div className="proto-stack">
        <Card title="Start here" tape>
          <p className="nb-note">Read the ideas, follow a worked example, explore what changes, then try a question. Saathy will help you revisit an idea whenever you need it.</p>
          <button className="nb-btn" disabled={!modules?.length || !chapter.data || busy} onClick={() => setPlanning(true)}>Plan my learning</button>
        </Card>
        {planning ? <Card title="Make room for your learning">
          <form onSubmit={(event) => { event.preventDefault(); void start(); }}>
            <fieldset><legend>How does this chapter feel?</legend>{[['new', "I haven't learned this yet"], ['started', "I've started learning it"]].map(([value, label]) => <label className="proto-choice" key={value}><input type="radio" name="readiness" value={value} checked={readiness === value} onChange={() => setReadiness(value)} />{label}</label>)}</fieldset>
            <fieldset><legend>What would help today?</legend>{[['understand', 'Understand the ideas'], ['revise', 'Revise and practise']].map(([value, label]) => <label className="proto-choice" key={value}><input type="radio" name="goal" value={value} checked={goal === value} onChange={() => setGoal(value)} />{label}</label>)}</fieldset>
            <p className="nb-note">This is a preference check, with no score. Your choices set how Saathy starts the conversation. You can change the teaching mode any time.</p>
            <button type="submit" className="nb-btn" disabled={busy}>{busy ? 'Opening your plan…' : 'Build my plan'}</button>
          </form>
        </Card> : null}
        <Card title="Ideas and objectives">
          {!modules && !error ? <p role="status">Opening the chapter ideas…</p> : null}
          {ideas.length ? <ul className="proto-objectives">{ideas.map((idea) => <li key={idea.id}><Chip>New</Chip> <b>{idea.objective}</b><p>{idea.content}</p></li>)}</ul> : modules ? <p>No learning material is available yet.</p> : null}
        </Card>
        <Link className="nb-link" to={`/student/chapters/${chapterId}`}>Open chapter notes and assignments</Link>
      </div>
      <aside className="proto-stack" aria-label="Saathy and connected games">
        <Card title="Learn with Saathy" accent><Saathy mood="happy" size="6rem" /><p className="nb-note">New ideas start as New. Ask for an explanation, a hint or a different example whenever you need one.</p></Card>
        <Card title="Connected games">{games.filter((game) => game.available && safeGameRoute(game.route)).map((game) => <div className="proto-game" key={game.id}><h3>{game.title}</h3><p>{game.description}</p><p className="nb-note">Saathy can open this game from your plan and bring you back to the same step.</p></div>)}{!games.some((game) => game.available && safeGameRoute(game.route)) ? <p className="nb-note">Explore activities inside your learning plan. Connected games appear when available for this chapter.</p> : null}</Card>
      </aside>
    </div>
    {error ? <p role="alert">{error} <button className="nb-btn nb-btn--ghost" onClick={() => setAttempt((value) => value + 1)}>Try again</button></p> : null}
  </div>;
}
