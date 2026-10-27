import { SaveSectionSchema, SectionSchema, type Class } from '@vidhyasaathy/contracts';
import { type FormEvent, useState } from 'react';
import { postJson } from '../api/client';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Field } from '../ui/Field';
import { SelectField } from '../ui/SelectField';
import { chooseIdError } from './labels';
import { useMutation } from './useMutation';

export function SectionForm({ classes, onSaved }: { classes: Class[]; onSaved: () => void }) {
  const [classId, setClassId] = useState('');
  const [name, setName] = useState('');
  const form = useMutation();
  if (classes.length === 0) {
    return (
      <EmptyState title="No class yet.">
        <p>Add a class before adding a section.</p>
      </EmptyState>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await form.submit(SaveSectionSchema, { classId, name }, async (data) => {
      await postJson('/admin/sections', SectionSchema, data);
    });
    if (!saved) return;
    setName('');
    onSaved();
  }

  return (
    <form className="grid max-w-xl gap-4" noValidate onSubmit={(event) => { void onSubmit(event); }} aria-busy={form.pending}>
      <SelectField
        id="section-class"
        label="Class"
        name="classId"
        value={classId}
        onChange={setClassId}
        error={chooseIdError(form.errorFor('classId'), 'Choose a class.')}
        placeholder="Choose a class"
        options={classes.map((item) => ({ value: item.id, label: item.name }))}
      />
      <Field id="section-name" label="Section name" name="name" type="text" value={name} onChange={setName} error={form.errorFor('name')} hint={null} autoComplete="off" maxLength={120} />
      {form.formError ? <p role="alert">{form.formError}</p> : null}
      <Button type="submit" disabled={form.pending}>{form.pending ? 'Adding section' : 'Add section'}</Button>
    </form>
  );
}
