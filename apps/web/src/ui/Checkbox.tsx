import type { InputHTMLAttributes } from 'react';

export function Checkbox({ label, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className={`inline-flex items-center gap-2 font-semibold ${className}`.trim()}><input type="checkbox" className="size-5 accent-navy" {...props} />{label}</label>;
}
