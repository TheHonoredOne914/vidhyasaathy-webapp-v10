import { useState } from 'react';
import { StudentHomeSchema, WarmupSkipResultSchema, WarmupStartSchema, type StudentHome } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { ApiClientError, postJson } from '../api/client';
import { useRemote } from '../setup/useRemote';
import { StaleNote } from '../ui/StaleNote';
import { Icon } from './notebook/icons';
import { Saathy } from './notebook/Saathy';
import { Bubble, Chip, MasteryChip, ProgressBar, SUBJECT_COLOR, SubjectIcon, subjectKey } from './notebook/ui';
import './notebook/pages/home.css';

type Desk = StudentHome;

const BADGE: Record<Desk['fromTeacher'][number]['badge'], { tone: 'orange' | 'red' | 'sand' | 'sky'; label: string }> = {
  due_today: { tone: 'orange', label: 'Due today' },
  overdue: { tone: 'red', label: 'Overdue' },
  suggested: { tone: 'sand', label: 'Suggested' },
  new: { tone: 'sky', label: 'New' },
};

function formatDay(iso: string) {
  return new Date(`${iso}T12:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
}

function dayLetter(iso: string) {
  return new Date(`${iso}T12:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'narrow', timeZone: 'Asia/Kolkata' });
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

function nodeState(word: string, current: boolean) {
  if (word === 'Mastered' || word === 'Top form') return 'done';
  if (word === "Let's fix this") return 'fix';
  if (current || word === 'Almost there') return 'now';
  return 'new';
}

function atomGame(game: Desk['todaysGame']) {
  if (!game) return null;
  const id = game.gameId.toLowerCase();
  const title = game.title.toLowerCase();
  if (id.includes('atom') || title.includes('atom')) return null;
  return game;
}

function Retry({ what, onRetry }: { what: string; onRetry: () => void }) {
  return <p className="nb-empty" role="alert">Could not load {what}. <button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" onClick={onRetry}>Try again</button></p>;
}

function Thumb() {
  return <div className="home-thumb nb-hide-m" aria-hidden="true">
    <svg viewBox="0 0 260 150" preserveAspectRatio="xMidYMid slice"><rect width="260" height="150" fill="#DCEAF6" />
      <g stroke="#B8CDE6" strokeWidth="1"><path d="M0 18H260" /><path d="M0 36H260" /><path d="M0 54H260" /><path d="M0 72H260" /><path d="M0 90H260" /><path d="M0 108H260" /><path d="M0 126H260" /><path d="M0 144H260" /></g>
      <path d="M30 125V20M30 125H240" stroke="#1B2A4A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M30 120 Q120 112 220 30" stroke="#3D6FB8" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  </div>;
}

