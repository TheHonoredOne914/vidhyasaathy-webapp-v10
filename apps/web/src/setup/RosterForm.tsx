import {
  ImportRosterSchema, RosterImportResultSchema, RosterImportRowSchema, type RosterImportResult, type Section, type Class,
} from '@vidhyasaathy/contracts';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { postJson } from '../api/client';
import { previewRoster } from '../rosterPreview';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Field } from '../ui/Field';
import { SelectField } from '../ui/SelectField';
import { TextArea } from '../ui/TextArea';
import { chooseIdError, classLabel } from './labels';
import { useMutation } from './useMutation';

function rowText(row: number, message: string): string {
  return `Row ${row}: ${message}`;
}

const ManualRosterSchema = ImportRosterSchema.omit({ csv: true }).extend(RosterImportRowSchema.shape);
const csvField = (value: string) => `"${value.replaceAll('"', '""')}"`;

export function RosterForm({ sections, classes, onSaved }: { sections: Section[]; classes: Class[]; onSaved?: () => void }) {
  const [method, setMethod] = useState('csv');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [csv, setCsv] = useState('');
  const [readError, setReadError] = useState<string | null>(null);
  const [result, setResult] = useState<RosterImportResult | null>(null);
  const form = useMutation();
  const preview = previewRoster(csv);

  if (sections.length === 0) {
    return (
      <EmptyState title="No section yet.">
        <p>Add a section before importing a roster.</p>
      </EmptyState>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    const save = async (data: { sectionId: string; csv: string }) => {
      const imported = await postJson('/admin/import-roster', RosterImportResultSchema, data);
      setResult(imported);
      if (imported.imported.length) onSaved?.();
    };
    if (method === 'manual') {
      await form.submit(ManualRosterSchema, { sectionId, name, rollNumber, phone }, async (row) => {
        await save({ sectionId: row.sectionId, csv: `name,rollNumber,phone\n${csvField(row.name)},${csvField(row.rollNumber)},${csvField(row.phone)}\n` });
      });
    } else {
      await form.submit(ImportRosterSchema, { sectionId, csv }, save);
    }
  }

  const imported = result?.imported.length ?? 0;

  return (
    <form className="grid max-w-xl gap-4" noValidate onSubmit={(event) => { void onSubmit(event); }} aria-busy={form.pending}>
      <SelectField
        id="roster-section"
        label="Section"
        name="sectionId"
        value={sectionId}
        onChange={(value) => { setSectionId(value); setResult(null); }}
        error={chooseIdError(form.errorFor('sectionId'), 'Choose a section.')}
        placeholder="Choose a section"
        options={sections.map((section) => ({
          value: section.id,
          label: `${classLabel(classes, section.classId)} section ${section.name}`,
        }))}
      />
      <SelectField label="Entry method" name="method" value={method} onChange={(value) => { setMethod(value); setResult(null); }} error={null} placeholder="Choose an entry method" options={[{ value: 'csv', label: 'CSV import' }, { value: 'manual', label: 'Manual entry' }]} />
      {method === 'manual' ? <>
        <Field label="Student name" name="name" type="text" value={name} onChange={setName} error={form.errorFor('name')} hint={null} autoComplete="off" maxLength={120} />
        <Field label="Roll number" name="rollNumber" type="text" value={rollNumber} onChange={setRollNumber} error={form.errorFor('rollNumber')} hint={null} autoComplete="off" maxLength={40} />
        <Field label="Parent phone" name="phone" type="tel" value={phone} onChange={setPhone} error={form.errorFor('phone')} hint="Include country code when needed." autoComplete="tel" maxLength={16} />
      </> : <>
      <div className="grid gap-1">
        <label htmlFor="roster-file" className="font-semibold">Roster file</label>
        <input
          id="roster-file"
          className="min-h-11"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setReadError(null);
            void file.text().then((text) => { setCsv(text); }).catch(() => { setReadError('The file could not be read.'); });
          }}
        />
      </div>
      <TextArea
        id="roster-csv"
        label="Roster CSV"
        name="csv"
        value={csv}
        onChange={setCsv}
        error={form.errorFor('csv')}
        hint="The first line is name,rollNumber,phone. Include a valid parent phone; column order is flexible. Strict import rejects the full file if any row is invalid."
      />
      {readError ? <p role="alert">{readError}</p> : null}
      {csv.trim() ? (
        <div data-testid="roster-preview">
          <h3 className="text-xl font-semibold">Preview</h3>
          {preview.headerError ? <p role="alert" className="mt-2">{preview.headerError}</p> : null}
          {preview.lines.length === 0 && !preview.headerError ? <p className="mt-2">No student rows in this file.</p> : null}
          <ul className="mt-2 grid gap-2">
            {preview.lines.map((line) => (
              <li key={`${line.row}-${line.rollNumber}-${line.message ?? ''}`} className="break-words">
                {line.message ? rowText(line.row, line.message) : `Row ${line.row}: ${line.name}, roll ${line.rollNumber}`}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState title="No roster yet.">
          <p>Paste the CSV, or choose a file, to preview it before import.</p>
        </EmptyState>
      )}
      </>}
      <p>Parent phone numbers are collected for account linking. Review the import report before distributing activation codes.</p>
      {form.formError ? <p role="alert">{form.formError}</p> : null}
      <Button type="submit" disabled={form.pending}>{form.pending ? 'Saving students' : method === 'manual' ? 'Add student' : 'Import roster'}</Button>
      {result ? (
        <div>
          <p data-testid="roster-imported">{imported === 1 ? 'Imported 1 student.' : `Imported ${imported} students.`}</p>
          {result.errors.length > 0 ? (
            <ul className="mt-2 grid gap-2" data-testid="roster-errors">
              {result.errors.map((error) => (
                <li key={`${error.row}-${error.message}`}>{rowText(error.row, error.message)}</li>
              ))}
            </ul>
          ) : <p className="mt-2">Every row was imported.</p>}
          {result.claimCodeSheet.entries.length > 0 ? (
            <p className="mt-2">
              <Link className="text-link" to={`/admin/claim-codes?sectionId=${result.claimCodeSheet.sectionId}`}>Print activation codes</Link>
            </p>
          ) : null}
          {result.claimCodeSheet.entries.length > 0 ? (
            <ul aria-label="Imported students" className="mt-2 grid gap-1">
              {result.claimCodeSheet.entries.map((entry) => <li key={entry.profileId}>{entry.name}</li>)}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
