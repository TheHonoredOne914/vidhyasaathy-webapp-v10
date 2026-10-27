import { useState } from 'react';
import type { Me } from '@vidhyasaathy/contracts';
import { ProgressSchema, StreakSchema, StudyPlanSchema } from '@vidhyasaathy/contracts';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { AskPanel } from '../ai/AskPanel';
import { AssignmentList } from '../assessment/AssignmentList';
import { ChapterListSchema, ConceptListSchema } from '../content/schemas';
import { SubjectListSchema } from '../setup/schemas';
import { useRemote } from '../setup/useRemote';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { StaleNote } from '../ui/StaleNote';
import { SaathyMascot } from '../ui/Saathy';
import { AccessDenied } from './AccessDenied';

const GAME_TILES = [
  { id: 'atom', title: 'Atom Forge', chapter: 'Ch 4 · Structure of the Atom', art: '⚛' },
  { id: 'cell', title: 'Bio Quest', chapter: 'Ch 5 · The Fundamental Unit of Life', art: '🔬' },
  { id: 'matter', title: 'Particle Party', chapter: 'Ch 1 · Matter in Our Surroundings', art: '◈' },
  { id: 'motion', title: 'Bus Stop Graphs', chapter: 'Ch 8 · Motion', art: '🚌' },
  { id: 'newton', title: 'Cricket Lab', chapter: 'Ch 9 · Force and Laws of Motion', art: '🏏' },
  { id: 'float', title: 'Float or Sink', chapter: 'Ch 10 · Gravitation', art: '⚓' },
  { id: 'energy', title: 'Energy Slide', chapter: 'Ch 11 · Work and Energy', art: '⚡' },
  { id: 'sound', title: 'Echo Corridor', chapter: 'Ch 12 · Sound', art: '🔊' },
  { id: 'graphs', title: 'Treasure Grid', chapter: 'Maths · Coordinate Geometry', art: '🗺️' },
  { id: 'poly', title: 'Polynomial Factory', chapter: 'Maths · Polynomials', art: '📐' },
] as const;
type Style = 'visual' | 'story' | 'practice';

function styleLabel(style: Style) { return style === 'visual' ? 'See it' : style === 'story' ? 'Hear a story' : 'Try it'; }

function MasteryChapter({ chapterId, title, mastery }: { chapterId: string; title: string; mastery: Map<string, number | null> }) {
  const concepts = useRemote(`/chapters/${chapterId}/concepts`, ConceptListSchema);
  if (concepts.status === 'loading' && !concepts.data) return <div className="mastery-chapter"><h3>{title}</h3><Skeleton /></div>;
  if (!concepts.data) return <div className="mastery-chapter"><h3>{title}</h3><p className="muted">Concept map is resting. Try again soon.</p></div>;
  return <div className="mastery-chapter"><h3>{title}</h3><div className="concept-chips">{concepts.data.length ? concepts.data.map((concept) => {
    const score = mastery.get(concept.id);
    const level = score == null ? 'new' : score >= 0.8 ? 'strong' : score >= 0.5 ? 'growing' : 'practice';
    return <span className={`concept-chip concept-chip--${level}`} key={concept.id} title={score == null ? 'No practice yet' : `${Math.round(score * 100)}% correct`}>{concept.title}</span>;
  }) : <span className="muted">No concepts yet.</span>}</div></div>;
}

function SubjectMastery({ subjectId, title, mastery }: { subjectId: string; title: string; mastery: Map<string, number | null> }) {
  const chapters = useRemote(`/subjects/${subjectId}/chapters`, ChapterListSchema);
  if (chapters.status === 'loading' && !chapters.data) return <article className="mastery-subject"><h2>{title}</h2><Skeleton /></article>;
  if (!chapters.data) return <article className="mastery-subject"><h2>{title}</h2><p className="muted">Chapters are not available yet.</p></article>;
  return <article className="mastery-subject"><h2>{title}</h2>{chapters.data.length ? chapters.data.map((chapter) => <MasteryChapter key={chapter.id} chapterId={chapter.id} title={chapter.title} mastery={mastery} />) : <p className="muted">No chapters yet.</p>}</article>;
}

