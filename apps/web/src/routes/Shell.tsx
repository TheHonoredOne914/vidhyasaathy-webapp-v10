import type { Role } from '@vidhyasaathy/contracts';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ROLE_HOME, ROLE_NOUN } from '../roles';
import { useSession } from '../session';
import { Button, buttonClasses } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Logo } from '../ui/Logo';
import { AskDock } from '../ai/AskDock';
import { SchoolBackground } from '../components/SchoolBackground';
import { BellButton } from '../components/SchoolBackground';
import { OfflineBanner } from '../ui/OfflineBanner';
import { Avatar } from '../ui/Avatar';
import { SaathyMascot } from '../ui/Saathy';

type Item = { to: string; label: string };

function navFor(role: Role): Item[] {
  if (role === 'admin') {
    return [
      { to: '/admin', label: 'Overview' },
      { to: '/admin/activity', label: 'Activity log' },
      { to: '/admin/notifications', label: 'Notifications' },
      { to: '/admin/settings', label: 'Alert settings' },
      { to: '/admin/setup', label: 'Setup' },
      { to: '/admin/classes', label: 'Classes & sections' },
      { to: '/admin/setup?step=teachers', label: 'Teachers' },
      { to: '/admin/setup?step=roster', label: 'Students' },
      { to: '/admin/setup?step=parents', label: 'Parents' },
      { to: '/admin/setup?step=school', label: 'Settings' },
    ];
  }
  if (role === 'teacher') {
    return [
      { to: '/teacher', label: 'Today' },
      { to: '/teacher#classes', label: 'Classes' },
      { to: '/teacher/subjects', label: 'Lessons' },
      { to: '/teacher/homework', label: 'Homework' },
      { to: '/teacher/announcements', label: 'Announcements' },
      { to: '/teacher/notifications', label: 'Notifications' },
      { to: '/teacher/settings', label: 'Settings' },
    ];
  }
  if (role === 'student') {
    return [
      { to: '/student', label: 'Home' },
      { to: '/student?panel=subjects', label: 'My subjects' },
      { to: '/student?panel=study', label: 'Study sessions' },
      { to: '/student?panel=homework', label: 'Homework' },
      { to: '/student?panel=ask', label: 'Ask Saathy' },
      { to: '/student/progress', label: 'My progress' },
      { to: '/student/notifications', label: 'Notifications' },
      { to: '/student/settings', label: 'Settings' },
      { to: '/privacy', label: 'Privacy' },
    ];
  }
  return [
    { to: '/parent', label: 'Home' },
    { to: '/parent/announcements', label: 'Announcements' },
    { to: '/parent/notifications', label: 'Notifications' },
    { to: '/parent/settings', label: 'Settings' },
    { to: '/privacy', label: 'Privacy' },
  ];
}

function roleTitle(role: Role): string {
  if (role === 'admin') return 'Administrator';
  if (role === 'teacher') return 'Teacher';
  if (role === 'student') return 'Student';
  return 'Parent';
}

function isCurrent(to: string, pathname: string, search: string, hash: string): boolean {
  const url = new URL(to, 'http://local');
  if (url.pathname === '/admin/setup') return pathname === url.pathname && url.search === search;
  if (url.pathname === '/teacher/homework') {
    return pathname === '/teacher/homework' || pathname === '/teacher/review' || pathname.startsWith('/teacher/assignments') || pathname.includes('/questions') || pathname.includes('/assignments');
  }
  if (url.pathname === '/teacher/subjects') {
    if (pathname.includes('/questions') || pathname.includes('/assignments')) return false;
    return ['/teacher/subjects', '/teacher/chapters', '/teacher/sessions', '/teacher/notes'].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }
  if (url.pathname === '/student') {
    const wanted = url.searchParams.get('panel') ?? '';
    const current = new URLSearchParams(search).get('panel') ?? '';
    if (pathname.startsWith('/student/subjects') || pathname.startsWith('/student/chapters') || pathname.startsWith('/student/notes')) return wanted === 'subjects';
    if (pathname.startsWith('/student/sessions')) return wanted === 'study';
    if (pathname.startsWith('/student/assignments')) return wanted === 'homework';
    return pathname === '/student' && wanted === current;
  }
  if (to === '/teacher#classes') return hash === '#classes' || pathname.startsWith('/teacher/classes') || pathname.startsWith('/teacher/sections');
  if (url.pathname === '/admin' || url.pathname === '/teacher' || url.pathname === '/parent') return pathname === url.pathname && hash === '';
  return pathname === url.pathname || pathname.startsWith(`${url.pathname}/`);
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CalendarMark() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></svg>;
}

