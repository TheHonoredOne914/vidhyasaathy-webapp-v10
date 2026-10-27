import type { ComponentProps, ReactNode } from 'react';
import { Field } from '../ui/Field';
import { SelectField } from '../ui/SelectField';

// Keep the shared controls and their accessible labels; only decorate the notebook.
export function AuthField({ icon, className = '', ...props }: ComponentProps<typeof Field>) {
  return <div className={`vs-auth-labeled-field ${className}`.trim()}>
    <span className="vs-auth-label-icon" aria-hidden="true">{icon}</span>
    <Field {...props} />
  </div>;
}

export function AuthSelectField({ icon, ...props }: ComponentProps<typeof SelectField> & { icon: ReactNode }) {
  return <div className="vs-auth-labeled-field">
    <span className="vs-auth-label-icon" aria-hidden="true">{icon}</span>
    <SelectField {...props} />
  </div>;
}
