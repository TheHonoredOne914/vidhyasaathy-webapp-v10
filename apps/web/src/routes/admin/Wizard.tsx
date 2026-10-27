import { Link, useSearchParams } from 'react-router-dom';
import { PAGE } from '../../pages';
import { usePageMeta } from '../../meta';
import { useSession } from '../../session';
import { readStorage, writeStorage } from '../../storage';
import { PageHeader } from '../../ui/PageHeader';
import { Button } from '../../ui/Button';
import { CatalogGate } from '../../setup/CatalogGate';
import { ClassForm } from '../../setup/ClassForm';
import { InviteForm } from '../../setup/InviteForm';
import { NameList } from '../../setup/NameList';
import { RosterForm } from '../../setup/RosterForm';
import { SchoolDetailsForm } from '../../setup/SchoolDetailsForm';
import { SectionForm } from '../../setup/SectionForm';
import { SubjectForm } from '../../setup/SubjectForm';
import { YearForm } from '../../setup/YearForm';
import { classLabel } from '../../setup/labels';
import { useCatalog } from '../../setup/useCatalog';
import './admin.css';

const STEPS = [
  { id: 'school', label: 'School details' },
  { id: 'year', label: 'Academic year' },
  { id: 'classes', label: 'Classes & sections' },
  { id: 'subjects', label: 'Subjects' },
  { id: 'teachers', label: 'Teacher assignments' },
  { id: 'roster', label: 'Students' },
  { id: 'parents', label: 'Parent contacts' },
  { id: 'activation', label: 'Activation codes' },
] as const;
type StepId = (typeof STEPS)[number]['id'];
function isStep(value: string | null): value is StepId { return STEPS.some((step) => step.id === value); }

export function Wizard() {
  usePageMeta(PAGE.setup.title, PAGE.setup.description);
  const catalog = useCatalog();
  const session = useSession();
  const [params, setParams] = useSearchParams();
  const storageKey = `vidhyasaathy.setup.${session.me?.school.id ?? ''}`;
  const requested = params.get('step') ?? readStorage(storageKey);
  const stepId: StepId = isStep(requested) ? requested : 'school';
  const index = STEPS.findIndex((step) => step.id === stepId);
  const step = STEPS[index] ?? STEPS[0];
  const years = catalog.years.data ?? [];
  const classes = catalog.classes.data ?? [];
  const sections = catalog.sections.data ?? [];
  const subjects = catalog.subjects.data ?? [];
  const blocker = stepId === 'year' && years.length === 0 ? 'Add an academic year before continuing.'
    : stepId === 'classes' && (classes.length === 0 || classes.some((item) => !sections.some((section) => section.classId === item.id))) ? 'Add a class and at least one section for every class before continuing.'
      : stepId === 'subjects' && classes.some((item) => !subjects.some((subject) => subject.classId === item.id)) ? 'Add a subject for every class before continuing.'
      : null;

  function go(id: StepId) {
    writeStorage(storageKey, id);
    setParams({ step: id });
  }
  return (
    <div className="setup-wizard admin-screen">
      <PageHeader title="School setup" description={PAGE.setup.description} />
      <div className="wizard-progress" role="progressbar" aria-label="School setup" aria-valuemin={1} aria-valuemax={8} aria-valuenow={index + 1}>
        {STEPS.map((item, itemIndex) => <span key={item.id} className={itemIndex <= index ? 'is-done' : ''} />)}
      </div>
      <ol className="wizard-stepper" aria-label="Setup steps">
        {STEPS.map((item, itemIndex) => <li key={item.id}><button type="button" aria-current={item.id === stepId ? 'step' : undefined} onClick={() => { go(item.id); }}>{itemIndex + 1}. {item.label}</button></li>)}
      </ol>
      <p className="app-kicker">Step {index + 1} of 8</p>
      <h2 className="mb-4 text-xl font-semibold">{step.label}</h2>
      {stepId === 'school' ? <SchoolDetailsForm onSaved={() => { go('year'); }} /> : <CatalogGate catalog={catalog}>
        {stepId === 'year' ? <>
          <NameList label="Academic years" emptyTitle="No academic year yet." emptyDetail="Add the name and dates for this school year." items={years.map((year) => ({ id: year.id, name: `${year.name} (${year.startsOn} to ${year.endsOn})` }))} />
          <YearForm onSaved={catalog.years.reload} />
          <p className="mt-4">Copying a previous year is not available yet.</p>
        </> : null}
        {stepId === 'classes' ? <div className="setup-columns">
          <section aria-label="Classes"><h3>Classes</h3><NameList label="Classes" emptyTitle="No class yet." emptyDetail="Add a class for an academic year." items={classes.map((item) => ({ id: item.id, name: item.name, to: `/admin/classes/${item.id}` }))} /><ClassForm years={years} onSaved={catalog.classes.reload} /></section>
          <section aria-label="Sections"><h3>Sections</h3><NameList label="Sections" emptyTitle="No section yet." emptyDetail="Add a section to a class." items={sections.map((section) => ({ id: section.id, name: `${classLabel(classes, section.classId)} section ${section.name}`, to: `/admin/sections/${section.id}` }))} /><SectionForm classes={classes} onSaved={catalog.sections.reload} /></section>
        </div> : null}
        {stepId === 'subjects' ? <><NameList label="Subjects" emptyTitle="No subject yet." emptyDetail="Add a subject to a class." items={subjects.map((subject) => ({ id: subject.id, name: `${classLabel(classes, subject.classId)}: ${subject.name}`, to: `/admin/subjects/${subject.id}` }))} /><SubjectForm classes={classes} onSaved={catalog.subjects.reload} /></> : null}
        {stepId === 'teachers' ? <InviteForm classes={classes} sections={sections} subjects={subjects} /> : null}
        {stepId === 'roster' ? <RosterForm classes={classes} sections={sections} /> : null}
        {stepId === 'parents' ? <div className="flow-notice"><p>Parent phone numbers are collected with each student roster entry.</p><p>Parent accounts can be linked to multiple children by phone after parent sign-in.</p><Link className="text-link" to="/admin">Go home</Link></div> : null}
        {stepId === 'activation' ? <>
          <p>Each activation code works once. Distribute it only to the named student after the school has completed the required verification.</p>
          <NameList label="Activation sheets" emptyTitle="No sections yet." emptyDetail="Add classes, sections and students first." items={sections.map((section) => ({ id: section.id, name: `${classLabel(classes, section.classId)} section ${section.name}`, to: `/admin/claim-codes?sectionId=${section.id}` }))} />
          <p>Choose a section to review and print its one-time activation codes.</p>
          <Link className="text-link" to="/admin">Go to school overview</Link>
        </> : null}
      </CatalogGate>}
      <div className="wizard-actions">
        {index > 0 ? <Button variant="secondary" onClick={() => { const previous = STEPS[index - 1]; if (previous) go(previous.id); }}>Back</Button> : null}
        {stepId === 'school' ? <Button type="submit" form="school-details-form">Continue</Button> : index < STEPS.length - 1 ? <Button disabled={blocker !== null || catalog.loading || catalog.failed !== null} onClick={() => { const next = STEPS[index + 1]; if (next) go(next.id); }}>Continue</Button> : null}
      </div>
      {blocker ? <p role="status" className="mt-3">{blocker}</p> : null}
    </div>
  );
}
