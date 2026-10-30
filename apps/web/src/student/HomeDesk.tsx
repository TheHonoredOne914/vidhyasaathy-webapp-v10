import { useEffect, useState } from 'react';
import type { Assignment, Me, PlanItem } from '@vidhyasaathy/contracts';
import { ProgressSchema, StreakSchema, StudyPlanSchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { planHref } from '../ai/plan';
import { getJson } from '../api/client';
import { ChapterListSchema, ConceptListSchema } from '../content/schemas';
import { SubjectListSchema } from '../setup/schemas';
import { useRemote } from '../setup/useRemote';
import { Skeleton } from '../ui/Skeleton';
import { StaleNote } from '../ui/StaleNote';
import { SaathyMascot } from '../ui/Saathy';
import './home.css';

type Chapter = { id: string; title: string; subjectId: string; position: number; status: 'not_started' | 'in_progress' | 'completed' };
type Subject = { id: string; name: string };
type Style = 'visual' | 'story' | 'practice';

const STYLE_KEY = 'vidhyasaathy.learn-style';

// Each game belongs to the NCERT chapter whose title contains one of these words.
const GAMES = [
  { id: 'atom', title: 'Atom Forge', hook: 'build an atom shell by shell', words: ['atom'] },
  { id: 'cell', title: 'Bio Quest', hook: 'explore a living cell', words: ['cell', 'unit of life'] },
  { id: 'matter', title: 'Particle Party', hook: 'heat and cool particles', words: ['matter'] },
  { id: 'newton', title: 'Cricket Lab', hook: 'feel force and acceleration', words: ['force', 'laws of motion'] },
  { id: 'motion', title: 'Bus Stop Graphs', hook: 'draw a journey as a graph', words: ['motion'] },
  { id: 'float', title: 'Float or Sink', hook: 'test what floats', words: ['gravitation', 'floatation'] },
  { id: 'energy', title: 'Energy Slide', hook: 'trade height for speed', words: ['work', 'energy'] },
  { id: 'sound', title: 'Echo Corridor', hook: 'bounce sound off walls', words: ['sound'] },
  { id: 'graphs', title: 'Treasure Grid', hook: 'find treasure with coordinates', words: ['coordinate'] },
  { id: 'poly', title: 'Polynomial Factory', hook: 'factor on the assembly line', words: ['polynomial'] },
] as const;

const ACCENTS = ['sky', 'peach', 'mint', 'ice'] as const;

function todayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);
}

