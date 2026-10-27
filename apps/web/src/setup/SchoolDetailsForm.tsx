import { SaveSchoolDetailsSchema, SchoolDetailsSchema } from '@vidhyasaathy/contracts';
import { useState, type FormEvent } from 'react';
import { putJson } from '../api/client';
import { useSession } from '../session';
import { AccessDenied } from '../routes/AccessDenied';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { Field } from '../ui/Field';
import { Skeleton } from '../ui/Skeleton';
import { StaleNote } from '../ui/StaleNote';
import { useMutation } from './useMutation';
import { useRemote } from './useRemote';
import type { z } from 'zod';

function DetailsForm({ details, onSaved }: { details: z.infer<typeof SchoolDetailsSchema>; onSaved: () => void }) {
  const initial = SchoolDetailsSchema.omit({ id: true }).strip().parse(details);
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(false);
  const form = useMutation();
  const session = useSession();
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    const ok = await form.submit(SaveSchoolDetailsSchema, draft, async (data) => {
      await putJson('/admin/school-details', SchoolDetailsSchema, data);
      if (session.me) session.accept({ ...session.me, school: { ...session.me.school, name: data.name } });
    });
    if (ok) { setSaved(true); onSaved(); }
  }
  return (
    <form id="school-details-form" className="grid max-w-xl gap-4" noValidate onSubmit={(event) => { void submit(event); }} aria-busy={form.pending}>
      <p data-testid="school-name">{details.name}</p>
      {(['name', 'board', 'city', 'schoolType', 'address', 'email', 'phone'] as const).map((key) => (
        <Field key={key} label={{ name: 'School name', board: 'Board', city: 'City', schoolType: 'School type', address: 'Address', email: 'Contact email', phone: 'Contact phone' }[key]} name={key} type={key === 'email' ? 'email' : 'text'} value={draft[key]} onChange={(value) => { setSaved(false); setDraft((current) => ({ ...current, [key]: value })); }} error={form.errorFor(key)} hint={null} autoComplete="off" maxLength={key === 'address' ? 500 : key === 'phone' ? 10 : key === 'email' ? 254 : key === 'schoolType' ? 40 : 120} />
      ))}
      <p>School logo upload is not available yet.</p>
      {form.formError ? <p role="alert">{form.formError}</p> : null}
      {saved ? <p role="status">School details saved.</p> : null}
      <Button type="submit" disabled={form.pending}>{form.pending ? 'Saving' : 'Save school details'}</Button>
    </form>
  );
}

export function SchoolDetailsForm({ onSaved }: { onSaved?: () => void }) {
  const school = useRemote('/admin/school-details', SchoolDetailsSchema);
  if (school.denied) return <AccessDenied />;
  if (school.status === 'loading' && !school.data) return <Skeleton />;
  if (!school.data) return <ErrorState title="Could not load school details" message={school.message ?? 'Try again.'} onRetry={school.reload} />;
  return <><StaleNote stale={school.stale} updatedAt={school.updatedAt} message={school.message} /><DetailsForm key={school.data.id} details={school.data} onSaved={() => { school.reload(); onSaved?.(); }} /></>;
}
