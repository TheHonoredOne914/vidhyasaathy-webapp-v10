import { describe, expect, it } from 'vitest';
import { emptyDraft, stepOneErrors, stepTwoErrors } from './registerSteps';

describe('registration steps', () => {
  it('checks school fields, then the administrator password', () => {
    expect(stepOneErrors(emptyDraft()).schoolName).toBe('Enter a value.');
    expect(stepOneErrors(emptyDraft()).email).toBe('Enter a value.');
    expect(stepOneErrors({ ...emptyDraft(), phone: '123' }).phone).toBe('Enter a 10 digit phone number.');
    const ready = {
      ...emptyDraft(),
      schoolName: 'North Ridge School',
      city: 'Pune',
      schoolType: 'private',
      board: 'cbse',
      email: 'mina@example.test',
      phone: '9876543210',
    };
    expect(stepOneErrors(ready)).toEqual({});
    expect(stepTwoErrors(ready).password).toBe('Use at least 12 characters.');
    expect(stepTwoErrors({ ...ready, name: 'Mina Rao', password: 'correct horse battery' })).toEqual({});
  });
});