function StudentDesk({ me, stale, updatedAt, message }: { me: Me; stale: boolean; updatedAt: string | null; message: string | null }) {
  const plan = useRemote('/study-plan', StudyPlanSchema);
  const progress = useRemote('/progress', ProgressSchema);
  const streak = useRemote('/practice/streak', StreakSchema);
  const subjects = useRemote('/student/subjects', SubjectListSchema);
  const [style, setStyle] = useState<Style>(() => {
    const saved = window.localStorage.getItem('vidhyasaathy.learn-style');
    return saved === 'story' || saved === 'practice' ? saved : 'visual';
  });
  const mastery = new Map((progress.data?.concepts ?? []).map((item) => [item.conceptId, item.passRate]));
  const weakest = [...(progress.data?.concepts ?? [])].filter((item) => item.passRate !== null).sort((a, b) => (a.passRate ?? 1) - (b.passRate ?? 1))[0];
  const next = plan.data?.nextAction ?? plan.data?.continue ?? (weakest ? { id: weakest.conceptId, chapterId: weakest.subjectId, title: weakest.title, kind: 'remediation' as const, required: false, dueAt: null, resumeAt: 0 } : null);
  const practiced = streak.data?.days.filter((day) => day.practiced).length ?? 0;
  const saveStyle = (value: Style) => { setStyle(value); window.localStorage.setItem('vidhyasaathy.learn-style', value); };
  return <div className="student-desk">
    <StaleNote stale={stale || plan.stale || progress.stale} updatedAt={plan.updatedAt ?? updatedAt} message={plan.message ?? progress.message ?? message} testId="updated-at" />
    <section className="desk-hero"><div><p className="app-kicker">Your learning desk</p><h1>Hello, {me.profile.name}</h1><p>One small step today is enough to keep your ideas moving.</p><p className="today-plan"><strong>Today’s plan</strong> · {next?.title ?? 'Choose a subject to begin'}</p></div><SaathyMascot className="desk-mascot" size={140} alt="Saathy" /></section>
    <section className="next-pick"><div><p className="section-kicker">Saathy picked this for you</p><h2>{next?.title ?? 'Choose your first learning step'}</h2><p>{next ? weakest && next.id === weakest.conceptId ? 'A little practice here will make the biggest difference.' : next.kind === 'assignment' ? 'You have homework waiting.' : 'Pick up where your learning left off.' : 'Open a subject and explore a chapter to begin.'}</p></div>{next ? <Link className="navy-btn" to={next.kind === 'assignment' ? '/student?panel=homework' : `/student/chapters/${next.chapterId}/practice`}>Start here</Link> : <Link className="navy-btn" to="/student?panel=subjects">Explore subjects</Link>}</section>
    <section className="desk-stats"><article className="stat-card"><span className="stat-icon" aria-hidden="true">🔥</span><div className="stat-body"><strong>{streak.data?.currentDays ?? 0}</strong><span>day streak</span><em>Best {streak.data?.longestDays ?? 0} days</em></div><div className="week-dots" aria-label={`${practiced} of 7 days practiced`}>{(streak.data?.days ?? Array.from({ length: 7 }, (_, i) => ({ date: String(i), practiced: false }))).map((day) => <i className={day.practiced ? 'is-done' : ''} key={day.date} />)}</div></article><article className="stat-card"><span className="stat-icon" aria-hidden="true">🎯</span><div className="stat-body"><strong>{progress.data?.evidence.passRate == null ? 'New' : `${Math.round(progress.data.evidence.passRate * 100)}%`}</strong><span>mastery</span><em>{(progress.data?.concepts ?? []).filter((c) => c.passRate != null).length} concepts practiced</em></div><div className="goal-ring" style={{ ['--ring' as string]: `${Math.round((progress.data?.evidence.passRate ?? 0) * 100)}%` }}><strong>{progress.data?.evidence.passRate == null ? '—' : `${Math.round(progress.data.evidence.passRate * 100)}`}</strong></div></article><article className="stat-card"><span className="stat-icon" aria-hidden="true">⏱️</span><div className="stat-body"><strong>{(progress.data?.completedSessions ?? 0) * 10}</strong><span>minutes this week</span><em>{progress.data?.completedSessions ?? 0} sessions done</em></div></article></section>
    <section className="continue-learning"><div className="section-heading"><div><p className="section-kicker">Keep your momentum</p><h2>Continue learning</h2></div><Link className="text-link" to="/student?panel=subjects">All subjects</Link></div><div className="continue-list">{plan.data?.items?.length ? plan.data.items.slice(0, 3).map((item) => <Link className="continue-item" to={`/student/chapters/${item.chapterId}/practice`} key={item.id}><span className="subject-chip">{item.kind === 'assignment' ? 'Homework' : 'Practice'}</span><span className="continue-copy"><strong>{item.title}</strong><span className="progress-track"><span style={{ width: item.id === next?.id ? '62%' : '28%' }} /></span></span><span className="text-link">Open</span></Link>) : <div className="placeholder-row"><strong>Your next lesson will appear here</strong><span>Complete one short activity to build your path.</span></div>}</div></section>
    <section className="learn-way"><div><p className="section-kicker">Learn your way</p><h2>How should today feel?</h2></div><div className="style-switch" role="radiogroup" aria-label="Learning style">{(['visual', 'story', 'practice'] as Style[]).map((value) => <button role="radio" aria-checked={style === value} aria-pressed={style === value} className={style === value ? 'is-selected' : ''} key={value} onClick={() => saveStyle(value)} type="button">{styleLabel(value)}</button>)}</div><p className="muted">Saathy will put {style === 'visual' ? 'diagrams and examples' : style === 'story' ? 'short stories and explanations' : 'hands-on questions'} first.</p></section>
    <section className="desk-section"><div className="section-heading"><div><p className="section-kicker">See your shape</p><h2>Mastery map</h2></div><Link className="text-link" to="/student/progress">Full progress</Link></div>{progress.status === 'loading' && !progress.data ? <Skeleton /> : subjects.status === 'error' ? <ErrorState title="Could not load your subjects" message={subjects.message ?? 'Try again.'} onRetry={subjects.reload} /> : subjects.data?.length ? <div className="mastery-grid">{subjects.data.map((subject) => <SubjectMastery key={subject.id} subjectId={subject.id} title={subject.name} mastery={mastery} />)}</div> : <p className="empty-note">Your mastery map will appear after your teacher adds a subject.</p>}</section>
    <section className="games-shelf"><div className="section-heading"><div><p className="section-kicker">Take a quick detour</p><h2>Learning games</h2></div><span className="muted">Pick a game</span></div><div className="game-tiles">{GAME_TILES.slice(0, 4).map((tile) => <Link className="game-tile" to={`/student/chapters/${next?.chapterId ?? '1d6c23df-2d73-4465-8052-6737b7816d0c'}/practice/engine/${tile.id}`} key={tile.id}><span className="game-art" aria-hidden="true">{tile.art}</span><strong>{tile.title}</strong><small>{tile.chapter}</small><span className="game-play">Play</span></Link>)}</div></section>
  </div>;
}

