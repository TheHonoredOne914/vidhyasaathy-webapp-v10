import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { LearningEvent, LearningModule } from '@vidhyasaathy/contracts';
import { ContextualSaathy, TEACHING_MODES } from './ContextualSaathy';
import { ModuleView } from './ModuleView';

const base: LearningModule = { id: 'motion:topic:0:practice', chapterId: 'motion', subjectId: 'physics', conceptId: 'distance', type: 'practice', objective: 'Compare distance and displacement', content: 'Compare the full path with start and finish.', questions: [{ id: 'q1', prompt: 'What is displacement?', options: ['A', 'B'] }] };
const props = { sessionId: 'session', events: [], onComplete: () => undefined, onEvidence: () => undefined, pending: false };
function answer(correct: boolean, notTaught = false): LearningEvent {
  return { id: 'attempt', type: 'answer_submitted', sessionId: 'session', conceptId: 'distance', ts: new Date().toISOString(), result: { moduleId: base.id, questionId: 'q1', correct, notTaught, word: notTaught ? 'New' : correct ? 'Mastered' : "Let's fix this", feedback: 'Compare only start and finish.' } };
}

describe('student learning renderers', () => {
  it.each(['concept', 'guided_example', 'explorer', 'practice', 'repair', 'revision'] as const)('renders the %s module without answer keys', (type) => {
    const html = renderToStaticMarkup(createElement(ModuleView, { ...props, module: { ...base, type } }));
    expect(html).toContain('Compare distance and displacement');
    expect(html).not.toContain('correctOptionId');
    expect(html).not.toContain('answerKey');
    if (type === 'explorer') expect(html).toContain('Journey explorer');
  });
  it('opens repair on a persisted wrong answer and enables continuing after a correct one', () => {
    const wrong = renderToStaticMarkup(createElement(ModuleView, { ...props, module: base, events: [answer(false)] }));
    expect(wrong).toContain('Repair this idea');
    expect(wrong).toContain('Try the question again');
    expect(wrong).toMatch(/disabled="">Continue/);
    const correct = renderToStaticMarkup(createElement(ModuleView, { ...props, module: base, events: [answer(true)] }));
    expect(correct).toContain('Mastered');
    expect(correct).not.toContain('Repair this idea');
    expect(correct).not.toMatch(/disabled="">Continue/);
  });
  it('keeps unfamiliar material New and offers teaching before retry', () => {
    const html = renderToStaticMarkup(createElement(ModuleView, { ...props, module: base, events: [answer(false, true)] }));
    expect(html).toContain('Start with the idea');
    expect(html).toContain('New');
    expect(html).not.toContain('weak');
  });
  it('shows every teaching mode and the current learning context', () => {
    const html = renderToStaticMarkup(createElement(ContextualSaathy, { module: base, initialMode: 'teach_from_zero', context: { studentId: 'aarav', subjectId: 'physics', chapterId: 'motion', conceptId: 'distance', sessionId: 'session', step: 0, recentAttempts: [] }, onAction: () => undefined }));
    for (const mode of TEACHING_MODES) expect(html).toContain(mode.label);
    expect(html).toContain(base.objective);
    expect(html).toContain('aria-pressed="true"');
  });
});
