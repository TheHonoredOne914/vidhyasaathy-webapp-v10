import type { ApiError } from '@vidhyasaathy/contracts';
import { ZodError, type ZodTypeAny, type infer as Infer } from 'zod';

export class ApiException extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly fields: ApiError['fields'];

  constructor(statusCode: number, code: string, message: string, fields?: ApiError['fields']) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
  }

  toJSON(): ApiError {
    return { code: this.code, message: this.message, ...(this.fields ? { fields: this.fields } : {}) };
  }
}

export function parseInput<T extends ZodTypeAny>(schema: T, input: unknown): Infer<T> {
  try {
    return schema.parse(input) as Infer<T>;
  } catch (error) {
    if (!(error instanceof ZodError)) throw error;
    const fields: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join('.') || '_root';
      (fields[key] ??= []).push(issue.message);
    }
    throw new ApiException(400, 'VALIDATION_ERROR', 'Check the submitted fields.', fields);
  }
}
