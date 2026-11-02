import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MeSchema } from '@vidhyasaathy/contracts';
import { z } from 'zod';
import { getJson, postJson } from '../api/client';
import { useSession } from '../session';
import { ROLE_HOME } from '../roles';

const DemoStudentsSchema = z.object({ students: z.array(z.object({ id: z.string().uuid(), name: z.string() })) });

export function DemoEntryButtons() {
  const session = useSession();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function enterStudent() {
    setPending(true); setError('');
    try {
      if (session.me?.profile.role === 'student' && !session.stale) { void navigate(ROLE_HOME.student); return; }
      const response = await getJson('/auth/demo/students', DemoStudentsSchema);
      const student = response.students.find((row) => row.name.toLowerCase() === 'aarav');
      if (!student) throw new Error('Demo student unavailable');
      const me = await postJson('/auth/pin-login', MeSchema, { profileId: student.id, pin: '2468' });
      session.accept(me); void navigate(ROLE_HOME.student);
    } catch { setError('The student demo needs the running API and seeded Aarav account. You can still explore the other three demo workspaces.'); }
    finally { setPending(false); }
  }
  return <section aria-label="Explore the demo" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed var(--nb-border)', fontFamily: 'Patrick Hand' }}><h2 style={{ fontFamily: 'inherit', fontSize: '1.35rem' }}>Take a look around</h2><p className="nb-meta">Parent, Teacher and Admin use fictional sample data. Student opens Aarav's existing demo account.</p><div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.75rem' }}><button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" disabled={pending} onClick={() => { void enterStudent(); }}>{pending ? 'Opening Student…' : 'Enter as Student'}</button>{(['Teacher', 'Parent', 'Admin'] as const).map((role) => <Link key={role} className="nb-btn nb-btn--ghost nb-btn--sm" to={`/demo/${role.toLowerCase()}`}>Enter as {role}</Link>)}</div>{error && <p role="alert" className="nb-meta" style={{ marginTop: '.75rem' }}>{error}</p>}</section>;
}
