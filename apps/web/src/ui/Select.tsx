import type { SelectHTMLAttributes } from 'react';

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`vs-control w-full ${className}`.trim()} {...props}>{children}</select>;
}
