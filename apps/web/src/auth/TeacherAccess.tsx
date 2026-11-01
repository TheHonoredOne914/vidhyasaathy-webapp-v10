import { MeSchema, LoginSchema, SetPinSchema } from '@vidhyasaathy/contracts';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ApiClientError, inlineFieldErrors, postJson, validateForm } from '../api/client';
import { AuthIcon } from './AuthIcon';
import { AuthField as Field } from './AuthField';
import { ROLE_HOME } from '../roles';
import { useSession } from '../session';
import { Button } from '../ui/Button';

const LoginResponseSchema = z.union([MeSchema, z.object({ requiresPin: z.literal(true), pinToken: z.string().min(20) })]);

export function TeacherAccess({ email, onEmail, password, onPassword, remember, onRemember }: { email: string; onEmail: (value: string) => void; password: string; onPassword: (value: string) => void; remember: boolean; onRemember: (value: boolean) => void }) {
  const session = useSession(); const navigate = useNavigate();
  const [pinToken, setPinToken] = useState<string | null>(null); const [pin, setPin] = useState(''); const [pending, setPending] = useState(false); const [formError, setFormError] = useState<string | null>(null); const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const errorFor = (name: string) => fieldErrors[name] ?? null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(null); const values = pinToken ? { pinToken, pin } : { email, password }; const parsed = import.meta.env.DEV && import.meta.env.VITE_DEMO_LOOSE_AUTH !== 'false' ? { ok: true as const, data: values } : pinToken ? validateForm(SetPinSchema, values) : validateForm(LoginSchema, values);
    if (!parsed.ok) { setFieldErrors(parsed.fields); return; } setFieldErrors({}); setPending(true);
    try {
      if (pinToken) { const me = await postJson('/auth/teacher/set-pin', MeSchema, parsed.data); session.accept(me); void navigate(ROLE_HOME[me.profile.role]); }
      else { const result = await postJson('/auth/login', LoginResponseSchema, parsed.data); if ('requiresPin' in result) setPinToken(result.pinToken); else { session.accept(result); void navigate(ROLE_HOME[result.profile.role]); } }
    } catch (error) { if (error instanceof ApiClientError) { const inline = inlineFieldErrors(error.fields); setFieldErrors(inline); if (Object.keys(inline).length === 0) setFormError(error.message); } else setFormError('The request could not be completed.'); } finally { setPending(false); }
  }
  return <form className="vs-auth-form" noValidate onSubmit={(event) => { void submit(event); }} aria-busy={pending}>
    {pinToken ? <Field label="First-login PIN" name="pin" type="password" value={pin} onChange={setPin} error={errorFor('pin')} hint="Choose the 4-digit PIN you will use next time." autoComplete="new-password" maxLength={4} placeholder="••••" reveal icon={<AuthIcon name="lock" />} /> : <>
      <Field label="Email" name="email" type="email" value={email} onChange={onEmail} error={errorFor('email')} hint={null} autoComplete="username" inputMode="email" maxLength={254} placeholder="Enter your school email" icon={<AuthIcon name="mail" />} />
      <Field label="Password" name="password" type="password" value={password} onChange={onPassword} error={errorFor('password')} hint={null} autoComplete="current-password" maxLength={128} placeholder="Enter your password" reveal icon={<AuthIcon name="lock" />} />
      <label><input type="checkbox" checked={remember} onChange={(event) => { onRemember(event.target.checked); }} /> Remember me</label>
    </>}
    {formError ? <p role="alert">{formError}</p> : null}<Button type="submit" disabled={pending}>{pending ? 'Saving' : pinToken ? 'Set PIN' : 'Sign in'}<AuthIcon name="arrow" size={18} /></Button>
  </form>;
}
