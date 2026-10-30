import { HomeworkListSchema, ProgressSchema, StudentEnrollmentSchema } from '@vidhyasaathy/contracts';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJson } from '../../../api/client';
import { ChapterListSchema } from '../../../content/schemas';
import { SubjectListSchema } from '../../../setup/schemas';
import { useRemote } from '../../../setup/useRemote';
import { Icon } from '../icons';
import { Saathy } from '../Saathy';
import { Chip, MasteryChip, PageHead, ProgressBar, SUBJECT_COLOR, SubjectIcon, subjectKey, Tabs } from '../ui';
import '../pages/subjects.css';

type Chapter = { id: string; title: string; subjectId: string; position: number; status: 'not_started' | 'in_progress' | 'completed' };

function useChapters(ids: string) {
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!ids) return;
    const controller = new AbortController();
    setFailed(false);
    void Promise.all(ids.split(',').map((id) => getJson(`/subjects/${id}/chapters`, ChapterListSchema, controller.signal).catch(() => null)))
      .then((lists) => {
        if (controller.signal.aborted) return;
        if (lists.some((list) => list === null)) setFailed(true);
        setChapters(lists.flatMap((list) => list ?? []));
      });
    return () => { controller.abort(); };
  }, [ids]);
  return { chapters: ids ? chapters : [], failed };
}

function dueLabel(dueAt: number, now: number) {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(dueAt));
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(now));
  if (dueAt < now) return { text: 'overdue', tone: 'red' as const };
  if (day === today) return { text: 'today', tone: 'orange' as const };
  return { text: new Date(dueAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }), tone: 'sand' as const };
}

