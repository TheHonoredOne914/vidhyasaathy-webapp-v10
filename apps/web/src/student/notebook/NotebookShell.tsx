import { NotificationListSchema, ProgressSchema, StreakSchema, StudentEnrollmentSchema, TeacherDashboardSchema, type Me, type Role } from '@vidhyasaathy/contracts';
import { createContext, useContext, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRemote } from '../../setup/useRemote';
import { Icon } from './icons';
import './shell.css';
import './live-fix.css';

type Item = { icon: string; label: string; key: string; to: string; badge?: number };
type Section = { section: string } | Item;

const STUDENT: Section[] = [
  { icon: 'home', label: 'Home', key: 'home', to: '/student' },
  { icon: 'grid', label: 'My subjects', key: 'subjects', to: '/student?panel=subjects' },
  { icon: 'clock', label: 'Study sessions', key: 'sessions', to: '/student?panel=study' },
  { icon: 'bookmark', label: 'Homework', key: 'homework', to: '/student?panel=homework' },
  { section: 'Play' },
  { icon: 'game', label: 'Games', key: 'games', to: '/student?panel=games' },
  { icon: 'chat', label: 'Ask Saathy', key: 'ask', to: '/student?panel=ask' },
  { section: 'You' },
  { icon: 'chart', label: 'My progress', key: 'progress', to: '/student/progress' },
  { icon: 'bell', label: 'Notifications', key: 'notifications', to: '/student/notifications' },
  { icon: 'gear', label: 'Settings', key: 'settings', to: '/student/settings' },
];

const TEACHER: Section[] = [
  { icon: 'home', label: 'Home', key: 'home', to: '/teacher' },
  { icon: 'users', label: 'My classes', key: 'classes', to: '/teacher#classes' },
  { icon: 'clock', label: 'Sessions', key: 'sessions', to: '/teacher/subjects' },
  { icon: 'bookmark', label: 'Homework', key: 'homework', to: '/teacher/homework' },
  { section: 'Insight' },
  { icon: 'target', label: 'Class mastery', key: 'mastery', to: '/teacher#mastery' },
  { icon: 'doc', label: 'Lesson review', key: 'review', to: '/teacher/review' },
  { section: 'You' },
  { icon: 'bell', label: 'Notifications', key: 'notifications', to: '/teacher/notifications' },
  { icon: 'gear', label: 'Settings', key: 'settings', to: '/teacher/settings' },
];

const PARENT: Section[] = [
  { icon: 'home', label: 'Home', key: 'home', to: '/parent' },
  { icon: 'chart', label: 'Progress report', key: 'report', to: '/parent' },
  { icon: 'bookmark', label: 'Homework', key: 'homework', to: '/parent' },
  { icon: 'mail', label: 'From school', key: 'school', to: '/parent/announcements' },
  { section: 'You' },
  { icon: 'gear', label: 'Settings', key: 'settings', to: '/parent/settings' },
];

const MNAV = [
  { icon: 'home', label: 'Home', key: 'home', to: '/student' },
  { icon: 'grid', label: 'Subjects', key: 'subjects', to: '/student?panel=subjects' },
  { icon: 'game', label: 'Games', key: 'games', to: '/student?panel=games' },
  { icon: 'chat', label: 'Saathy', key: 'ask', to: '/student?panel=ask' },
  { icon: 'chart', label: 'Me', key: 'progress', to: '/student/progress' },
];

export const NotebookActions = createContext<{ requestSignOut: () => void }>({ requestSignOut: () => undefined });
export function useNotebookActions() { return useContext(NotebookActions); }