function dayLabel(iso: string) {
  return new Date(`${iso}T12:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'narrow', timeZone: 'Asia/Kolkata' });
}

function shortDate(ms: number) {
  return new Date(ms).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
}

function gameFor(title: string) {
  const lower = title.toLowerCase();
  return GAMES.find((game) => game.words.some((word) => lower.includes(word))) ?? null;
}

function SubjectIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (lower.includes('phys')) return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M4 18h16M6 18l4-10 4 6 2-3 3 7" /><circle {...common} cx="10" cy="6" r="1.6" /></svg>;
  if (lower.includes('chem')) return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7.5 15h9" /></svg>;
  if (lower.includes('bio')) return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14ZM5 19l7-7" /></svg>;
  if (lower.includes('math')) return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M5 5h6M8 2v6M14 5h5M5 16l5 5M10 16l-5 5M14 16h5M14 20h5" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5ZM4 19a2 2 0 0 1 2-2h13" /></svg>;
}

function Retry({ what, onRetry }: { what: string; onRetry: () => void }) {
  return <p className="vs-home-empty vs-home-retry" role="status">Could not load {what} just now. <button type="button" onClick={onRetry}>Try again</button></p>;
}

function GameThumb({ id }: { id: string }) {
  const pen = { fill: 'none', stroke: '#193e69', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return <svg className="vs-home-game-art" viewBox="0 0 72 72" aria-hidden="true">
    <rect x="1.5" y="1.5" width="69" height="69" rx="12" fill="#fffdf8" stroke="#193e69" />
    {id === 'motion' || id === 'newton' ? <>
      <path {...pen} d="M12 54h48M12 54V20" />
      <path {...pen} stroke="#517dab" d="M14 48l14-12 12 6 16-16" />
      <circle cx="26" cy="42" r="4" fill="#d4a017" stroke="#193e69" />
      <path {...pen} d="M40 58h18M46 54v8" />
    </> : id === 'cell' ? <ellipse cx="36" cy="36" rx="18" ry="13" {...pen} /> : id === 'graphs' ? <>
      <path {...pen} d="M16 52h40M16 52V18" />
      <circle cx="28" cy="36" r="3" fill="#517dab" />
      <circle cx="44" cy="26" r="3" fill="#d4a017" />
    </> : <path {...pen} d="M18 46c6-16 30-16 36 0M22 30h28" />}
  </svg>;
}

function Check() {
  return <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.5 5 9l4.5-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function PathGlyph({ state }: { state: 'mastered' | 'learning' | 'next' }) {
  if (state === 'mastered') return <Check />;
  if (state === 'learning') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16c2-1 4-7 6-7s3 5 6 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>;
}

/** Loads every chapter of the student's subjects once, so cards can name the subject and the chapter behind a plan item. */
function useChapters(subjects: Subject[] | null) {
  const ids = subjects?.map((subject) => subject.id).join(',') ?? '';
  const [state, setState] = useState<{ key: string; chapters: Chapter[] | null }>({ key: '', chapters: null });
  useEffect(() => {
    if (!ids) return;
    const controller = new AbortController();
    void Promise.all(ids.split(',').map((id) => getJson(`/subjects/${id}/chapters`, ChapterListSchema, controller.signal).catch(() => [])))
      .then((lists) => { if (!controller.signal.aborted) setState({ key: ids, chapters: lists.flat().sort((a, b) => a.position - b.position) }); });
    return () => { controller.abort(); };
  }, [ids]);
  return subjects && !subjects.length ? [] : state.key === ids ? state.chapters : null;
}

function currentChapter(chapters: Chapter[], subjectId: string) {
  const own = chapters.filter((chapter) => chapter.subjectId === subjectId);
  return own.find((chapter) => chapter.status === 'in_progress') ?? own.find((chapter) => chapter.status === 'not_started') ?? own[own.length - 1] ?? null;
}

function nextCopy(item: PlanItem) {
  if (item.kind === 'session') return { cta: item.resumeAt > 0 ? 'Continue session' : 'Start session', blurb: 'Your teacher shared this session. Saathy will walk you through it one slide at a time.', chip: item.resumeAt > 0 ? `Resume at slide ${item.resumeAt + 1}` : 'New from your teacher' };
  if (item.kind === 'assignment') return { cta: item.resumeAt > 0 ? 'Continue homework' : 'Open homework', blurb: 'Homework from your teacher. Take it one question at a time.', chip: item.dueAt ? `Due ${shortDate(item.dueAt)}` : 'Homework' };
  if (item.kind === 'remediation') return { cta: 'Start practice', blurb: 'This idea was a little tricky last time. A short practice will make it click.', chip: 'Quick fix' };
  return { cta: 'Review now', blurb: 'A quick look back so this idea stays with you.', chip: 'Time to review' };
}

function assignmentTag(item: Assignment, now: number) {
  const status = item.score?.status;
  if (status === 'completed') return { label: 'Done', tone: 'done' };
  if (status === 'pending_review') return { label: 'Being checked', tone: 'soft' };
  if (item.dueAt < now) return { label: 'Overdue', tone: 'late' };
  if (todayKey(new Date(item.dueAt)) === todayKey()) return { label: 'Due today', tone: 'today' };
  return { label: `Due ${shortDate(item.dueAt)}`, tone: 'soft' };
}

export function HomeDesk({ me, stale, updatedAt, message }: { me: Me; stale: boolean; updatedAt: string | null; message: string | null }) {
  const plan = useRemote('/study-plan', StudyPlanSchema);
  const progress = useRemote('/progress', ProgressSchema);
  const streak = useRemote('/practice/streak', StreakSchema);
  const subjects = useRemote('/student/subjects', SubjectListSchema);
  const chapters = useChapters(subjects.data);
  const [style, setStyle] = useState<Style>(() => {
    const saved = window.localStorage.getItem(STYLE_KEY);
    return saved === 'story' || saved === 'practice' ? saved : 'visual';
  });
  const goalKey = `vidhyasaathy.goals.${me.profile.id}.${todayKey()}`;
  const [ticked, setTicked] = useState<string[]>(() => {
    try { const saved: unknown = JSON.parse(window.localStorage.getItem(goalKey) ?? '[]'); return Array.isArray(saved) ? saved.filter((value): value is string => typeof value === 'string') : []; } catch { return []; }
  });

  const now = Date.now();
  const next = plan.data?.nextAction ?? plan.data?.continue ?? null;
  const chapterById = new Map((chapters ?? []).map((chapter) => [chapter.id, chapter]));
  const subjectById = new Map((subjects.data ?? []).map((subject) => [subject.id, subject]));
  const nextChapter = next ? chapterById.get(next.chapterId) ?? null : null;
  const firstSubject = subjects.data?.[0] ?? null;
  const pathChapter = nextChapter ?? (chapters && firstSubject ? currentChapter(chapters, firstSubject.id) : null);
  const pathSubject = pathChapter ? subjectById.get(pathChapter.subjectId) ?? null : null;
  const concepts = useRemote(pathChapter ? `/chapters/${pathChapter.id}/concepts` : null, ConceptListSchema);
  const game = (() => {
    const own = pathChapter ? gameFor(pathChapter.title) : null;
    if (own && pathChapter) return { game: own, chapter: pathChapter };
    for (const chapter of chapters ?? []) { const match = gameFor(chapter.title); if (match) return { game: match, chapter }; }
    return null;
  })();

  const days = streak.data?.days ?? [];
  const today = todayKey();
  const practisedToday = days.some((day) => day.date === today && day.practiced);
  const openWork = (progress.data?.assignments ?? []).filter((item) => item.score?.status !== 'completed' && item.score?.status !== 'pending_review');
  const goals = [
    next ? { id: `next:${next.id}`, label: `${next.kind === 'assignment' ? 'Work on' : 'Open'} ${next.title}`, auto: false } : null,
    { id: 'practice', label: 'Practise for a few minutes', auto: practisedToday },
    game ? { id: `game:${game.game.id}`, label: `Play ${game.game.title}`, auto: false } : null,
    { id: 'ask', label: 'Ask Saathy one doubt', auto: false },
    { id: 'homework', label: openWork.length || !progress.data ? `Check ${openWork.length > 1 ? `${openWork.length} homework tasks` : 'your homework'}` : 'Homework all clear', auto: !openWork.length && Boolean(progress.data) },
  ].filter((goal): goal is { id: string; label: string; auto: boolean } => goal !== null);
  const isDone = (goal: { id: string; auto: boolean }) => goal.auto || ticked.includes(goal.id);
  const doneCount = goals.filter(isDone).length;
  const toggleGoal = (id: string) => {
    setTicked((current) => {
      const value = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      window.localStorage.setItem(goalKey, JSON.stringify(value));
      return value;
    });
  };
  const saveStyle = (value: Style) => { setStyle(value); window.localStorage.setItem(STYLE_KEY, value); };

  const teacherRows = [...(progress.data?.assignments ?? [])].sort((a, b) => a.dueAt - b.dueAt).slice(0, 3);
  const sessionRows = (plan.data?.items ?? []).filter((item) => item.kind === 'session').slice(0, Math.max(0, 3 - teacherRows.length));
  const dateLine = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
  const streakDays = streak.data?.currentDays ?? 0;

  const wordFor = (conceptId: string) => progress.data?.masteryWords.find((row) => row.conceptId === conceptId)?.word ?? 'New';
  const isMastered = (word: string) => word === 'Mastered' || word === 'Top form';
  const conceptNodes = (() => {
    const list = (concepts.data ?? []).slice(0, 5);
    let learningGiven = false;
    return list.map((concept) => {
      const word = wordFor(concept.id);
      if (isMastered(word)) return { concept, state: 'mastered' as const, note: word };
      if (!learningGiven) {
        learningGiven = true;
        return { concept, state: 'learning' as const, note: word };
      }
      return { concept, state: 'next' as const, note: word };
    });
  })();

  return <div className="vs-home" data-testid="student-home">
    <StaleNote stale={stale || plan.stale || progress.stale} updatedAt={plan.updatedAt ?? updatedAt} message={plan.message ?? progress.message ?? message} testId="updated-at" />
    <div className="vs-home-grid">
      <div className="vs-home-main">
        <section className="vs-home-hero">
          <div className="vs-home-hero-copy">
            <span className="vs-home-date">{dateLine}</span>
            <h1>Namaste, <span className="vs-home-name">{me.profile.name}</span></h1>
            <p>School day ends, but your learning continues here.</p>
          </div>
          <div className="vs-home-saathy">
            <span className="vs-home-bubble">{streakDays > 0 ? `${streakDays}-day streak! Let’s keep going` : 'Let’s start today!'}</span>
            <SaathyMascot className="vs-home-mascot" size={112} alt="Saathy" />
          </div>
        </section>

        <section className="vs-home-continue vs-sketch" aria-labelledby="home-continue">
          {plan.status === 'loading' && !plan.data ? <Skeleton /> : plan.status === 'error' && !plan.data ? <Retry what="your next step" onRetry={plan.reload} /> : next ? (() => {
            const copy = nextCopy(next);
            const subject = nextChapter ? subjectById.get(nextChapter.subjectId) : null;
            return <>
              <div>
                <span className="vs-home-tag">{[subject?.name, nextChapter?.title].filter(Boolean).join(' · ') || 'Up next'}</span>
                <p className="vs-home-eyebrow" id="home-continue">Continue your learning</p>
                <h2>{next.title}</h2>
                <p className="vs-home-blurb">{copy.blurb}</p>
                <div className="vs-home-row">
                  <Link className="vs-home-cta" to={planHref(next)}>{copy.cta} <span aria-hidden="true">→</span></Link>
                  <span className="vs-home-chip">{copy.chip}</span>
                </div>
              </div>
              <Link className="vs-home-thumb" to={planHref(next)} aria-label={`${copy.cta}: ${next.title}`}>
                <svg viewBox="0 0 220 128" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                  <rect width="220" height="128" fill="#bfe3f5" /><circle cx="178" cy="28" r="16" fill="#d4a017" opacity=".8" />
                  <path d="M0 86 L80 86 L130 42 L220 42 V128 H0 Z" fill="#d3e4d4" /><path d="M0 102 L100 102 L145 68 L220 68 V128 H0 Z" fill="#a9c9ae" />
                  <path d="M28 102 L78 102 L118 74 L160 74" fill="none" stroke="#041d3d" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 4" />
                  <g stroke="#041d3d" strokeWidth="2.3" fill="none" strokeLinecap="round"><circle cx="112" cy="62" r="6.5" /><path d="M112 69 V84M112 74 L102 80M112 74 L122 78M112 84 L104 98M112 84 L120 98" /></g>
                  <path d="M160 74 V48" stroke="#041d3d" strokeWidth="2.2" /><path d="M160 48 L178 55 L160 62 Z" fill="#041d3d" />
                </svg>
                <span className="vs-home-play">Play</span>
              </Link>
            </>;
          })() : <div>
            <p className="vs-home-eyebrow" id="home-continue">Continue your learning</p>
            <h2>Nothing waiting right now</h2>
            <p className="vs-home-blurb">Your teacher has not shared anything new. Open a subject to explore a chapter.</p>
            <div className="vs-home-row"><Link className="vs-home-cta" to="/student?panel=subjects">Explore subjects <span aria-hidden="true">→</span></Link></div>
          </div>}
        </section>

        <section className="vs-home-subjects vs-sketch" aria-labelledby="home-subjects">
          <div className="vs-home-head"><h2 id="home-subjects">Your subjects</h2><Link to="/student?panel=subjects">View all →</Link></div>
          {subjects.status === 'loading' && !subjects.data ? <Skeleton /> : subjects.status === 'error' && !subjects.data ? <Retry what="your subjects" onRetry={subjects.reload} /> : subjects.data?.length ? <div className="vs-home-subject-grid">{subjects.data.map((subject, index) => {
            const current = chapters ? currentChapter(chapters, subject.id) : null;
            const own = (progress.data?.concepts ?? []).filter((item) => item.subjectId === subject.id);
            const order = ["Let's fix this", 'Almost there', 'New', 'Mastered', 'Top form'];
            const words = own.map((item) => wordFor(item.conceptId));
            const headline = order.find((word) => words.some((item) => item === word)) ?? (own.length ? 'New' : 'Not started yet');
            return <Link className={`vs-home-subject is-${ACCENTS[index % ACCENTS.length]}`} key={subject.id} to={`/student/subjects/${subject.id}`}>
              <span className="vs-home-subject-icon"><SubjectIcon name={subject.name} /></span>
              <strong>{subject.name}</strong>
              <small>{current ? current.title : chapters ? 'No chapters yet' : '…'}</small>
              <small className="vs-home-frac">{headline}</small>
            </Link>;
          })}</div> : <p className="vs-home-empty">Your teacher has not added a subject yet.</p>}
        </section>

        <div className="vs-home-extras">
          <section className="vs-home-week vs-sketch" aria-labelledby="home-week">
            <h2 id="home-week">This week</h2>
            <p className="vs-home-sub">{streak.data ? `${streakDays}-day streak · best ${streak.data.longestDays}` : streak.status === 'error' ? 'Your week could not load just now.' : 'Loading your week…'}</p>
            <ol className="vs-home-days">{days.map((day) => <li key={day.date} className={`${day.practiced ? 'is-on' : ''} ${day.date === today ? 'is-today' : ''}`} aria-label={`${day.date}: ${day.practiced ? 'practised' : 'not practised'}`}><i /><span>{dayLabel(day.date)}</span></li>)}</ol>
          </section>
          {game ? <Link className="vs-home-game vs-sketch" to={`/student/chapters/${game.chapter.id}/practice/engine/${game.game.id}`}>
            <GameThumb id={game.game.id} />
            <span><strong>Today’s game</strong><small>{game.game.title} · {game.game.hook}</small><em>Play →</em></span>
          </Link> : null}
        </div>

        {pathChapter ? <section className="vs-home-path vs-sketch" aria-labelledby="home-path">
          <div className="vs-home-head"><h2 id="home-path">Your learning path · {[pathSubject?.name, pathChapter.title].filter(Boolean).join(': ')}</h2><Link to={`/student/chapters/${pathChapter.id}`}>See chapter →</Link></div>
          {concepts.status === 'loading' && !concepts.data ? <Skeleton /> : concepts.status === 'error' && !concepts.data ? <Retry what="this chapter" onRetry={concepts.reload} /> : conceptNodes.length ? <ol className="vs-home-nodes" style={{ ['--nodes' as string]: conceptNodes.length }}>{conceptNodes.map(({ concept, state, note }) => <li key={concept.id} className={`is-${state}`}>
            <Link to={`/student/chapters/${pathChapter.id}/concepts/${concept.id}`}>
              <span className="vs-home-orb" aria-hidden="true"><PathGlyph state={state} /></span>
              <span className="vs-home-state">{note}</span>
              <strong>{concept.title}</strong>
            </Link></li>)}</ol> : <p className="vs-home-empty">Your teacher is still adding ideas to this chapter.</p>}
        </section> : null}
      </div>

      <aside className="vs-home-rail" aria-label="Today">
        <section className="vs-home-goals vs-sketch" aria-labelledby="home-goals">
          <div className="vs-home-head"><h2 id="home-goals">Today’s goal</h2><span className="vs-home-count">{doneCount} / {goals.length}</span></div>
          <span className="vs-home-bar is-goal" aria-hidden="true"><i style={{ width: `${Math.round((doneCount / goals.length) * 100)}%` }} /></span>
          <ul>{goals.map((goal) => <li key={goal.id}><button type="button" className={isDone(goal) ? 'is-done' : ''} aria-pressed={isDone(goal)} disabled={goal.auto} onClick={() => { toggleGoal(goal.id); }}><span className="vs-home-box">{isDone(goal) ? <Check /> : null}</span><span>{goal.label}</span></button></li>)}</ul>
        </section>

        <Link className="vs-home-help vs-sketch" to="/student?panel=ask">
          <SaathyMascot className="vs-home-help-mascot" size={56} alt="" />
          <span><strong>Need help understanding?</strong><small>Ask Saathy anything, anytime.</small></span>
        </Link>

        <section className="vs-home-teacher vs-sketch" aria-labelledby="home-teacher">
          <div className="vs-home-head"><h2 id="home-teacher">From your teacher</h2><Link to="/student?panel=homework">View all</Link></div>
          {progress.status === 'loading' && !progress.data ? <Skeleton /> : progress.status === 'error' && !progress.data ? <Retry what="your homework" onRetry={progress.reload} /> : teacherRows.length || sessionRows.length ? <ul>
            {teacherRows.map((item) => { const tag = assignmentTag(item, now); const chapter = chapterById.get(item.chapterId); return <li key={item.id}><Link to={`/student/assignments/${item.id}`}><span><strong>{item.title}</strong><small>{[chapter ? subjectById.get(chapter.subjectId)?.name : null, item.kind === 'quiz' ? 'Quiz' : 'Homework', item.teacherName].filter(Boolean).join(' · ')}</small></span><span className={`vs-home-pill is-${tag.tone}`}>{tag.label}</span></Link></li>; })}
            {sessionRows.map((item) => { const chapter = chapterById.get(item.chapterId); return <li key={item.id}><Link to={planHref(item)}><span><strong>{item.title}</strong><small>{[chapter ? subjectById.get(chapter.subjectId)?.name : null, 'Session'].filter(Boolean).join(' · ')}</small></span><span className="vs-home-pill is-today">{item.resumeAt > 0 ? 'In progress' : 'New'}</span></Link></li>; })}
          </ul> : <p className="vs-home-empty">No homework right now. Enjoy!</p>}
        </section>

        <section className="vs-home-style vs-sketch" aria-labelledby="home-style">
          <h2 id="home-style">Learn your way</h2>
          <div className="vs-home-toggle" role="radiogroup" aria-label="Learning style">{(['visual', 'story', 'practice'] as Style[]).map((value) => <button role="radio" aria-checked={style === value} className={style === value ? 'is-selected' : ''} key={value} onClick={() => { saveStyle(value); }} type="button">{value === 'visual' ? 'See it' : value === 'story' ? 'Story' : 'Try it'}</button>)}</div>
          <p className="vs-home-sub">Saathy will put {style === 'visual' ? 'diagrams and examples' : style === 'story' ? 'short stories and explanations' : 'hands-on questions'} first.</p>
        </section>
      </aside>
    </div>
  </div>;
}
