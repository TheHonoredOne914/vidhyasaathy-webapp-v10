import { ProgressSchema, StreakSchema } from '@vidhyasaathy/contracts';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJson } from '../../../api/client';
import { ChapterListSchema } from '../../../content/schemas';
import { SubjectListSchema } from '../../../setup/schemas';
import { useRemote } from '../../../setup/useRemote';
import { Icon } from '../icons';
import { Saathy } from '../Saathy';
import { Chip, MasteryChip, PageHead, ProgressBar, SUBJECT_COLOR, SubjectIcon, subjectKey } from '../ui';
import '../pages/subjects.css';

type Chapter = { id: string; title: string; subjectId: string; position: number; status: 'not_started' | 'in_progress' | 'completed' };

function useChapters(ids: string) {
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  useEffect(() => {
    if (!ids) return;
    const controller = new AbortController();
    void Promise.all(ids.split(',').map((id) => getJson(`/subjects/${id}/chapters`, ChapterListSchema, controller.signal).catch(() => [])))
      .then((lists) => { if (!controller.signal.aborted) setChapters(lists.flat()); });
    return () => { controller.abort(); };
  }, [ids]);
  return ids ? chapters : [];
}

function dueLabel(dueAt: number, now: number) {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(dueAt));
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(now));
  if (dueAt < now) return { text: 'Overdue', tone: 'red' as const };
  if (day === today) return { text: 'Today', tone: 'orange' as const };
  return { text: new Date(dueAt).toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' }), tone: 'sand' as const };
}

export function SubjectsBoard({ query }: { query: string }) {
  const subjects = useRemote('/student/subjects', SubjectListSchema);
  const progress = useRemote('/progress', ProgressSchema);
  const streak = useRemote('/practice/streak', StreakSchema);
  const ids = subjects.data?.map((subject) => subject.id).join(',') ?? '';
  const chapters = useChapters(ids);
  const needle = query.trim().toLowerCase();
  const now = Date.now();
  const words = progress.data?.masteryWords ?? [];
  const open = (progress.data?.assignments ?? []).filter((item) => item.score?.status !== 'completed').sort((a, b) => a.dueAt - b.dueAt);
  const fix = words.find((row) => row.word === "Let's fix this");

  if (subjects.status === 'loading' && !subjects.data) return <div className="nb-skel" />;
  if (subjects.status === 'error' && !subjects.data) return <p className="nb-empty" role="alert">Could not load subjects. <button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" onClick={subjects.reload}>Try again</button></p>;

  const cards = (subjects.data ?? []).filter((subject) => {
    if (!needle) return true;
    const own = (chapters ?? []).filter((chapter) => chapter.subjectId === subject.id);
    return subject.name.toLowerCase().includes(needle) || own.some((chapter) => chapter.title.toLowerCase().includes(needle));
  });

  return <div className="nb-grid">
    <div className="nb-col">
      <PageHead eyebrow="Subjects" title="Your subjects" sub="Open a chapter and keep going." />
      {cards.length ? <div className="sj-grid">{cards.map((subject) => {
        const own = (chapters ?? []).filter((chapter) => chapter.subjectId === subject.id).sort((a, b) => a.position - b.position);
        const current = own.find((chapter) => chapter.status === 'in_progress') ?? own.find((chapter) => chapter.status === 'not_started') ?? own[0];
        const rows = words.filter((row) => own.some((chapter) => chapter.id === row.chapterId));
        const done = rows.filter((row) => row.word === 'Mastered' || row.word === 'Top form').length;
        const order = ["Let's fix this", 'Almost there', 'New', 'Mastered', 'Top form'];
        const headline = order.find((word) => rows.some((row) => row.word === word)) ?? 'New';
        const nextIdea = rows.find((row) => row.word !== 'Mastered' && row.word !== 'Top form');
        const due = open.find((item) => own.some((chapter) => chapter.id === item.chapterId));
        const tag = due ? dueLabel(due.dueAt, now) : null;
        return <Link className="nb-card sj-card" key={subject.id} to={`/student/subjects/${subject.id}`}>
          <div className="top"><SubjectIcon subject={subject.name} large />{tag ? <Chip tone={tag.tone}>{tag.text}</Chip> : null}</div>
          <h2>{subject.name}</h2>
          <div className="ch">{current ? current.title : 'No chapter yet'}</div>
          {nextIdea ? <div className="next"><Icon name="arrow" />Next: {nextIdea.title}</div> : null}
          <div className="foot"><div className="l"><MasteryChip level={headline} /><span className="nb-meta">{rows.length ? `${done} / ${rows.length} ideas` : 'No ideas yet'}</span></div><ProgressBar value={rows.length ? (done / rows.length) * 100 : 0} color={SUBJECT_COLOR[subjectKey(subject.name)]} /></div>
        </Link>;
      })}</div> : <p className="nb-empty">{needle ? 'Nothing matches that search.' : 'Your teacher has not added a subject yet.'}</p>}
    </div>
    <aside className="nb-col">
      <section className="nb-card"><div className="nb-card__head"><h3 className="nb-h3">Due soon</h3></div>
        {open.length ? open.slice(0, 4).map((item) => { const tag = dueLabel(item.dueAt, now); return <div className="due" key={item.id}><i style={{ background: 'var(--nb-orange)' }} /><Link to={`/student/assignments/${item.id}`}>{item.title}</Link><Chip tone={tag.tone}>{tag.text}</Chip></div>; }) : <p className="nb-empty">Nothing is due.</p>}
      </section>
      {fix ? <div className="nb-sticky nb-sticky--pink"><div className="nb-sticky__who">{fix.title}</div><p className="nb-note">{fix.word}</p><Saathy mood="think" size="3.2rem" /></div> : null}
      <section className="nb-card nb-grow"><div className="nb-card__head"><h3 className="nb-h3">Time this week</h3></div>
        {(streak.data?.days ?? []).map((day) => <div className="wk" key={day.date}><span>{new Date(`${day.date}T12:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' })}</span><ProgressBar value={day.practiced ? 100 : 0} color="var(--nb-blue)" /><span className="nb-meta">{day.practiced ? 'Yes' : '—'}</span></div>)}
        {streak.status === 'error' && !streak.data ? <p className="nb-empty">Could not load this week.</p> : null}
      </section>
    </aside>
  </div>;
}
