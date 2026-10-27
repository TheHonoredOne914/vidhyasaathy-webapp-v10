import { AcceptInviteSchema } from '@vidhyasaathy/contracts';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PAGE } from '../pages';
import { usePageMeta } from '../meta';
import { Field } from '../ui/Field';
import { AuthForm } from './AuthForm';
import '../theme/vs-theme.css';

function MissingToken() {
  usePageMeta(PAGE.acceptInvite.title, PAGE.acceptInvite.description);
  return (
    <section className="vs-page vs-status-page" aria-labelledby="invitation-title">
      <div className="vs-card vs-status-card">
        <p className="vs-eyebrow">Join your school</p>
        <h1 id="invitation-title">Accept invitation</h1>
        <p className="vs-status-description">This invitation link is incomplete. Open the full link sent by your school, or ask your administrator for a new invitation.</p>
        <Link className="vs-action" to="/">Back to VidhyaSaathy <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}

function AcceptInviteForm({ token }: { token: string }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  return (
    <section className="vs-page vs-invite-page" aria-label="Accept school invitation">
      <p className="vs-eyebrow">Join your school</p>
      <div className="vs-card vs-invite-card">
        <AuthForm
          title={PAGE.acceptInvite.title}
          heading="Accept invitation"
          description={PAGE.acceptInvite.description}
          schema={AcceptInviteSchema}
          values={{ token, name, password }}
          submitLabel="Accept invitation"
          pendingLabel="Accepting invitation"
          path="/auth/accept-invite"
      next="/teacher/onboarding"
        >
          {(errorFor) => (
            <>
              <Field label="Your name" name="name" type="text" value={name} onChange={setName} error={errorFor('name')} hint={null} autoComplete="name" maxLength={120} />
              <Field label="Password" name="password" type="password" value={password} onChange={setPassword} error={errorFor('password')} hint="Use 12 to 128 characters." autoComplete="new-password" maxLength={128} />
            </>
          )}
        </AuthForm>
      </div>
    </section>
  );
}

export function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  if (!AcceptInviteSchema.shape.token.safeParse(token).success) return <MissingToken />;
  return <AcceptInviteForm token={token} />;
}