export function StudentHome({ me, stale, updatedAt, message }: { me: Me; stale: boolean; updatedAt: string | null; message: string | null }) {
  const [params] = useSearchParams();
  const panel = params.get('panel');
  const studying = panel === 'subjects' || panel === 'study';
  const homework = panel === 'homework';
  const ask = panel === 'ask';
  const subjects = useRemote(studying ? '/student/subjects' : null, SubjectListSchema);
  if (panel === 'progress') return <Navigate to="/student/progress" replace />;
  if ((panel && !studying && !homework && !ask) || subjects.denied) return <AccessDenied />;
  return <div className="student-screen">
    {homework || studying ? <StaleNote stale={stale} updatedAt={updatedAt} message={message} testId="updated-at" /> : null}
    {homework ? <article className="lcard"><div className="lcard-head"><h1>Homework and quizzes</h1></div><div className="lcard-body"><AssignmentList /><Link className="text-link" to="/student">Go home</Link></div></article> : studying ? <article className="lcard"><div className="lcard-head"><h1>{panel === 'study' ? 'Study sessions' : 'Your subjects'}</h1></div><div className="lcard-body">{panel === 'study' ? <p>Open a subject, then a chapter, to start a session.</p> : null}<StaleNote stale={subjects.stale && subjects.status !== 'error'} updatedAt={subjects.updatedAt} message={subjects.status === 'error' ? null : subjects.message} />{subjects.status === 'loading' && !subjects.data ? <Skeleton /> : subjects.status === 'error' && !subjects.data ? <div className="error-card"><ErrorState title="Could not load subjects" message={subjects.message ?? 'Try again.'} onRetry={subjects.reload} /></div> : subjects.data?.length ? <div className="subject-card-grid">{subjects.data.map((subject) => <Link className="subject-card" key={subject.id} to={`/student/subjects/${subject.id}`}><strong>{subject.name}</strong><span>Open chapters and sessions</span></Link>)}</div> : <p>No subjects assigned yet. Ask your teacher.</p>}<Link className="text-link" to="/student">Go home</Link></div></article> : ask ? <AskPanel /> : <StudentDesk me={me} stale={stale} updatedAt={updatedAt} message={message} />}
    <nav className="student-tabs no-print" aria-label="Student">{[['', 'Home'], ['subjects', 'Study'], ['homework', 'Homework'], ['ask', 'Ask']].map(([value, label]) => <Link key={label} to={value ? `/student?panel=${value}` : '/student'} aria-current={(panel ?? '') === value ? 'page' : undefined}>{label}</Link>)}<Link to="/student/progress">Progress</Link></nav>
  </div>;
}
