import { ClassSchema, SaveClassSchema, type AcademicYear } from '@vidhyasaathy/contracts';
import { type FormEvent, useState } from 'react';
import { postJson } from '../api/client';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { SelectField } from '../ui/SelectField';
import { EmptyState } from '../ui/EmptyState';
import { chooseIdError } from './labels';
import { useMutation } from './useMutation';

export function ClassForm({ years, onSaved }: { years: AcademicYear[]; onSaved: () => void }) {
  const [academicYearId, setAcademicYearId] = useState('');
  const [name, setName] = useState('');
  const form = useMutation();
  if (years.length === 0) {
    return (
      <EmptyState title="No academic year yet.">
        <p>Add an academic year before adding a class.</p>
      </EmptyState>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await form.submit(SaveClassSchema, { academicYearId, name }, async (data) => {
      await postJson('/admin/classes', ClassSchema, data);
    });
    if (!saved) return;
    setName('');
    onSaved();
  }

  return (
    <form className="grid max-w-xl gap-4" noValidate onSubmit={(event) => { void onSubmit(event); }} aria-busy={form.pending}>
      <SelectField
        id="class-year"
        label="Academic year"
        name="academicYearId"
        value={academicYearId}
        onChange={setAcademicYearId}
        error={chooseIdError(form.errorFor('academicYearId'), 'Choose an academic year.')}
        placeholder="Choose an academic year"
        options={years.map((year) => ({ value: year.id, label: year.name }))}
      />
      <Field id="class-name" label="Class name" name="name" type="text" value={name} onChange={setName} error={form.errorFor('name')} hint={null} autoComplete="off" maxLength={120} />
      {form.formError ? <p role="alert">{form.formError}</p> : null}
      <Button type="submit" disabled={form.pending}>{form.pending ? 'Adding class' : 'Add class'}</Button>
    </form>
  );
}
