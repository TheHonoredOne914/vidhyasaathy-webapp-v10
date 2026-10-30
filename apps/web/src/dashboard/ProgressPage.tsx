import { BadgeShelfSchema, ProgressSchema, StudentHomeSchema, StudentStreakSchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { useRemote } from '../setup/useRemote';
import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { Card, Chip, MasteryChip, PageHead, Sticky, SUBJECT_COLOR, subjectKey } from '../student/notebook/ui';
import { Icon } from '../student/notebook/icons';
import { NotebookState } from '../student/notebook/screens/polish3b/NotebookState';
import { monthAward, monthDays } from '../student/notebook/screens/polish3b/progress';
import '../student/notebook/pages/progress.css';

function nextFor(word: string, chapterId: string, conceptId: string) {
  if (word === "Let's fix this") return { href: `/student/chapters/${chapterId}/concepts/${conceptId}`, label: 'Fix it' };
  if (word === 'Almost there') return { href: `/student/chapters/${chapterId}/practice/quick_revision_quiz`, label: 'Continue' };
  return { href: `/student/chapters/${chapterId}/concepts/${conceptId}`, label: word === 'New' ? 'Start' : 'Review' };
}

export function ProgressPage() {
  usePageMeta(PAGE.studentProgress.title, PAGE.studentProgress.description);
  const progress = useRemote('/progress', ProgressSchema);
  const home = useRemote('/student/home', StudentHomeSchema);
  const streak = useRemote('/student/streak', StudentStreakSchema);
  const badges = useRemote('/student/badges', BadgeShelfSchema);
  if (progress.denied) return <NotebookState title="My progress" message="This notebook is not available. Ask your teacher to check your access." />;
  if (progress.status === 'error') return <NotebookState title="My progress" message="Could not open your progress. Your work is safe." retry={progress.reload} />;
  if (!progress.data || !home.data && home.status === 'loading') return <NotebookState title="My progress" loading />;
  const today = home.data?.greeting.dateIST ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const month = new Date(`${today.slice(0, 7)}-01T12:00:00+05:30`).toLocaleDateString('en-IN', { month: 'long' });
  const studied = streak.data?.history.map((row) => row.day) ?? [];
  const frozen = streak.data?.freezes.filter((row) => row.kind === 'consumed').map((row) => row.day) ?? [];
  const days = monthDays(today, studied, frozen);
  const words = progress.data.masteryWords;
  const concepts = progress.data.concepts;
  const focus = words.find((row) => row.word === "Let's fix this") ?? words.find((row) => row.word === 'Almost there');
  const wins = badges.data?.badges.flatMap((badge) => badge.awards.filter((award) => monthAward(award.awardedAt, today)).map((award) => ({ ...award, name: badge.name, description: badge.description }))) ?? [];
  return <div className="nb-grid pg-progress">
    <div className="nb-col">
      <PageHead title="My progress" sub={`${month} so far · you vs. you, nobody else`} />
      <Card title="Subjects" meta="% of this term's ideas you've got">
        <div className="pr-rings">{home.data?.subjects.map((subject) => {
          const value = subject.total ? Math.round(subject.done / subject.total * 100) : null;
          const conceptIds = new Set(concepts.filter((row) => row.subjectId === subject.id).map((row) => row.conceptId));
          const subjectWords = [...new Set(words.filter((row) => conceptIds.has(row.conceptId)).map((row) => row.word))];
          return <Link className="pr-ring" key={subject.id} to={`/student/subjects/${subject.id}`}>
            <svg viewBox="0 0 100 100" role="img" aria-label={`${subject.name}: ${value == null ? 'no ideas yet' : `${subject.done} of ${subject.total} ideas complete`}`}><circle cx="50" cy="50" r="40" fill="none" stroke="var(--nb-border)" strokeWidth="8" /><circle cx="50" cy="50" r="40" fill="none" stroke={SUBJECT_COLOR[subjectKey(subject.name)]} strokeWidth="8" pathLength="100" strokeDasharray={`${value ?? 0} 100`} transform="rotate(-90 50 50)" strokeLinecap="round" /><text x="50" y="56" textAnchor="middle">{value == null ? '—' : `${value}%`}</text></svg>
            <b>{subject.name}</b>{subjectWords.length === 1 ? <MasteryChip level={subjectWords[0]!} /> : <span className="nb-meta">{subjectWords.length ? 'See ideas below' : 'No summary word yet.'}</span>}
          </Link>;
        })}</div>
        {!home.data?.subjects.length ? <p className="nb-note">{home.denied ? 'Subjects are not available for this notebook.' : home.status === 'error' ? 'Could not open your subjects.' : 'Your subjects will appear here.'}{home.status === 'error' ? <button className="nb-btn nb-btn--ghost nb-btn--sm" onClick={home.reload}>Try again</button> : null}</p> : null}
      </Card>
      <div className="nb-grid nb-grid--halves pr-bottom">
        <Card title={month} meta={streak.data ? <Chip tone="orange"><Icon name="flame" />{streak.data.currentDays}-day streak</Chip> : undefined}>
          {streak.data ? <><div className="cal">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <div className="h" key={index}>{day}</div>)}{days.map((day) => <div key={day.day} title={`${day.day}${day.frozen ? ' · streak freeze' : day.studied ? ' · studied' : ''}`} className={`d${day.outside ? ' o' : ''}${day.studied ? ' s' : ''}${day.frozen ? ' l' : ''}${day.today ? ' t' : ''}`} aria-current={day.today ? 'date' : undefined}>{day.number}{day.frozen ? <span className="pr-freeze" aria-label="Streak freeze">*</span> : null}</div>)}</div><p className="nb-meta">Gold = studied · yellow = streak freeze · {new Set(studied.filter((day) => day.startsWith(today.slice(0, 7)))).size} days this month</p>{streak.data.restartCopy ? <p className="nb-note">{streak.data.restartCopy}</p> : null}</> : <p className="nb-note">{streak.denied ? 'Your calendar is not available.' : streak.status === 'error' ? 'Could not open your calendar.' : 'Opening your calendar…'}{streak.status === 'error' ? <button className="nb-btn nb-btn--ghost nb-btn--sm" onClick={streak.reload}>Try again</button> : null}</p>}
        </Card>
        <Card title="Ideas to look at" meta={`${words.length} ideas`}>
          {words.length ? words.map((row) => { const next = nextFor(row.word, row.chapterId, row.conceptId); return <div className="cc" key={row.conceptId}><div><b>{row.title}</b></div><MasteryChip level={row.word} /><Link className="nb-link" to={next.href}>{next.label}</Link></div>; }) : <p className="nb-note">Your ideas will appear as you learn. New ideas are not mistakes.</p>}
        </Card>
      </div>
    </div>
    <aside className="nb-col pr-rail">
      <Card title="Time this week"><p className="nb-note">Your study-time notes aren't available yet.</p></Card>
      <Card title="How sure vs. how right"><div className="conf-m">{['Sure', 'Unsure', 'Guess'].map((label) => <div key={label} className={`pr-${label.toLowerCase()}`}><b>—</b>{label}</div>)}</div><p className="nb-note">No confidence breakdown in your notebook yet.</p></Card>
      <Sticky color="green" who="Saathy noticed" tape="left">{focus ? <>{focus.title} is marked “{focus.word}”. <Link className="nb-link" to={nextFor(focus.word, focus.chapterId, focus.conceptId).href}>Let's take another look.</Link></> : progress.data.evidence.attempts ? <>{progress.data.evidence.correct} correct answers in {progress.data.evidence.attempts} attempts. Keep building on what you know.</> : 'As you learn, your small steps will leave a trail here.'}</Sticky>
      <Card title="Wins this month" grow className="pr-wins">{wins.length ? wins.map((win) => <div className="nb-row" key={win.id}><span className="pr-win-mark"><Icon name="star" /></span><div><div className="nb-row__t">{win.name}</div><div className="nb-row__s">{win.description}</div><span className="nb-meta">{new Date(win.awardedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' })}</span></div></div>) : <p className="nb-note">{badges.denied ? 'Your wins are not available.' : badges.status === 'error' ? 'Could not open your wins.' : badges.status === 'loading' ? 'Opening your wins…' : 'Your next small win belongs here.'}{badges.status === 'error' ? <button className="nb-btn nb-btn--ghost nb-btn--sm" onClick={badges.reload}>Try again</button> : null}</p>}</Card>
    </aside>
  </div>;
}
