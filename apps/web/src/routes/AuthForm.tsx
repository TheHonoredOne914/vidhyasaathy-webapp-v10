import { MeSchema } from '@vidhyasaathy/contracts';
import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ZodType } from 'zod';
import { ApiClientError, inlineFieldErrors, postJson, validateForm } from '../api/client';
import { AuthIcon } from '../auth/AuthIcon';
import { usePageMeta } from '../meta';
import { ROLE_HOME } from '../roles';
import { useSession } from '../session';
import { Button } from '../ui/Button';
import { PageHeader } from '../ui/PageHeader';

export function AuthForm<T>({
  title,
  heading,
  description,
  schema,
  values,
  submitLabel,
  pendingLabel,
  path,
  children,
  bare = false,
  formClassName,
  next,
  submitIcon = false,
}: {
  title: string;
  heading: string;
  description: string;
  schema: ZodType<T>;
  values: unknown;
  submitLabel: string;
  pendingLabel: string;
  path: string;
  children: (errorFor: (name: string) => string | null) => ReactNode;
  bare?: boolean;
  formClassName?: string;
  next?: string;
  submitIcon?: boolean;
}) {
  usePageMeta(title, description);
  const navigate = useNavigate();
  const session = useSession();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function errorFor(name: string): string | null {
    return fieldErrors[name] ?? null;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = import.meta.env.DEV && import.meta.env.VITE_DEMO_LOOSE_AUTH !== 'false'
      ? { ok: true as const, data: values as T }
      : validateForm(schema, values);
    if (!parsed.ok) {
      setFieldErrors(parsed.fields);
      return;
    }
    setFieldErrors({});
    setPending(true);
    try {
      const me = await postJson(path, MeSchema, parsed.data);
      session.accept(me);
      void navigate(next ?? ROLE_HOME[me.profile.role]);
    } catch (error) {
      if (error instanceof ApiClientError) {
        const inline = inlineFieldErrors(error.fields);
        if (Object.keys(inline).length > 0) setFieldErrors(inline);
        if (Object.keys(inline).length === 0 || error.status === 429 || error.status === 0) setFormError(error.message);
        return;
      }
      setFormError('The request could not be completed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {bare ? null : <PageHeader title={heading} description={description} />}
      <form className={formClassName ?? 'grid max-w-xl gap-4'} noValidate onSubmit={(event) => { void onSubmit(event); }} aria-busy={pending}>
        {children(errorFor)}
        {formError ? <p role="alert">{formError}</p> : null}
        <Button type="submit" disabled={pending}>{pending ? pendingLabel : submitLabel}{submitIcon ? <AuthIcon name="arrow" size={18} /> : null}</Button>
      </form>
    </>
  );
}
