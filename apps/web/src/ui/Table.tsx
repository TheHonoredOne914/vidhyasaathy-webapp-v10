import type { TableHTMLAttributes, ReactNode } from 'react';

export function Table({ children, className = '', ...props }: TableHTMLAttributes<HTMLTableElement> & { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-lg border border-blue"><table className={`vs-ruled w-full border-collapse text-left ${className}`.trim()} {...props}>{children}</table></div>;
}
