import { useState } from 'react';
import type { ZodType } from 'zod';
import { ApiClientError, inlineFieldErrors, validateForm } from '../api/client';

export function useMutation() {
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function errorFor(name: string): string | null {
    return fieldErrors[name] ?? null;
  }

  async function submit<T>(schema: ZodType<T>, values: unknown, send: (data: T) => Promise<void>): Promise<boolean> {
    setFormError(null);
    const parsed = validateForm(schema, values);
    if (!parsed.ok) {
      setFieldErrors(parsed.fields);
      return false;
    }
    setFieldErrors({});
    setPending(true);
    try {
      await send(parsed.data);
      return true;
    } catch (error) {
      if (error instanceof ApiClientError) {
        const inline = inlineFieldErrors(error.fields);
        if (Object.keys(inline).length > 0) setFieldErrors(inline);
        if (Object.keys(inline).length === 0 || error.status === 429 || error.status === 0) setFormError(error.message);
        return false;
      }
      setFormError('The request could not be completed.');
      return false;
    } finally {
      setPending(false);
    }
  }

  return { pending, formError, errorFor, submit };
}
