import {
  InviteTeacherResultSchema, InviteTeacherSchema, type Class, type Section, type Subject,
} from '@vidhyasaathy/contracts';
import { type FormEvent, useState } from 'react';
import { postJson } from '../api/client';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Field } from '../ui/Field';
import { classLabel } from './labels';
import { useMutation } from './useMutation';

export function InviteForm({
  classes,
  sections,
  subjects,
}: {
  classes: Class[];
  sections: Section[];
  subjects: Subject[];
}) {
  const pairs = sections.flatMap((section) => subjects
    .filter((subject) => subject.classId === section.classId)
    .map((subject) => ({
      key: `${section.id}:${subject.id}`,
      sectionId: section.id,
      subjectId: subject.id,
      label: `${classLabel(classes, section.classId)} section ${section.name}, ${subject.name}`,
    })));
  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [choiceError, setChoiceError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const form = useMutation();

  if (pairs.length === 0) {
    return (
      <EmptyState title="No section and subject to assign.">
        <p>Add a section and a subject for the same class before inviting a teacher.</p>
      </EmptyState>
    );
  }

  function toggle(key: string) {
    setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLink(null);
    const assignments = pairs
      .filter((pair) => selected.includes(pair.key))
      .map((pair) => ({ sectionId: pair.sectionId, subjectId: pair.subjectId }));
    if (assignments.length === 0) {
      setChoiceError('Choose a section and subject.');
      return;
    }
    setChoiceError(null);
    const saved = await form.submit(InviteTeacherSchema, { email, assignments }, async (data) => {
      const result = await postJson('/admin/invite-teacher', InviteTeacherResultSchema, data);
      setLink(`/accept-invite?token=${encodeURIComponent(result.token)}`);
    });
    if (!saved) return;
    setEmail('');
    setSelected([]);
  }

  return (
    <form className="grid max-w-xl gap-4" noValidate onSubmit={(event) => { void onSubmit(event); }} aria-busy={form.pending}>
      <Field id="invite-email" label="Email" name="email" type="email" value={email} onChange={setEmail} error={form.errorFor('email')} hint={null} autoComplete="off" inputMode="email" maxLength={254} />
      <fieldset className="grid gap-2">
        <legend className="font-semibold">Section and subject</legend>
        {pairs.map((pair) => (
          <label key={pair.key} className="flex min-h-11 items-center gap-3">
            <input type="checkbox" checked={selected.includes(pair.key)} onChange={() => { toggle(pair.key); }} />
            {pair.label}
          </label>
        ))}
        {choiceError ? <p role="alert">{choiceError}</p> : null}
      </fieldset>
      {form.formError ? <p role="alert">{form.formError}</p> : null}
      <Button type="submit" disabled={form.pending}>{form.pending ? 'Creating invitation' : 'Create invitation'}</Button>
      {link ? (
        <p>
          Share this invitation link with the teacher. No email has been sent. It is shown only once.{' '}
          <a className="text-link break-all" data-testid="invitation-link" href={link}>{link}</a>
        </p>
      ) : null}
    </form>
  );
}
