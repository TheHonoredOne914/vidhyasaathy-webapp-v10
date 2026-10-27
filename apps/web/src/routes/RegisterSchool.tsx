import { MeSchema, RegisterSchoolSchema } from '@vidhyasaathy/contracts';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiClientError, inlineFieldErrors, postJson, validateForm } from '../api/client';
import { AuthIcon } from '../auth/AuthIcon';
import { AuthField as Field, AuthSelectField as SelectField } from '../auth/AuthField';
import { AuthLayout, AuthScene } from '../auth/AuthLayout';
import { PAGE } from '../pages';
import { usePageMeta } from '../meta';
import { useSession } from '../session';
import { BOARDS, emptyDraft, optionLabel, SCHOOL_TYPES, stepOneErrors, stepTwoErrors, type SchoolDraft } from './registerSteps';

const STEP_LABELS = ['School details', 'Admin information', 'Review & activate'] as const;

export function RegisterSchool() {
  usePageMeta(PAGE.register.title, PAGE.register.description);
  const navigate = useNavigate();
  const session = useSession();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<SchoolDraft>(emptyDraft);
  // These optional details stay local; the registration API does not store them.
  const [schoolState, setSchoolState] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);

  function setField<K extends keyof SchoolDraft>(key: K, value: SchoolDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function advance() {
    const nextErrors = step === 0 ? stepOneErrors(draft) : step === 1 ? stepTwoErrors(draft) : {};
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setFormError(null);
    setStep((current) => Math.min(current + 1, 3));
  }

  async function register() {
    setFormError(null);
    const parsed = validateForm(RegisterSchoolSchema, {
      schoolName: draft.schoolName,
      name: draft.name,
      email: draft.email,
      password: draft.password,
      city: draft.city,
      schoolType: draft.schoolType,
      board: draft.board,
      phone: draft.phone,
      confirmDuplicate,
    });
    if (!parsed.ok) {
      setErrors(parsed.fields);
      if (parsed.fields.schoolName || parsed.fields.email) setStep(0);
      else setStep(1);
      return;
    }
    setPending(true);
    try {
      const me = await postJson('/auth/register-school', MeSchema, parsed.data);
      session.accept(me);
      void navigate('/admin/setup');
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === 'DUPLICATE_SCHOOL') setDuplicateWarning(true);
        const inline = inlineFieldErrors(error.fields);
        if (Object.keys(inline).length > 0) {
          setErrors(inline);
          if (inline.schoolName || inline.email) setStep(0);
          else if (inline.name || inline.password) setStep(1);
        }
        if (Object.keys(inline).length === 0 || error.status === 429 || error.status === 0) setFormError(error.message);
        return;
      }
      setFormError('The request could not be completed.');
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 3) advance();
    else void register();
  }

  return (
    <AuthLayout registration>
      <section className="vs-auth-register-story">
        <div className="vs-auth-intro">
          <span className="vs-auth-eyebrow">for schools</span>
          <h1>Register your school.</h1>
          <p>One admission form. Three pages. Then you set up classes and invite teachers.</p>
        </div>
      <section className="vs-auth-register-card" aria-labelledby="register-heading">
        <span className="vs-auth-stamp" aria-hidden="true">admission form</span>
        <div className="vs-auth-register-heading"><h2 id="register-heading">Register your school</h2><p>Fill in your school&apos;s details below.</p></div>
        <ol className="vs-auth-stepper" aria-label="Registration progress">
          {STEP_LABELS.map((label, index) => <li key={label} className={Math.min(step, 2) > index ? 'is-complete' : ''} aria-current={Math.min(step, 2) === index ? 'step' : undefined}><span>{Math.min(step, 2) > index ? <AuthIcon name="check" size={14} /> : `${index + 1}`}</span><strong><AuthIcon name={index === 0 ? 'school' : index === 1 ? 'user' : 'check'} size={16} /><span className="vs-auth-sr-only">{label}</span><span aria-hidden="true">{['School', 'Admin', 'Confirm'][index]}</span></strong></li>)}
        </ol>
        <form className="vs-auth-form vs-auth-register-form" noValidate onSubmit={onSubmit} aria-busy={pending}>
          {duplicateWarning ? <div className="vs-auth-message" role="alert"><p>A school with a similar name already exists.</p><label><input type="checkbox" checked={confirmDuplicate} onChange={(event) => { setConfirmDuplicate(event.target.checked); }} /> This is a different school. Continue registering.</label></div> : null}
          <div className="vs-auth-step-title"><h3>{step === 3 ? 'Ready for your first chapter?' : STEP_LABELS[step]}</h3><span>Step {Math.min(step + 1, 3)} of 3</span></div>
          <div className="vs-auth-school-fields" hidden={step !== 0}>
            <Field className="vs-auth-full-width" label="School name *" name="schoolName" type="text" value={draft.schoolName} onChange={(value) => { setField('schoolName', value); }} error={errors.schoolName ?? null} hint={null} autoComplete="organization" maxLength={120} placeholder="Enter your school name" icon={<AuthIcon name="school" />} />
            <SelectField label="School type *" name="schoolType" value={draft.schoolType} onChange={(value) => { setField('schoolType', value); }} error={errors.schoolType ?? null} options={[...SCHOOL_TYPES]} placeholder="Select type" icon={<AuthIcon name="school" size={18} />} />
            <SelectField label="Board / Affiliation *" name="board" value={draft.board} onChange={(value) => { setField('board', value); }} error={errors.board ?? null} options={[...BOARDS]} placeholder="Select board" icon={<AuthIcon name="book" size={18} />} />
            <Field label="State (optional)" name="state" type="text" value={schoolState} onChange={setSchoolState} error={null} hint={null} autoComplete="address-level1" maxLength={120} placeholder="State" icon={<AuthIcon name="pin" />} />
            <Field label="City *" name="city" type="text" value={draft.city} onChange={(value) => { setField('city', value); }} error={errors.city ?? null} hint={null} autoComplete="address-level2" maxLength={120} placeholder="City" icon={<AuthIcon name="pin" />} />
            <Field className="vs-auth-full-width" label="School email *" name="email" type="email" value={draft.email} onChange={(value) => { setField('email', value); }} error={errors.email ?? null} hint="This email signs in the administrator." autoComplete="email" inputMode="email" maxLength={254} placeholder="school@example.com" icon={<AuthIcon name="mail" />} />
            <div className="grid gap-1 vs-auth-full-width">
              <label htmlFor="phone"><AuthIcon name="phone" size={18} />Phone number *</label>
              <div className="vs-auth-phone"><AuthIcon name="phone" size={18} /><span>+91</span><input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="10-digit mobile number" value={draft.phone} aria-invalid={errors.phone ? true : undefined} aria-describedby={errors.phone ? 'phone-error' : undefined} onChange={(event) => { setField('phone', event.target.value); }} /></div>
              {errors.phone ? <p id="phone-error" role="alert">{errors.phone}</p> : null}
            </div>
            <div className="grid gap-1 vs-auth-full-width"><label htmlFor="address"><AuthIcon name="pin" size={18} />School address (optional)</label><div className="vs-auth-address"><AuthIcon name="pin" size={18} /><textarea id="address" name="address" autoComplete="street-address" rows={2} maxLength={500} placeholder="Street, area, landmark" value={address} onChange={(event) => { setAddress(event.target.value); }} aria-describedby="address-hint" /></div><p id="address-hint" className="vs-auth-field-hint">State and address are for this review only; they are not saved.</p></div>
          </div>
          <div className="vs-auth-admin-fields" hidden={step !== 1}>
            <p className="vs-auth-step-description">You&apos;ll be your school&apos;s first administrator. Your school email will be your sign-in email.</p>
            <Field label="Your name *" name="name" type="text" value={draft.name} onChange={(value) => { setField('name', value); }} error={errors.name ?? null} hint={null} autoComplete="name" maxLength={120} placeholder="Your full name" icon={<AuthIcon name="user" />} />
            <Field label="Password *" name="password" type="password" value={draft.password} onChange={(value) => { setField('password', value); }} error={errors.password ?? null} hint="Use 12 to 128 characters." autoComplete="new-password" maxLength={128} reveal placeholder="Create a strong password" icon={<AuthIcon name="lock" />} />
          </div>
          {step === 2 ? <dl className="vs-auth-review">
            <div><dt>School name</dt><dd>{draft.schoolName}</dd></div>
            <div><dt>Location</dt><dd>{[draft.city, schoolState].filter(Boolean).join(', ')}</dd></div>
            <div><dt>School type</dt><dd>{optionLabel(SCHOOL_TYPES, draft.schoolType)}</dd></div>
            <div><dt>Board</dt><dd>{optionLabel(BOARDS, draft.board)}</dd></div>
            <div><dt>School email</dt><dd>{draft.email}</dd></div>
            <div><dt>Phone</dt><dd>+91 {draft.phone}</dd></div>
            {address ? <div><dt>Address</dt><dd>{address}</dd></div> : null}
            <div><dt>Administrator</dt><dd>{draft.name}</dd></div>
          </dl> : null}
          {step === 3 ? <div className="vs-auth-confirm"><span><AuthIcon name="school" size={32} /></span><h3>{draft.schoolName}</h3><p>This creates your school and signs you in as its administrator. You can then set up your classes and invite your school community.</p></div> : null}
          {step === 2 || step === 3 ? <p className="vs-auth-field-hint">The server stores the school name and the administrator account. City, school type, board, phone, state, and address stay on this form.</p> : null}
          {formError ? <p role="alert">{formError}</p> : null}
          <div className="vs-auth-register-actions">
            {step === 0 ? <button className="vs-auth-primary-link" type="button" onClick={advance}>Next: Admin Information <AuthIcon name="arrow" size={18} /></button> : null}
            {step === 1 ? <button className="vs-auth-primary-link" type="button" onClick={advance}>Next: Review <AuthIcon name="arrow" size={18} /></button> : null}
            {step === 2 ? <button className="vs-auth-primary-link" type="button" onClick={advance}>Next: Confirm <AuthIcon name="arrow" size={18} /></button> : null}
            {step === 3 ? <button type="submit" disabled={pending}>{pending ? 'Registering' : 'Register school'} <AuthIcon name="arrow" size={18} /></button> : null}
            {step > 0 ? <button className="vs-auth-back" type="button" disabled={pending} onClick={() => { setStep((current) => current - 1); }}><AuthIcon name="back" size={16} /> Back</button> : null}
          </div>
        </form>
        <p className="vs-auth-register-footnote"><AuthIcon name="shield" size={15} /> A secure start for your school community.</p>
        <p className="vs-auth-register-link">Already part of VidhyaSaathy? <Link to="/signin">Sign in <AuthIcon name="arrow" size={15} /></Link></p>
      </section>
      </section>
      <AuthScene registration />
    </AuthLayout>
  );
}
