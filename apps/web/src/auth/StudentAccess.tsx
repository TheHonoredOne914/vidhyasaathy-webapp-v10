import { MeSchema, PinLoginSchema } from '@vidhyasaathy/contracts';
import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { PAGE } from '../pages';
import { AuthForm } from '../routes/AuthForm';
import { ApiClientError, postJson } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../session';
import { readStudentProfiles } from '../storage';
import { AuthField as Field } from './AuthField';
import { AuthIcon } from './AuthIcon';
import '../practice/practice.css';

export function StudentClaimForm({ title = PAGE.claim.title }: { title?: string }) {
  void title;
  const navigate = useNavigate(); const session = useSession();
  const [step, setStep] = useState<'lookup' | 'activate' | 'otp' | 'pin'>('lookup'); const [school, setSchool] = useState(''); const [rollNo, setRollNo] = useState(''); const [code, setCode] = useState(''); const [otp, setOtp] = useState(''); const [pin, setPin] = useState(''); const [token, setToken] = useState(''); const [devOtp, setDevOtp] = useState<string | undefined>(); const [error, setError] = useState<string | null>(null); const [pending, setPending] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setError(null); setPending(true); try {
    if (step === 'lookup') { const result = await postJson('/auth/student/lookup', z.object({ lookupToken: z.string(), name: z.string(), school: z.string(), maskedParentPhone: z.string(), needsActivation: z.boolean() }), { slug: school, rollNo }); setToken(result.lookupToken); setStep('activate'); }
    else if (step === 'activate') { const result = await postJson('/auth/student/activate', z.object({ otpToken: z.string(), otp: z.string().optional(), maskedParentPhone: z.string() }), { lookupToken: token, activationCode: code }); setToken(result.otpToken); setDevOtp(result.otp); setStep('otp'); }
    else if (step === 'otp') { const result = await postJson('/auth/student/verify-otp', z.object({ pinToken: z.string(), profileId: z.string(), code: z.string() }), { otpToken: token, otp }); setToken(result.pinToken); setStep('pin'); }
    else { const me = await postJson('/auth/student/set-pin', MeSchema, { pinToken: token, pin }); session.accept(me); void navigate('/student'); }
  } catch (e) { setError(e instanceof ApiClientError ? e.message : 'The request could not be completed.'); } finally { setPending(false); } }
  return <form className="vs-auth-form" noValidate onSubmit={(event) => { void submit(event); }}>
    {step === 'lookup' ? <><Field label="School" name="school" type="text" value={school} onChange={setSchool} error={null} hint="Enter your school name." autoComplete="organization" placeholder="School name" icon={<AuthIcon name="school" />} /><Field label="Roll number" name="rollNo" type="text" value={rollNo} onChange={setRollNo} error={null} hint="Use the roll number given by your school." autoComplete="off" placeholder="Roll number" icon={<AuthIcon name="student" />} /></> : step === 'activate' ? <><p>Enter the activation code from your school.</p><Field label="Activation code" name="code" type="text" value={code} onChange={(value) => setCode(value.toUpperCase())} error={null} hint="Use the 12 character code." autoComplete="off" maxLength={12} placeholder="Activation code" icon={<AuthIcon name="key" />} /></> : step === 'otp' ? <><p>We sent a one-time code to your parent.</p>{devOtp ? <p role="status">Dev OTP: {devOtp}</p> : null}<Field label="OTP" name="otp" type="text" value={otp} onChange={setOtp} error={null} hint="Enter the 6 digit code." autoComplete="one-time-code" inputMode="numeric" maxLength={6} placeholder="000000" icon={<AuthIcon name="key" />} /></> : <Field label="PIN" name="pin" type="password" value={pin} onChange={setPin} error={null} hint="Choose a 4 digit PIN for next time." autoComplete="new-password" inputMode="numeric" maxLength={4} placeholder="4 digit PIN" reveal icon={<AuthIcon name="lock" />} />}
    {error ? <p role="alert">{error}</p> : null}<button className="vs-button" type="submit" disabled={pending}>{pending ? 'Checking…' : step === 'lookup' ? 'Find my account' : step === 'pin' ? 'Save PIN' : 'Continue'}</button>
  </form>;
}

export function StudentPinForm({ title = PAGE.pin.title }: { title?: string }) {
  const [students] = useState(readStudentProfiles);
  const [profileId, setProfileId] = useState('');
  const [pin, setPin] = useState('');
  const chosen = students.find((student) => student.id === profileId);
  if (students.length === 0) return <div className="vs-auth-empty"><span className="vs-auth-empty-icon"><AuthIcon name="student" size={28} /></span><strong>Your first step starts here.</strong><p>No student account has been activated on this browser.</p><p>Use the activation code from your school to get started.</p><Link className="vs-auth-primary-link" to="/claim">Activate your account <AuthIcon name="arrow" size={18} /></Link></div>;
  if (!chosen) {
    return (
      <div data-testid="profile-chooser">
        <p>Who is using this device? Each student uses their own PIN. This browser remembers only names from accounts activated here.</p>
        <ul className="vs-profile-chooser" aria-label="Students on this device">
          {students.map((student) => (
            <li key={student.id}>
              <button type="button" onClick={() => { setProfileId(student.id); setPin(''); }}>
                {student.name}
                <span>{student.school}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <AuthForm bare submitIcon formClassName="vs-auth-form" title={title} heading="Student PIN sign in" description={PAGE.pin.description} schema={PinLoginSchema} values={{ profileId, pin }} submitLabel="Sign in" pendingLabel="Signing in" path="/auth/pin-login">
      {(errorFor) => <>
        <p>{chosen.name}. {chosen.school}.</p>
        <Field label="PIN" name="pin" type="password" value={pin} onChange={setPin} error={errorFor('pin')} hint="Use your 4 digit PIN." autoComplete="current-password" inputMode="numeric" maxLength={4} placeholder="Enter your 4 digit PIN" reveal icon={<AuthIcon name="lock" />} />
        <button type="button" className="vs-auth-help" onClick={() => { setProfileId(''); setPin(''); }}>Choose a different student</button>
        <Link className="vs-auth-help" to="/recover">Forgot your PIN? Ask a parent or teacher.</Link>
        {errorFor('profileId') ? <p role="alert">{errorFor('profileId')}</p> : null}
      </>}
    </AuthForm>
  );
}

export function StudentAccess() {
  const [flow, setFlow] = useState(() => readStudentProfiles().length > 0 ? 'pin' : 'code');
  return <div className="vs-auth-student-access">
    <div className="vs-auth-student-switch" role="group" aria-label="Student sign-in method">
      <button type="button" aria-pressed={flow === 'code'} onClick={() => { setFlow('code'); }}><AuthIcon name="key" size={18} />Activation code</button>
      <button type="button" aria-pressed={flow === 'pin'} onClick={() => { setFlow('pin'); }}><AuthIcon name="lock" size={18} />Student PIN</button>
    </div>
    {flow === 'code' ? <StudentClaimForm title={PAGE.signIn.title} /> : <StudentPinForm title={PAGE.signIn.title} />}
  </div>;
}
