import { describe, expect, it } from 'vitest';
import { DiagnosticOfferSchema } from './diagnosticOffer';

const item = { id: '00000000-0000-4000-8000-000000000001', position: 0, conceptId: '00000000-0000-4000-8000-000000000002', prompt: 'Read the graph', difficulty: 1, sourceRef: null, type: 'mcq', options: ['A', 'B'] };
describe('optional prerequisite check', () => {
  it.each([7, null, undefined])('accepts source class %s outside the strict public item', (sourceClass) => {
    expect(DiagnosticOfferSchema.parse({ chapterId: 'motion', offered: true, questions: [{ ...item, sourceClass }] }).questions[0]?.sourceClass).toBe(sourceClass);
  });
  it('accepts an empty or unavailable check', () => {
    expect(DiagnosticOfferSchema.parse({ chapterId: 'motion', offered: false }).questions).toEqual([]);
  });
  it('still rejects answer keys', () => {
    expect(DiagnosticOfferSchema.safeParse({ chapterId: 'motion', offered: true, questions: [{ ...item, answer: 'A' }] }).success).toBe(false);
  });
});
