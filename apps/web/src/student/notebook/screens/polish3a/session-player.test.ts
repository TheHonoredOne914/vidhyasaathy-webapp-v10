import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LearningSession } from '@vidhyasaathy/contracts';
import { SessionPlayer } from '../../../../routes/content/SessionPlayer';
import { SlideNote } from './SlideNote';

const remote = vi.hoisted(() => ({
  data: null as LearningSession | null,
  status: 'ready', message: null as string | null, denied: false, reload: vi.fn(),
}));
vi.mock('../../../../setup/useRemote', () => ({ useRemote: () => remote }));
vi.mock('../../../../meta', () => ({ usePageMeta: vi.fn() }));
vi.mock('../../../../session', () => ({ useSession: () => ({ me: { profile: { id: 'student-one' } } }) }));
vi.mock('./PageAsk', () => ({ PageAsk: () => null }));

function session(): LearningSession {
  return {
    id: 'session-one', schoolId: 'school-one', chapterId: 'chapter-one', sectionId: 'section-one',
    title: 'Motion session', status: 'published', releaseAt: null, updatedAt: 1,
    progress: { viewedSlides: 0, totalSlides: 2, checkAvailable: false, completed: false },
    slides: [{ id: 'slide-one', conceptId: 'concept-one', position: 0, title: 'Distance', body: 'Length of the path travelled.\nUse units of length.', noteId: null }],
    check: [],
  };
}

function render() {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ['/sessions/session-one'] },
    createElement(Routes, null, createElement(Route, { path: '/sessions/:sessionId', element: createElement(SessionPlayer) }))));
}

describe('session player states', () => {
  beforeEach(() => {
    remote.data = session();
    remote.status = 'ready';
    remote.message = null;
    remote.denied = false;
  });

  it('renders real slide text and one accessible progress bar without invented diagrams', () => {
    const html = render();
    expect(html).toContain('Length of the path travelled.');
    expect(html).toContain('Use units of length.');
    expect(html.match(/class="nb-bar"/g)).toHaveLength(1);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuemax="2"');
    expect(html).toContain('No diagram attached to this slide.');
    expect(html).toContain('The next slides appear as you go.');
    expect(html).toContain('href="/student?panel=study"');
    expect(html).toContain('aria-current="step"');
  });

  it('renders the empty state rather than an endless skeleton for null progress', () => {
    remote.data = { ...session(), slides: [], progress: null };
    expect(render()).toContain('No slides yet');
    expect(render()).not.toContain('nb-skel');
  });

  it('renders loading and retryable error states', () => {
    remote.data = null;
    remote.status = 'loading';
    expect(render()).toContain('Opening the session');
    remote.status = 'error';
    remote.message = 'SQLITE_BUSY: private database path';
    expect(render()).toContain('Your session could not be loaded. Please try again.');
    expect(render()).not.toContain('SQLITE_BUSY');
    expect(render()).toContain('Try again');
  });

  it('does not expose a stale slide note when checking or viewing the summary', () => {
    remote.data = { ...session(), progress: { viewedSlides: 2, totalSlides: 2, checkAvailable: true, completed: false } };
    expect(render()).toContain('End-of-session check');
    expect(render()).not.toContain('aria-label="Your note"');
    remote.data.progress!.completed = true;
    expect(render()).toContain('Session complete');
    expect(render()).not.toContain('aria-label="Your note"');
  });

  it('preserves all public check types and server review without exposing teacher answer keys', () => {
    const common = { conceptId: 'concept-one', difficulty: 1, sourceRef: null };
    remote.data = {
      ...session(),
      progress: { viewedSlides: 2, totalSlides: 2, checkAvailable: true, completed: false },
      check: [
        { ...common, id: 'mcq', position: 0, type: 'mcq', prompt: 'Choose a unit', options: ['metre', 'second'] },
        { ...common, id: 'pairs', position: 1, type: 'match_pairs', prompt: 'Match the units', left: ['Distance', 'Time'], right: ['metre', 'second'] },
        { ...common, id: 'short', position: 2, type: 'short_answer', prompt: 'Explain distance' },
        { ...common, id: 'recall', position: 3, type: 'flashcard', prompt: 'Recall the units' },
        { id: 'teacher-only', sessionId: 'session-one', position: 4, content: { ...common, type: 'mcq', prompt: 'Teacher draft', options: ['SECRET_KEY', 'Other'], answer: 'SECRET_KEY', explanation: 'Private key' } },
      ],
      review: { score: 0, passed: false, bridge: 'Revisit units.', misses: [{ itemId: 'mcq', prompt: 'Choose a unit', explanation: 'Distance uses units of length.', errorType: 'concept_gap' }] },
    };
    const html = render();
    expect(html).toContain('type="radio"');
    expect(html.match(/<select/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Your answer"');
    expect(html).toContain('aria-label="What you remember"');
    expect(html).toContain('Distance uses units of length.');
    expect(html).not.toContain('SECRET_KEY');
    expect(html).not.toContain('Teacher draft');
    expect(html).toContain('Submit check');
  });
});

describe('slide notes', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('reads only the signed-in student’s note for the current session and slide', () => {
    const getItem = vi.fn(() => 'My saved observation');
    vi.stubGlobal('localStorage', { getItem });
    const html = renderToStaticMarkup(createElement(SlideNote, { sessionId: 'session-one', slideId: 'slide-two', ordinal: 2 }));
    expect(getItem).toHaveBeenCalledWith('vs-slide-note:student-one:session-one:slide-two');
    expect(html).toContain('My saved observation');
    expect(html).toContain('Saved on this device · slide 2');
  });

  it('reports unavailable storage instead of implying the note was loaded or saved', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('Storage blocked'); } });
    const html = renderToStaticMarkup(createElement(SlideNote, { sessionId: 'session-one', slideId: 'slide-one', ordinal: 1 }));
    expect(html).toContain('Could not save on this device. Keep this page open.');
    expect(html).not.toContain('Saved on this device');
  });
});