function activeKey(role: Role, pathname: string, search: string, hash: string): string {
  if (role === 'teacher') {
    if (pathname.startsWith('/teacher/notifications')) return 'notifications';
    if (pathname.startsWith('/teacher/settings')) return 'settings';
    if (pathname.startsWith('/teacher/review') || pathname.includes('/questions') || pathname.includes('/assignments')) return 'review';
    if (pathname.startsWith('/teacher/homework')) return 'homework';
    if (pathname.startsWith('/teacher/subjects') || pathname.startsWith('/teacher/chapters') || pathname.startsWith('/teacher/sessions') || pathname.startsWith('/teacher/notes')) return 'sessions';
    if (hash === '#classes' || pathname.startsWith('/teacher/classes') || pathname.startsWith('/teacher/sections')) return 'classes';
    if (hash === '#mastery' || pathname.includes('/insights')) return 'mastery';
    return 'home';
  }
  if (role === 'parent') {
    if (pathname.startsWith('/parent/settings')) return 'settings';
    if (pathname.startsWith('/parent/notifications')) return 'notifications';
    if (pathname.includes('/assignments') || pathname.includes('homework')) return 'homework';
    if (pathname.startsWith('/parent/announcements')) return 'school';
    if (pathname.includes('/progress')) return 'report';
    return 'home';
  }
  const panel = new URLSearchParams(search).get('panel') ?? '';
  if (pathname.startsWith('/student/progress')) return 'progress';
  if (pathname.startsWith('/student/notifications')) return 'notifications';
  if (pathname.startsWith('/student/settings')) return 'settings';
  if (pathname.startsWith('/student/assignments')) return 'homework';
  if (pathname.startsWith('/student/sessions')) return 'sessions';
  if (pathname.includes('/practice/engine/')) return 'games';
  if (pathname.startsWith('/student/subjects') || pathname.startsWith('/student/chapters') || pathname.startsWith('/student/notes') || pathname.startsWith('/student/concepts')) return 'subjects';
  if (panel === 'subjects') return 'subjects';
  if (panel === 'study') return 'sessions';
  if (panel === 'homework') return 'homework';
  if (panel === 'games') return 'games';
  if (panel === 'ask') return 'ask';
  return 'home';
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

function enrollmentLine(className: string | null | undefined, sectionName: string | null | undefined, rollNumber: string | null | undefined) {
  const place = className && sectionName ? `${className}-${sectionName}` : [className, sectionName].filter(Boolean).join(' ');
  const roll = rollNumber ? `Roll ${rollNumber}` : '';
  return [place, roll].filter(Boolean).join(' · ');
}

export function NotebookShell({ me, children }: { me: Me; children: ReactNode }) {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const role = me.profile.role;
  const active = activeKey(role, pathname, search, hash);
  const student = role === 'student';
  const enrollment = useRemote(student ? '/student/enrollment' : null, StudentEnrollmentSchema);
  const streak = useRemote(student ? '/practice/streak' : null, StreakSchema);
  const progress = useRemote(student ? '/progress' : null, ProgressSchema);
  const notes = useRemote('/notifications', NotificationListSchema);
  const teacherDesk = useRemote(role === 'teacher' ? '/dashboard/teacher' : null, TeacherDashboardSchema);
  const [query, setQuery] = useState('');
  const nav = role === 'teacher' ? TEACHER : role === 'parent' ? PARENT : STUDENT;
  const unread = (notes.data?.notifications ?? []).filter((item) => item.readAt === null).length;
  const homeworkOpen = (progress.data?.assignments ?? []).filter((item) => item.score?.status !== 'completed' && item.score?.status !== 'pending_review').length;
  const xp = (progress.data?.evidence.correct ?? 0) * 10;
  const tag = role === 'teacher' ? 'Teacher desk' : role === 'parent' ? 'Parent view' : enrollment.data?.className ? `Class ${enrollment.data.className} · NCERT` : me.school.name;
  const line = student ? enrollmentLine(enrollment.data?.className, enrollment.data?.sectionName, enrollment.data?.rollNumber) : role === 'teacher' ? me.school.name : 'Parent';
  const home = role === 'teacher' ? '/teacher' : role === 'parent' ? '/parent' : '/student';

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (role === 'student') void navigate(q ? `/student?panel=subjects&q=${encodeURIComponent(q)}` : '/student?panel=subjects');
  }

  return <div className="nb-app">
    <aside className="nb-side">
      <Link className="nb-brand" to={home}><div className="nb-brand__mark">V</div><div><div className="nb-brand__name">VidhyaSaathy</div><div className="nb-brand__tag">{tag}</div></div></Link>
      <nav className="nb-nav" aria-label="Primary">
        {nav.map((item) => 'section' in item ? <div className="nb-nav__sec" key={item.section}>{item.section}</div> : <Link key={item.key} className={item.key === active ? 'nb-nav__item is-active' : 'nb-nav__item'} to={item.to} aria-current={item.key === active ? 'page' : undefined}><Icon name={item.icon} />{item.label}{item.key === 'homework' && homeworkOpen > 0 ? <span className="nb-nav__badge">{homeworkOpen}</span> : null}{item.key === 'notifications' && unread > 0 ? <span className="nb-nav__badge">{unread}</span> : null}{item.key === 'review' && (teacherDesk.data?.reviewQueue ?? 0) > 0 ? <span className="nb-nav__badge">{teacherDesk.data?.reviewQueue}</span> : null}</Link>)}
      </nav>
      <div className="nb-side__foot"><div className="nb-profile"><div className="nb-avatar">{firstName(me.profile.name).slice(0, 1)}</div><div><b>{firstName(me.profile.name)}</b><span>{line || me.school.name}</span></div></div></div>
    </aside>
    <div className="nb-main">
      <header className="nb-top">
        <Link className="nb-brand nb-show-m" to={home}><div className="nb-brand__mark">V</div></Link>
        <form className="nb-search" onSubmit={submitSearch}><Icon name="search" /><input value={query} onChange={(event) => { setQuery(event.target.value); }} placeholder="Search lessons, notes, questions, games…" aria-label="Search lessons, notes, questions, games" /><kbd>/</kbd></form>
        <div className="nb-top__right">
          {student ? <span className="nb-pill nb-pill--streak"><Icon name="flame" />{streak.data ? `${streak.data.currentDays} day streak` : 'Streak'}</span> : null}
          {student ? <span className="nb-pill nb-pill--xp"><Icon name="star" />{progress.data ? `${xp} XP` : 'XP'}</span> : null}
          <Link className="nb-bell" to={`/${role}/notifications`} aria-label="Notifications"><Icon name="bell" />{unread > 0 ? <i /> : null}</Link>
        </div>
      </header>
      <main id="content" className="nb-sheet">{children}</main>
    </div>
    {student ? <nav className="nb-mnav" aria-label="Quick navigation">{MNAV.map((item) => <Link key={item.key} className={item.key === active ? 'is-active' : ''} to={item.to} aria-current={item.key === active ? 'page' : undefined}><Icon name={item.icon} />{item.label}</Link>)}</nav> : null}
  </div>;
}
