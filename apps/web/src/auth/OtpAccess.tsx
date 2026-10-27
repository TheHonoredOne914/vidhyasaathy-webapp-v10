import { MeSchema } from '@vidhyasaathy/contracts';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ApiClientError, postJson, validateForm } from '../api/client';
import { ROLE_HOME } from '../roles';
import { useSession } from '../session';
import { Button } from '../ui/Button';
import { AuthField as Field } from './AuthField';
import { AuthIcon } from './AuthIcon';

const phoneSchema = z.object({ phone: z.string().regex(/^\d{10}$/, 'Enter a 10 digit phone number.') });
const otpSchema = z.object({ otpToken: z.string().min(20), otp: z.string().regex(/^\d{6}$/, 'Enter the 6 digit OTP.') });
const challengeSchema = z.object({ otpToken: z.string(), otp: z.string().optional() });

export function ParentOtpForm() {
  const session = useSession(); const navigate = useNavigate();
  const [phone, setPhone] = useState(''); const [otp, setOtp] = useState('');
  const [challenge, setChallenge] = useState<{ otpToken: string; otp?: string | undefined } | null>(null);
  const [error, setError] = useState<string | null>(null); const [pending, setPending] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(null); const parsed = challenge ? validateForm(otpSchema, { otpToken: challenge.otpToken, otp }) : validateForm(phoneSchema, { phone });
    if (!parsed.ok) { setError(Object.values(parsed.fields)[0] ?? 'Check your details.'); return; }
    setPending(true);
    try {
      if (!challenge) setChallenge(await postJson('/auth/parent/request-otp', challengeSchema, parsed.data));
      else { const me = await postJson('/auth/parent/verify-otp', MeSchema, parsed.data); session.accept(me); void navigate(ROLE_HOME[me.profile.role]); }
    } catch (e) { setError(e instanceof ApiClientError ? e.message : 'The request could not be completed.'); }
    finally { setPending(false); }
  }
  return <form className="vs-auth-form" noValidate onSubmit={(event) => { void submit(event); }}>
    {!challenge ? <Field label="Parent phone" name="phone" type="text" value={phone} onChange={setPhone} error={null} hint="Use the phone number linked by your school." autoComplete="tel" inputMode="numeric" maxLength={10} placeholder="10 digit phone number" icon={<AuthIcon name="phone" />} /> : <>
      <p>We sent a one-time code to {phone}.</p>{challenge.otp ? <p role="status">Dev OTP: {challenge.otp}</p> : null}
      <Field label="OTP" name="otp" type="text" value={otp} onChange={setOtp} error={null} hint="Enter the 6 digit code." autoComplete="one-time-code" inputMode="numeric" maxLength={6} placeholder="000000" icon={<AuthIcon name="key" />} />
    </>}
    {error ? <p role="alert">{error}</p> : null}<Button type="submit" disabled={pending}>{pending ? 'Checking…' : challenge ? 'Continue' : 'Send OTP'}</Button>
  </form>;
}
