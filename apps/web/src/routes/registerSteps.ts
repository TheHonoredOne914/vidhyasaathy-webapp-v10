import { RegisterSchoolSchema } from '@vidhyasaathy/contracts';
import type { ZodType } from 'zod';
import { friendlyMessage } from '../api/client';

export const SCHOOL_TYPES = [
  { value: 'private', label: 'Private' },
  { value: 'government', label: 'Government' },
  { value: 'aided', label: 'Aided' },
] as const;

export const BOARDS = [
  { value: 'cbse', label: 'CBSE' },
  { value: 'icse', label: 'ICSE' },
  { value: 'state', label: 'State board' },
] as const;

export type SchoolDraft = {
  schoolName: string;
  city: string;
  schoolType: string;
  board: string;
  email: string;
  phone: string;
  name: string;
  password: string;
};

export function emptyDraft(): SchoolDraft {
  return {
    schoolName: '',
    city: '',
    schoolType: '',
    board: '',
    email: '',
    phone: '',
    name: '',
    password: '',
  };
}

function schemaError(value: unknown, schema: ZodType): string | null {
  const parsed = schema.safeParse(value);
  if (parsed.success) return null;
  return friendlyMessage(parsed.error.issues[0]?.message ?? 'Enter a value.');
}

function required(value: string): string | null {
  return value.trim() ? null : 'Enter a value.';
}

export function stepOneErrors(draft: SchoolDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const schoolName = schemaError(draft.schoolName, RegisterSchoolSchema.shape.schoolName);
  const email = draft.email.trim() ? schemaError(draft.email, RegisterSchoolSchema.shape.email) : 'Enter a value.';
  const city = required(draft.city) ?? (draft.city.trim().length > 120 ? 'Use at most 120 characters.' : null);
  const phone = required(draft.phone) ?? (/^\d{10}$/.test(draft.phone.trim()) ? null : 'Enter a 10 digit phone number.');
  if (schoolName) errors.schoolName = schoolName;
  if (city) errors.city = city;
  if (!draft.schoolType) errors.schoolType = 'Enter a value.';
  if (!draft.board) errors.board = 'Enter a value.';
  if (email) errors.email = email;
  if (phone) errors.phone = phone;
  return errors;
}

export function stepTwoErrors(draft: SchoolDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = schemaError(draft.name, RegisterSchoolSchema.shape.name);
  const password = schemaError(draft.password, RegisterSchoolSchema.shape.password);
  if (name) errors.name = name;
  if (password) errors.password = password;
  return errors;
}

export function optionLabel(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
