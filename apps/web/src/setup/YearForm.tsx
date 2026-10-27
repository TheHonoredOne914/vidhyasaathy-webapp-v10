import { AcademicYearSchema, SaveAcademicYearSchema } from '@vidhyasaathy/contracts';
import { type FormEvent, useState } from 'react';
import { postJson } from '../api/client';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { useMutation } from './useMutation';

export function YearForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState('');
  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');
  const form = useMutation();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await form.submit(SaveAcademicYearSchema, { name, startsOn, endsOn }, async (data) => {
      await postJson('/admin/academic-years', AcademicYearSchema, data);
    });
    if (!saved) return;
    setName('');
    setStartsOn('');
    setEndsOn('');
    onSaved();
  }

  return (
    <form className="grid max-w-xl gap-4" noValidate onSubmit={(event) => { void onSubmit(event); }} aria-busy={form.pending}>
      <Field id="year-name" label="Name" name="name" type="text" value={name} onChange={setName} error={form.errorFor('name')} hint={null} autoComplete="off" maxLength={120} />
      <Field id="year-starts" label="Starts on" name="startsOn" type="date" value={startsOn} onChange={setStartsOn} error={form.errorFor('startsOn')} hint={null} autoComplete="off" />
      <Field id="year-ends" label="Ends on" name="endsOn" type="date" value={endsOn} onChange={setEndsOn} error={form.errorFor('endsOn')} hint="The end date must be after the start date." autoComplete="off" />
      {form.formError ? <p role="alert">{form.formError}</p> : null}
      <Button type="submit" disabled={form.pending}>{form.pending ? 'Adding academic year' : 'Add academic year'}</Button>
    </form>
  );
}