export function SubjectsBoard({ query }: { query: string }) {
  const subjects = useRemote('/student/subjects', SubjectListSchema);
  const progress = useRemote('/progress', ProgressSchema);
  const homework = useRemote('/student/homework', HomeworkListSchema);
  const enrollment = useRemote('/student/enrollment', StudentEnrollmentSchema);
  const ids = subjects.data?.map((subject) => subject.id).join(',') ?? '';
  const { chapters, failed } = useChapters(ids);
  const [tab, setTab] = useState('all');
  const needle = query.trim().toLowerCase();
  const now = Date.now();
  const week = now + 7 * 24 * 60 * 60 * 1000;
  const words = progress.data?.masteryWords ?? [];

  if (subjects.denied) return <section className="nb-card"><h1 className="nb-h1">This page is closed</h1><p className="nb-note">Subjects are not open for this login.</p></section>;
  if (subjects.status === 'loading' && !subjects.data) return <div className="nb-grid"><div className="nb-skel" /><div className="nb-skel" /></div>;
  if (subjects.status === 'error' && !subjects.data) return <p className="nb-empty" role="alert">Could not load subjects. <button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" onClick={subjects.reload}>Try again</button></p>;

  const open = (homework.data?.items ?? []).filter((item) => item.status === 'todo' || item.status === 'overdue');
  const cards = (subjects.data ?? []).map((subject) => {
    const own = (chapters ?? []).filter((chapter) => chapter.subjectId === subject.id).sort((a, b) => a.position - b.position);
    const current = own.find((chapter) => chapter.status === 'in_progress') ?? own.find((chapter) => chapter.status === 'not_started') ?? own[0];
    const rows = words.filter((row) => own.some((chapter) => chapter.id === row.chapterId));
    const done = rows.filter((row) => row.word === 'Mastered' || row.word === 'Top form').length;
    const order = ["Let's fix this", 'Almost there', 'New', 'Mastered', 'Top form'] as const;
    const headline = order.find((word) => rows.some((row) => row.word === word)) ?? (rows.length ? 'New' : '');
    const nextIdea = rows.find((row) => row.word !== 'Mastered' && row.word !== 'Top form');
    const due = open.find((item) => item.subject === subject.name);
    return { subject, current, rows, done, headline, nextIdea, due };
  }).filter((card) => {
    if (!needle) return true;
    const own = (chapters ?? []).filter((chapter) => chapter.subjectId === card.subject.id);
    return card.subject.name.toLowerCase().includes(needle) || own.some((chapter) => chapter.title.toLowerCase().includes(needle));
  });
  const look = cards.filter((card) => card.headline === "Let's fix this");
  const dueWeek = cards.filter((card) => card.due && (card.due.status === 'overdue' || card.due.dueAt <= week));
  const shown = tab === 'look' ? look : tab === 'due' ? dueWeek : cards;
  const fix = words.find((row) => row.word === "Let's fix this");
  const place = enrollment.data?.className && enrollment.data.sectionName ? `${enrollment.data.className}-${enrollment.data.sectionName}` : '';
  const dateLine = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });

  return <div className="nb-grid">
    <div className="nb-col">
      <PageHead title="Your subjects" sub={[place, dateLine, 'pick one and carry on'].filter(Boolean).join(' · ')} />
      <Tabs tabs={[
        { id: 'all', label: `All ${cards.length}` },
        { id: 'look', label: `Needs a look · ${look.length}` },
        { id: 'due', label: `Due this week · ${dueWeek.length}` },
      ]} active={tab} onChange={setTab} />
      {failed ? <p className="nb-empty" role="alert">Some chapters could not load.</p> : null}
      {shown.length ? <div className="sj-grid">{shown.map((card) => {
        const pct = card.rows.length ? Math.round((card.done / card.rows.length) * 100) : 0;
        const tag = card.due ? dueLabel(card.due.dueAt, now) : null;
        return <Link className="nb-card sj-card" key={card.subject.id} to={`/student/subjects/${card.subject.id}`}>
          <div className="top"><SubjectIcon subject={card.subject.name} large />{tag ? <Chip tone={tag.tone === 'red' ? 'red' : tag.tone === 'orange' ? 'orange' : 'sand'}>{tag.text}</Chip> : null}</div>
          <div><h2>{card.subject.name}</h2><div className="ch">{card.current ? card.current.title : 'No chapter yet'}</div></div>
          {card.nextIdea ? <div className="next"><Icon name="arrow" />{card.nextIdea.word === "Let's fix this" ? 'Revise' : 'Up next'}: {card.nextIdea.title}</div> : <div className="next">No idea lined up yet</div>}
          {card.headline ? <div><MasteryChip level={card.headline} /></div> : null}
          <div className="foot"><div className="l"><span className="nb-meta">{card.rows.length ? `${card.done} of ${card.rows.length} ideas` : 'No ideas yet'}</span>{card.rows.length ? <span className="nb-meta">{pct}%</span> : null}</div>{card.rows.length ? <ProgressBar value={pct} color={SUBJECT_COLOR[subjectKey(card.subject.name)]} /> : null}</div>
        </Link>;
      })}</div> : <p className="nb-empty">{needle ? 'Nothing matches that search.' : tab === 'all' ? 'Your teacher has not added a subject yet.' : 'Nothing in this tab.'}</p>}
    </div>
    <aside className="nb-col">
      <section className="nb-card">
        <div className="nb-card__head"><h3 className="nb-h3">Due soon</h3><Link className="nb-link" style={{ fontSize: '1rem' }} to="/student?panel=homework">Homework <Icon name="arrow" /></Link></div>
        {homework.status === 'error' && !homework.data ? <p className="nb-empty" role="alert">Could not load homework. <button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" onClick={homework.reload}>Try again</button></p> : open.length ? open.slice(0, 4).map((item) => {
          const tag = dueLabel(item.dueAt, now);
          return <Link className="due" key={item.id} to="/student?panel=homework"><i style={{ background: tag.tone === 'red' ? 'var(--nb-redpen)' : 'var(--nb-orange)' }} />{item.title}<span>{tag.text}</span></Link>;
        }) : <p className="nb-empty">Nothing is due.</p>}
      </section>
      {fix ? <section className="nb-sticky nb-sticky--pink" style={{ margin: '.4rem .3rem' }}>
        <span className="nb-tape nb-tape--sky" style={{ width: '4.5rem', top: '-.6rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '.8rem', alignItems: 'center' }}>
          <Saathy mood="think" size="3.6rem" />
          <div>{fix.title} needs another look.<br /><Link className="nb-link" style={{ fontSize: '1.05rem' }} to={`/student/chapters/${fix.chapterId}/concepts/${fix.conceptId}`}>Revise with me <Icon name="arrow" /></Link></div>
        </div>
      </section> : <section className="nb-sticky nb-sticky--pink" style={{ margin: '.4rem .3rem' }}><span className="nb-sticky__who">Saathy</span><p className="nb-note">Nothing needs a second look right now.</p></section>}
      <section className="nb-card nb-grow">
        <div className="nb-card__head"><h3 className="nb-h3">Time this week</h3></div>
          <p className="nb-empty">Study time will appear here when it is available.</p>
      </section>
    </aside>
  </div>;
}