export function HomeDesk({ stale, updatedAt, message }: { me: { profile: { id: string; name: string } }; stale: boolean; updatedAt: string | null; message: string | null }) {
  const home = useRemote('/student/home', StudentHomeSchema);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function warmup(kind: 'start' | 'skip', href: string) {
    setBusy(true);
    setNote(null);
    try {
      const clientEventId = crypto.randomUUID();
      if (kind === 'skip') await postJson('/student/warmup/skip', WarmupSkipResultSchema, { clientEventId });
      else await postJson('/student/warmup/start', WarmupStartSchema, { clientEventId });
      home.reload();
      if (kind === 'start') window.location.assign(href);
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.status === 409) home.reload();
      else setNote(cause instanceof Error ? cause.message : 'Could not update the warm-up.');
    } finally {
      setBusy(false);
    }
  }

  if (home.denied) return <section className="nb-card"><h1 className="nb-h1">This page is closed</h1><p className="nb-note">This notebook page is not open for this login.</p></section>;
  if (home.status === 'loading' && !home.data) return <div className="pg-home" data-testid="student-home"><div className="nb-grid"><div className="nb-skel" /><div className="nb-skel" /><div className="nb-skel" /></div></div>;
  if (home.status === 'error' && !home.data) return <div className="pg-home"><Retry what="home" onRetry={home.reload} /></div>;
  if (!home.data) return null;

  const data = home.data;
  const game = atomGame(data.todaysGame);
  const path = data.learningPath;
  let currentGiven = false;
  const nodes = (path?.nodes ?? []).map((node) => {
    const done = node.word === 'Mastered' || node.word === 'Top form';
    const current = !done && !currentGiven;
    if (current) currentGiven = true;
    return { node, state: nodeState(node.word, current) };
  });
  const goalPct = data.todaysGoal.total ? Math.round((data.todaysGoal.done / data.todaysGoal.total) * 100) : 0;
  const weekDays = data.streak.currentDays === 1 ? '1 day' : `${data.streak.currentDays} days`;

  return <div className="pg-home" data-testid="student-home">
    <StaleNote stale={stale || home.stale} updatedAt={home.updatedAt ?? updatedAt} message={home.message ?? message} testId="updated-at" />
    <div className="nb-grid">
      <div className="home-hero">
        <div>
          <div className="nb-head__eyebrow">{formatDay(data.greeting.dateIST)}</div>
          <h1 className="nb-h1" style={{ fontSize: '3.1rem' }}>Namaste, {firstName(data.greeting.name)} <Icon name="hand" className="wave" /></h1>
          <svg className="nb-scribble" style={{ width: '9rem' }} viewBox="0 0 140 10" preserveAspectRatio="none" aria-hidden="true"><path d="M2 6c20-4 40 3 60-1s45-3 76 0" stroke="#E8B84A" strokeWidth="3.5" fill="none" strokeLinecap="round" /></svg>
          <p className="nb-sub">{data.streak.restartCopy ?? data.greeting.line}</p>
        </div>
        <div className="home-hero__saathy nb-hide-m"><Bubble hand>Let's keep going!</Bubble><Saathy mood="cheer" size="7.5rem" /></div>
      </div>

      <section className="nb-card home-continue">
        <span className="nb-tape nb-tape--left" />
        {data.nextAction ? <>
          <div>
            <Chip tone="orange">Your next step{path ? ` · ${path.subject}` : ''}</Chip>
            <h2>{data.nextAction.title}</h2>
            <p className="why"><Icon name="bulb" /><span>{data.nextAction.kind === 'catchup' && data.catchUp ? data.catchUp.copy : data.nextAction.resumeState ?? 'This is your next step.'}</span></p>
            <div className="row">
              <Link className="nb-btn nb-btn--primary nb-btn--lg" to={data.nextAction.href}>Continue <Icon name="arrow" /></Link>
              <Chip tone="sky" dashed><Icon name="clock" /> {data.nextAction.estMinutes} min left</Chip>
            </div>
          </div>
          <Thumb />
        </> : <div><Chip tone="orange">Your next step</Chip><h2>Pick a subject to start</h2><p className="why">Your teacher has not shared a next step yet.</p><div className="row"><Link className="nb-btn nb-btn--primary nb-btn--lg" to="/student?panel=subjects">Open subjects <Icon name="arrow" /></Link></div></div>}
      </section>

      <section className="nb-card subjects-card">
        <div className="nb-card__head"><h3 className="nb-h3">Your subjects</h3><Link className="nb-link" to="/student?panel=subjects">View all <Icon name="arrow" /></Link></div>
        {data.subjects.length ? <div className="home-subjects">{data.subjects.map((subject) => {
          const pct = subject.total ? Math.round((subject.done / subject.total) * 100) : 0;
          return <div className="home-subj" key={subject.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><SubjectIcon subject={subject.name} /></div>
            <div><b>{subject.name}</b><div className="ch">{subject.chapterLabel || 'No chapter yet'}</div></div>
            {subject.total > 0 ? <ProgressBar value={pct} color={SUBJECT_COLOR[subjectKey(subject.name)]} /> : null}
            <div className="foot"><span className="nb-meta">{subject.total ? `${subject.done} / ${subject.total} ideas` : 'No ideas yet'}</span><Link className="nb-link" style={{ fontSize: '1rem' }} to={`/student/subjects/${subject.id}`}>Open <Icon name="arrow" /></Link></div>
          </div>;
        })}</div> : <p className="nb-empty">Your teacher has not added a subject yet.</p>}
      </section>

      <section className="nb-card home-path">
        <div className="nb-card__head"><h3 className="nb-h3">Your path{path ? ` · ${path.subject}: ${path.chapter}` : ''}</h3>{data.subjects[0] ? <Link className="nb-link" to={`/student/subjects/${data.subjects[0].id}`}>See full map <Icon name="arrow" /></Link> : null}</div>
        {nodes.length ? <div className="path">{nodes.map(({ node, state }) => <Link className={`pnode ${state}`} key={node.conceptId} to={data.nextAction?.conceptId === node.conceptId ? data.nextAction.href : `/student?panel=subjects`}><div className="orb"><Icon name={state === 'done' ? 'check' : state === 'fix' ? 'refresh' : state === 'now' ? 'book' : 'sparkle'} /></div><MasteryChip level={node.word} /><b>{node.name}</b>{node.note ? <span>{node.note}</span> : null}</Link>)}</div> : <p className="nb-empty">Pick a subject to see your path.</p>}
        {data.dushman.length ? <div className="nb-meta" style={{ marginTop: 'var(--nb-s3)' }}>Still tricky: {data.dushman.map((row) => row.name).join(', ')}</div> : null}
      </section>

      <aside className="rail nb-col">
        <section className="nb-card">
          <div className="nb-card__head"><h3 className="nb-h3">Today's goal</h3><span className="nb-meta">{data.todaysGoal.done} / {data.todaysGoal.total}</span></div>
          {data.todaysGoal.total ? <div style={{ marginBottom: 'var(--nb-s3)' }}><ProgressBar value={goalPct} /></div> : null}
          {data.todaysGoal.items.length ? data.todaysGoal.items.map((item) => <Link className={item.done ? 'goal done' : 'goal'} key={item.id} to={item.href}><div className="ck">{item.done ? <Icon name="check" /> : null}</div><span>{item.label}</span></Link>) : <p className="nb-empty">Nothing is lined up for today.</p>}
          {data.newBadges.length ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: 'var(--nb-s3)' }}>{data.newBadges.map((badge) => <Link key={badge.id} className="nb-chip nb-chip--sand" to="/student/progress">{badge.name}</Link>)}</div> : null}
        </section>

        {data.warmup ? <section className="nb-card challenge">
          <span className="nb-sticky__who">Warm up</span>
          <p className="nb-note" style={{ margin: '.2rem 0 .5rem' }}>{data.warmup.conceptName} · {data.warmup.estMinutes} minutes</p>
          <div className="row">
            <button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" disabled={busy} onClick={() => { void warmup('start', data.warmup!.href); }}>Warm up</button>
            <button type="button" className="nb-btn nb-btn--quiet nb-btn--sm" disabled={busy} onClick={() => { void warmup('skip', data.warmup!.href); }}>Skip</button>
          </div>
          {note ? <p className="nb-empty" role="alert">{note}</p> : null}
        </section> : null}

        <section className="nb-card challenge">
          <span className="nb-sticky__who">Daily challenge</span>
          <p className="nb-note" style={{ margin: '.2rem 0 .5rem' }}>{data.dailyChallenge.status === 'completed' ? 'Done for today.' : data.dailyChallenge.status === 'expired' ? 'This one has closed.' : 'Today’s puzzle is waiting in your notebook.'}</p>
          {data.dailyChallenge.status === 'ready' || data.dailyChallenge.status === 'served' ? <Link className="nb-btn nb-btn--ghost nb-btn--sm" to={data.dailyChallenge.href}>Try it</Link> : null}
        </section>

        {game ? <section className="nb-card"><div className="game-mini"><div className="thumb"><Icon name="game" /></div><div><div className="nb-h3" style={{ fontSize: '1.3rem' }}>{game.title}</div><div className="nb-meta">{game.conceptName} · {game.estMinutes} min</div><Link className="nb-link" to={game.href}>Play</Link></div></div></section> : null}

        <section className="nb-card">
          <div className="nb-card__head"><h3 className="nb-h3">This week</h3><span className="nb-meta">{weekDays}</span></div>
          <div className="days">{data.streak.week.map((day) => <div key={day.date} className={`day${day.state === 'done' ? ' on' : ''}${day.state === 'today' ? ' today' : ''}${day.state === 'freeze' ? ' freeze' : ''}`}><i>{day.state === 'done' ? <Icon name="check" /> : null}</i>{dayLetter(day.date)}</div>)}</div>
        </section>

        <section className="nb-card nb-grow">
          <div className="nb-card__head"><h3 className="nb-h3">From your teacher</h3><Link className="nb-link" style={{ fontSize: '1rem' }} to="/student?panel=homework">View all</Link></div>
          {data.fromTeacher.length ? data.fromTeacher.map((item) => {
            const badge = BADGE[item.badge];
            return <Link className="nb-row" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }} key={item.id} to={item.href}><div><div className="nb-row__t" style={{ fontSize: '1.12rem' }}>{item.title}</div><div className="nb-row__s">{item.subject}</div></div><Chip tone={badge.tone}>{badge.label}</Chip></Link>;
          }) : <p className="nb-empty">Nothing from your teacher right now.</p>}
          <Link className="nb-saathy-tip" style={{ marginTop: 'var(--nb-s3)' }} to="/student?panel=ask"><Saathy mood="happy" size="3.4rem" /><div><b className="nb-h3" style={{ fontSize: '1.2rem' }}>Stuck on something?</b><div className="nb-text">Ask Saathy. Hints first, never just answers.</div></div></Link>
        </section>
      </aside>
    </div>
  </div>;
}
