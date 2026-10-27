import type { TextareaHTMLAttributes } from 'react';
import { fieldClass } from './Field';

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`vs-control w-full ${className}`.trim()} {...props} />;
}

export function TextArea({ label, name, value, onChange, error, hint, id }: { label: string; name: string; value: string; onChange: (value: string) => void; error: string | null; hint: string | null; id?: string }) {
  const fieldId = id ?? name;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ');
  const props: TextareaHTMLAttributes<HTMLTextAreaElement> = { id: fieldId, name, value, rows: 8, spellCheck: false, onChange: (event) => { onChange(event.target.value); }, ...(error ? { 'aria-invalid': true } : {}), ...(describedBy ? { 'aria-describedby': describedBy } : {}) };
  return <div className="grid gap-1"><label htmlFor={fieldId} className="font-semibold">{label}</label>{hint ? <p id={hintId} className="text-navy">{hint}</p> : null}<Textarea className={`${fieldClass} min-h-36 py-2`} {...props} />{error ? <p id={errorId} role="alert">{error}</p> : null}</div>;
}
