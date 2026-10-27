import { AnnouncementListSchema, AnnouncementSchema, SaveAnnouncementSchema, type NotificationChannel } from '@vidhyasaathy/contracts';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { postJson } from '../api/client';
import { formatDue } from '../assessment/present';
import { usePageMeta } from '../meta';
import { useSession } from '../session';
import { PAGE } from '../pages';
import { classLabel } from '../setup/labels';
import { useCatalog } from '../setup/useCatalog';
import { useMutation } from '../setup/useMutation';
import { useRemote } from '../setup/useRemote';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { SelectField } from '../ui/SelectField';
import { TextArea } from '../ui/TextArea';
import { RemoteBlock } from './RemoteBlock';
import './dashboard.css';

const channels: { value: NotificationChannel; label: string }[] = [
  { value: 'in_app', label: 'In the app' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

export function AnnouncementsPage() {
  usePageMeta(PAGE.announcements.title, PAGE.announcements.description);
  const session = useSession();
  const list = useRemote('/announcements', AnnouncementListSchema);
  const catalog = useCatalog();
  const mutation = useMutation();
  const [sectionId, setSectionId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'students' | 'parents' | 'all'>('all');
  const [picked, setPicked] = useState<NotificationChannel[]>(['in_app']);
  const sections = catalog.sections.data ?? [];
  const classes = catalog.classes.data ?? [];
  const isParent = session.me?.profile.role === 'parent';

  function toggle(channel: NotificationChannel) {
    setPicked((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel]);
  }

  return (
    <section className="dash">
      <header className="dash-banner">
        <h1>Announcements</h1>
        <p>Students and parents see the message for their own class.</p>
      </header>
      {isParent ? null : <form className="dash-panel" onSubmit={(event) => {
        event.preventDefault();
        void mutation.submit(SaveAnnouncementSchema, { sectionId, title, body, audience, channels: picked }, async (input) => {
          await postJson('/announcements', AnnouncementSchema, input);
          setTitle('');
          setBody('');
          list.reload();
        });
      }}>
        <SelectField label="Section" name="sectionId" value={sectionId} onChange={setSectionId} error={mutation.errorFor('sectionId')} placeholder="Choose a section" options={sections.map((section) => ({ value: section.id, label: `${classLabel(classes, section.classId)} section ${section.name}` }))} />
        <Field label="Title" name="title" type="text" value={title} onChange={setTitle} error={mutation.errorFor('title')} hint={null} autoComplete="off" />
        <TextArea label="Message" name="body" value={body} onChange={setBody} error={mutation.errorFor('body')} hint={null} />
        <SelectField label="Audience" name="audience" value={audience} onChange={(value) => { if (value === 'students' || value === 'parents' || value === 'all') setAudience(value); }} error={mutation.errorFor('audience')} placeholder="Choose who sees this" options={[{ value: 'students', label: 'Students' }, { value: 'parents', label: 'Parents' }, { value: 'all', label: 'Students and parents' }]} />
        <fieldset>
          <legend>Channels</legend>
          {channels.map((channel) => (
            <label key={channel.value} className="dash-check">
              <input type="checkbox" checked={picked.includes(channel.value)} onChange={() => { toggle(channel.value); }} />
              {channel.label}
            </label>
          ))}
          <p>Email and WhatsApp are not set up. Those copies are marked failed. In-app delivery waits out quiet hours.</p>
        </fieldset>
        {mutation.errorFor('channels') ? <p role="alert">{mutation.errorFor('channels')}</p> : null}
        {mutation.formError ? <p role="alert">{mutation.formError}</p> : null}
        <Button type="submit" disabled={mutation.pending}>Post announcement</Button>
      </form>}
      <RemoteBlock remote={list} title="Could not load announcements">
        {(data) => data.announcements.length ? (
          <ul className="dash-list">
            {data.announcements.map((item) => (
              <li key={item.id} className="heat-none">
                <h2>{item.title}</h2>
                <p>{item.body}</p>
                <p>{item.audience}. {formatDue(item.createdAt)}.</p>
              </li>
            ))}
          </ul>
        ) : <p>No announcement yet.</p>}
      </RemoteBlock>
      <Link className="text-link" to={session.me?.profile.role === 'parent' ? '/parent' : session.me?.profile.role === 'admin' ? '/admin' : '/teacher'}>Home</Link>
    </section>
  );
}
