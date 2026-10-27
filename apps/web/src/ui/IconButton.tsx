import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function IconButton({ label, children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return <button type="button" aria-label={label} className={`vs-icon min-h-10 min-w-10 rounded-full border border-blue bg-ivory text-navy hover:bg-ice ${className}`.trim()} {...props}>{children}</button>;
}