function HomeMark({ role }: { role: Role }) {
  const path = role === 'student' ? 'M4 10 12 4l8 6v9H4zM9 19v-5h6v5' : 'M4 11 12 4l8 7v8H4z';
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>;
}

export function Shell() {
  const session = useSession();
  const navigate = useNavigate();
  const { pathname, search, hash } = useLocation();
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 1023px)').matches);
  const year = new Date().getFullYear();
  const bare = ['/', '/signin', '/register-school', '/recover'].includes(pathname);
  const appPath = ['/admin', '/teacher', '/student', '/parent'].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const me = session.me;

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const onChange = () => { setNarrow(media.matches); };
    media.addEventListener('change', onChange);
    return () => { media.removeEventListener('change', onChange); };
  }, []);

  useEffect(() => { setDrawer(false); }, [pathname, search, hash]);
  useEffect(() => {
    if (localStorage.getItem('vs-reduced-motion') === '1') document.documentElement.dataset.motion = 'reduce';
  }, []);

  async function switchStudent() {
    setSignOutError(null);
    void navigate('/signin/student');
    const message = await session.signOut();
    if (message) {
      setSignOutError(message);
      setOpen(true);
    }
  }

  async function confirmSignOut() {
    setSignOutError(null);
    setOpen(false);
    // Leave the guarded page before the session clears, or RoleGuard sends the browser to /signin.
    void navigate('/');
    const message = await session.signOut();
    if (message) {
      setSignOutError(message);
      setOpen(true);
    }
  }

  const dialog = (
    <Dialog open={open} title="Sign out?" onClose={() => { setOpen(false); }}>
      <p>This ends the session on this browser.</p>
      {signOutError ? <p role="alert" className="mt-3">{signOutError}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={() => { void confirmSignOut(); }}>Confirm sign out</Button>
        <Button variant="secondary" onClick={() => { setOpen(false); }}>Stay signed in</Button>
      </div>
    </Dialog>
  );

  const skip = <a href="#content" className="no-print sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-40 focus:bg-ivory focus:px-3 focus:py-2">Skip to content</a>;

  if (bare) {
    return (
      <>
        {skip}
        <Outlet />
        {dialog}
      </>
    );
  }

  if (appPath && me) {
    const items = navFor(me.profile.role);
    const mobileItems = items.filter((item) => !['Settings', 'Privacy', 'Sign out'].includes(item.label)).slice(0, 5);
    const today = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date());
    const notificationPath = `/${me.profile.role}/notifications`;
    return (
      <div className="app-shell school-scene">
        <SchoolBackground faint />
        {skip}
        {drawer && narrow ? <button type="button" className="app-scrim" aria-label="Close menu" onClick={() => { setDrawer(false); }} /> : null}
        <aside id="app-menu" className={drawer ? 'app-aside no-print is-open' : 'app-aside no-print'} {...(narrow && !drawer ? { inert: true } : {})}>
          <Link to={ROLE_HOME[me.profile.role]}><Logo /></Link>
          <nav aria-label="Primary">
            {items.map((item) => (
              <Link key={item.to} to={item.to} aria-current={isCurrent(item.to, pathname, search, hash) ? 'page' : undefined}>{item.label}</Link>
            ))}
            {me.profile.role === 'student' ? <button type="button" className="aside-end" onClick={() => { void switchStudent(); }}>Switch student</button> : null}
            <button type="button" className={me.profile.role === 'student' ? undefined : 'aside-end'} onClick={() => { setSignOutError(null); setOpen(true); }}>Sign out</button>
          </nav>
          <p className="aside-user">
            <span>{me.profile.name}</span>
            <span>{roleTitle(me.profile.role)}</span>
          </p>
        </aside>
        <div className="app-body">
          <div className="app-mobilebar no-print">
            <button type="button" className="menu-btn" aria-expanded={drawer} aria-controls="app-menu" onClick={() => { setDrawer((current) => !current); }}>
              <MenuIcon />
              <span className="sr-only">{drawer ? 'Close menu' : 'Open menu'}</span>
            </button>
            <SaathyMascot className="shell-mascot" size={40} alt="" />
            <div>
              <p className="who">{me.profile.name}</p>
              <p className="role-line">{me.school.name}</p>
            </div>
          </div>
          <header className="app-topbar no-print">
            <p className="diary-date"><CalendarMark /> <span>{today}</span></p>
            <div className="diary-actions">
              <BellButton />
              <Link className="diary-notifications" to={notificationPath} aria-label="Open notifications">
                <span className="notification-dot" aria-hidden="true" />
                Notifications
              </Link>
              <Link className="profile-chip" to={`/${me.profile.role}/settings`}>
                <Avatar name={me.profile.name} size="sm" />
                <span><strong>{me.profile.name}</strong><small>{roleTitle(me.profile.role)}</small></span>
              </Link>
            </div>
          </header>
          <main id="content" className={`app-main ${me.profile.role === 'admin' || me.profile.role === 'teacher' ? 'staff-main' : ''} ${pathname === '/admin/setup' ? 'setup-main' : ''}`}>
            <OfflineBanner />
            <Outlet />
            {me.profile.role === 'student' && !pathname.startsWith('/student/sessions/') && new URLSearchParams(search).get('panel') !== 'ask' ? <AskDock /> : null}
            <footer className="app-help no-print"><Link className="text-link" to="/recover">Help with your account</Link><Link className="text-link" to="/privacy">Privacy</Link></footer>
          </main>
          <nav className="app-bottom-tabs no-print" aria-label="Quick navigation">
            {mobileItems.map((item, index) => <Link key={item.to} to={item.to} aria-current={isCurrent(item.to, pathname, search, hash) ? 'page' : undefined}>
              {index === 0 ? <HomeMark role={me.profile.role} /> : <span className="bottom-tab-letter" aria-hidden="true">{item.label.slice(0, 1)}</span>}
              <span>{item.label}</span>
            </Link>)}
          </nav>
        </div>
        {dialog}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {skip}
      <header className="no-print border-b border-ice">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 font-semibold">
            <Logo tone="onLight" />
          </Link>
          <nav aria-label="Primary" className="flex flex-wrap items-center gap-3">
            {session.status === 'loading' ? <p className="text-navy">Loading</p> : null}
            {me ? (
              <>
                <Link className="text-link" to={ROLE_HOME[me.profile.role]}>{ROLE_NOUN[me.profile.role]}</Link>
                <Button variant="secondary" onClick={() => { setSignOutError(null); setOpen(true); }}>Sign out</Button>
              </>
            ) : null}
            {session.status !== 'loading' && !me ? (
              <>
                <Link className="text-link" to="/signin">Sign in</Link>
                <Link className={buttonClasses('primary')} to="/register-school">Register a school</Link>
              </>
            ) : null}
          </nav>
        </div>
      </header>
      <main id="content" className="mx-auto w-full max-w-3xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="no-print mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-4 px-4 pb-8 text-navy">
        <p>© {year} VidhyaSaathy</p>
        <Link className="text-link" to="/privacy">Privacy</Link>
      </footer>
      {dialog}
    </div>
  );
}
