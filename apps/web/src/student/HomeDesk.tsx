import { useEffect, useState } from 'react';
import type { Assignment, Me, PlanItem } from '@vidhyasaathy/contracts';
import { PracticeNextSchema, ProgressSchema, StreakSchema, StudyPlanSchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { planHref } from '../ai/plan';
import { getJson } from '../api/client';
import { ChapterListSchema, ConceptListSchema } from '../content/schemas';
import { SubjectListSchema } from '../setup/schemas';
import { useRemote } from '../setup/useRemote';
import { StaleNote } from '../ui/StaleNote';
import { Icon } from './notebook/icons';
import { Saathy } from './notebook/Saathy';
import { Bubble, Chip, MasteryChip, ProgressBar, SUBJECT_COLOR, SubjectIcon, subjectKey } from './notebook/ui';
import './notebook/pages/home.css';

type Chapter = { id: string; title: string; subjectId: string; position: number; status: 'not_started' | 'in_progress' | 'completed' };
type Subject = { id: string; name: string };
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

function Retry({ what, onRetry }: { what: string; onRetry: () => void }) {
  return <p className="vs-home-empty vs-home-retry" role="status">Could not load {what} just now. <button type="button" onClick={onRetry}>Try again</button></p>;
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
  const challenge = useRemote(pathChapter ? `/chapters/${pathChapter.id}/practice/next` : null, PracticeNextSchema);
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
  const teacherRows = [...(progress.data?.assignments ?? [])].sort((a, b) => a.dueAt - b.dueAt).slice(0, 3);
  const sessionRows = (plan.data?.items ?? []).filter((item) => item.kind === 'session').slice(0, Math.max(0, 3 - teacherRows.length));
  const dateLine = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
  const first = me.profile.name.trim().split(/\s+/)[0] ?? me.profile.name;
  const wordFor = (conceptId: string) => progress.data?.masteryWords.find((row) => row.conceptId === conceptId)?.word ?? 'New';
  const isMastered = (word: string) => word === 'Mastered' || word === 'Top form';
  const conceptNodes = (() => {
    const list = (concepts.data ?? []).slice(0, 5);
    let currentGiven = false;
    return list.map((concept) => {
      const word = wordFor(concept.id);
      if (isMastered(word)) return { concept, state: 'done' as const, note: word };
      if (!currentGiven) {
        currentGiven = true;
        return { concept, state: word === "Let's fix this" ? 'fix' as const : 'now' as const, note: word };
      }
      return { concept, state: word === "Let's fix this" ? 'fix' as const : 'new' as const, note: word };
    });
  })();
  const weekCount = days.filter((day) => day.practiced).length;
  const goalPct = goals.length ? Math.round((doneCount / goals.length) * 100) : 0;
  function chipTone(tone: string): 'green' | 'orange' | 'red' | 'sand' | 'sky' {
    if (tone === 'late') return 'red';
    if (tone === 'today') return 'orange';
    if (tone === 'done') return 'green';
    return 'sand';
  }

  return <div className="pg-home" data-testid="student-home">
    <StaleNote stale={stale || plan.stale || progress.stale} updatedAt={plan.updatedAt ?? updatedAt} message={plan.message ?? progress.message ?? message} testId="updated-at" />
    <div className="nb-grid">
      <div className="home-hero">
        <div>
          <div className="nb-head__eyebrow">{dateLine}</div>
          <h1 className="nb-h1" style={{ fontSize: '3.1rem' }}>Namaste, {first} <Icon name="hand" className="wave" /></h1>
          <svg className="nb-scribble" style={{ width: '9rem' }} viewBox="0 0 140 10" preserveAspectRatio="none" aria-hidden="true"><path d="M2 6c20-4 40 3 60-1s45-3 76 0" stroke="#E8B84A" strokeWidth="3.5" fill="none" strokeLinecap="round" /></svg>
          <p className="nb-sub">{streak.data ? streak.data.currentDays + ' day streak. Pick up where you left off.' : 'Pick up where you left off.'}</p>
        </div>
        <div className="home-hero__saathy nb-hide-m"><Bubble hand>Let's keep going!</Bubble><Saathy mood="cheer" size="7.5rem" /></div>
      </div>
      <section className="nb-card home-continue">
        <span className="nb-tape nb-tape--left" />
        {plan.status === 'loading' && !plan.data ? <div className="nb-skel" /> : plan.status === 'error' && !plan.data ? <Retry what="your next step" onRetry={plan.reload} /> : next ? (() => {
          const copy = nextCopy(next);
          const subject = nextChapter ? subjectById.get(nextChapter.subjectId) : null;
          return <>
            <div>
              <Chip tone="orange">Your next step{subject ? ' · ' + subject.name : ''}</Chip>
              <h2>{next.title}</h2>
              <p className="why"><Icon name="bulb" /><span>{copy.blurb}</span></p>
              <div className="row"><Link className="nb-btn nb-btn--primary nb-btn--lg" to={planHref(next)}>{copy.cta} <Icon name="arrow" /></Link><Chip tone="sky" dashed><Icon name="clock" /> {copy.chip}</Chip></div>
            </div>
            <div className="home-thumb nb-hide-m" aria-hidden="true">
              <svg viewBox="0 0 260 150" preserveAspectRatio="xMidYMid slice"><rect width="260" height="150" fill="#DCEAF6" />
                <g stroke="#B8CDE6" strokeWidth="1"><path d="M0 18H260" /><path d="M0 36H260" /><path d="M0 54H260" /><path d="M0 72H260" /><path d="M0 90H260" /><path d="M0 108H260" /><path d="M0 126H260" /><path d="M0 144H260" /></g>
                <path d="M30 125V20M30 125H240" stroke="#1B2A4A" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M30 120 Q120 112 220 30" stroke="#3D6FB8" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
            </div>
          </>;
        })() : <div><Chip tone="orange">Your next step</Chip><h2>Pick a subject to start</h2><p className="why">Your teacher has not shared a next step yet.</p><div className="row"><Link className="nb-btn nb-btn--primary nb-btn--lg" to="/student?panel=subjects">Open subjects <Icon name="arrow" /></Link></div></div>}
      </section>
      <section className="nb-card subjects-card">
        <div className="nb-card__head"><h3 className="nb-h3">Your subjects</h3><Link className="nb-link" to="/student?panel=subjects">View all <Icon name="arrow" /></Link></div>
        {subjects.status === 'loading' && !subjects.data ? <div className="nb-skel" /> : subjects.status === 'error' && !subjects.data ? <Retry what="your subjects" onRetry={subjects.reload} /> : subjects.data?.length ? <div className="home-subjects">{subjects.data.slice(0, 4).map((subject) => {
          const current = chapters ? currentChapter(chapters, subject.id) : null;
          const rows = (progress.data?.masteryWords ?? []).filter((row) => chapterById.get(row.chapterId)?.subjectId === subject.id);
          const doneIdeas = rows.filter((row) => isMastered(row.word)).length;
          const order = ["Let's fix this", 'Almost there', 'New', 'Mastered', 'Top form'];
          const headline = order.find((word) => rows.some((row) => row.word === word)) ?? 'New';
          const pct = rows.length ? Math.round((doneIdeas / rows.length) * 100) : 0;
          return <div className="home-subj" key={subject.id}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><SubjectIcon subject={subject.name} /><MasteryChip level={headline} /></div><div><b>{subject.name}</b><div className="ch">{current ? current.title : chapters ? 'No chapter yet' : '…'}</div></div><ProgressBar value={pct} color={SUBJECT_COLOR[subjectKey(subject.name)]} /><div className="foot"><span className="nb-meta">{rows.length ? doneIdeas + ' / ' + rows.length + ' ideas' : 'No ideas yet'}</span><Link className="nb-link" style={{ fontSize: '1rem' }} to={'/student/subjects/' + subject.id}>Open <Icon name="arrow" /></Link></div></div>;
        })}</div> : <p className="nb-empty">Your teacher has not added a subject yet.</p>}
      </section>
      <section className="nb-card home-path">
        <div className="nb-card__head"><h3 className="nb-h3">Your path{pathSubject ? ' · ' + pathSubject.name : ''}{pathChapter ? ': ' + pathChapter.title : ''}</h3>{pathChapter ? <Link className="nb-link" to={'/student/subjects/' + pathChapter.subjectId}>See full map <Icon name="arrow" /></Link> : null}</div>
        {pathChapter && concepts.status === 'loading' && !concepts.data ? <div className="nb-skel" /> : conceptNodes.length && pathChapter ? <div className="path">{conceptNodes.map(({ concept, state, note }) => <Link className={'pnode ' + state} key={concept.id} to={'/student/chapters/' + pathChapter.id + '/concepts/' + concept.id}><div className="orb"><Icon name={state === 'done' ? 'check' : state === 'fix' ? 'refresh' : state === 'now' ? 'book' : 'sparkle'} /></div><MasteryChip level={note} /><b>{concept.title}</b></Link>)}</div> : <p className="nb-empty">{pathChapter ? 'Your teacher is still adding ideas to this chapter.' : 'Pick a subject to see your path.'}</p>}
      </section>
      <aside className="rail nb-col">
        <section className="nb-card">
          <div className="nb-card__head"><h3 className="nb-h3">Today's goal</h3><span className="nb-meta">{doneCount} / {goals.length}</span></div>
          <div style={{ marginBottom: 'var(--nb-s3)' }}><ProgressBar value={goalPct} /></div>
          {goals.map((goal) => <button type="button" className={isDone(goal) ? 'goal done' : 'goal'} key={goal.id} aria-pressed={isDone(goal)} disabled={goal.auto} onClick={() => { toggleGoal(goal.id); }}><div className="ck">{isDone(goal) ? <Icon name="check" /> : null}</div><span>{goal.label}</span></button>)}
        </section>
        <section className="nb-card challenge">
          <span className="nb-sticky__who">Daily challenge</span>
          <p className="nb-note" style={{ margin: '.2rem 0 .5rem' }}>{challenge.data?.item ? challenge.data.item.prompt : pathChapter ? 'A short question from this chapter is on its way.' : 'Open a subject to get a challenge.'}</p>
          {pathChapter ? <Link className="nb-btn nb-btn--ghost nb-btn--sm" to={'/student/chapters/' + pathChapter.id + '/practice/quick_revision_quiz'}>Try it</Link> : null}
        </section>
        <section className="nb-card">
          <div className="nb-card__head"><h3 className="nb-h3">This week</h3><span className="nb-meta">{weekCount} days</span></div>
          {streak.status === 'error' && !streak.data ? <Retry what="your week" onRetry={streak.reload} /> : <div className="days">{days.map((day) => <div key={day.date} className={'day' + (day.date === today ? ' today' : '') + (day.practiced && day.date !== today ? ' on' : '')}><i>{day.practiced && day.date !== today ? <Icon name="check" /> : null}</i>{dayLabel(day.date)}</div>)}</div>}
        </section>
        <section className="nb-card nb-grow">
          <div className="nb-card__head"><h3 className="nb-h3">From your teacher</h3><Link className="nb-link" style={{ fontSize: '1rem' }} to="/student?panel=homework">View all</Link></div>
          {progress.status === 'loading' && !progress.data ? <div className="nb-skel" /> : progress.status === 'error' && !progress.data ? <Retry what="your homework" onRetry={progress.reload} /> : teacherRows.length || sessionRows.length ? <>
            {teacherRows.map((item) => { const tag = assignmentTag(item, now); const chapter = chapterById.get(item.chapterId); return <Link className="nb-row" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }} key={item.id} to={'/student/assignments/' + item.id}><div><div className="nb-row__t" style={{ fontSize: '1.12rem' }}>{item.title}</div><div className="nb-row__s">{[chapter ? subjectById.get(chapter.subjectId)?.name : null, item.teacherName].filter(Boolean).join(' · ')}</div></div><Chip tone={chipTone(tag.tone)}>{tag.label}</Chip></Link>; })}
            {sessionRows.map((item) => { const chapter = chapterById.get(item.chapterId); return <Link className="nb-row" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }} key={item.id} to={planHref(item)}><div><div className="nb-row__t" style={{ fontSize: '1.12rem' }}>{item.title}</div><div className="nb-row__s">{[chapter ? subjectById.get(chapter.subjectId)?.name : null, 'Session'].filter(Boolean).join(' · ')}</div></div><Chip tone="sky">{item.resumeAt > 0 ? 'In progress' : 'New'}</Chip></Link>; })}
          </> : <p className="nb-empty">No homework right now.</p>}
          <Link className="nb-saathy-tip" style={{ marginTop: 'var(--nb-s3)' }} to="/student?panel=ask"><Saathy mood="happy" size="3.4rem" /><div><b className="nb-h3" style={{ fontSize: '1.2rem' }}>Stuck on something?</b><div className="nb-text">Ask Saathy. Hints first, never just answers.</div></div></Link>
        </section>
      </aside>
    </div>
  </div>;
}
