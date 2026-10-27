import type { HTMLAttributes, ReactNode } from 'react';

type CardVariant = 'paper' | 'note' | 'sticky' | 'ticket';
export function Card({ variant = 'paper', className = '', children, ...props }: HTMLAttributes<HTMLDivElement> & { variant?: CardVariant; children: ReactNode }) {
  return <div className={`vs-paper rounded-[18px] p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_14px_34px_-12px_rgb(4_29_61_/_0.24)] vs-${variant} ${className}`.trim()} {...props}>{children}</div>;
}
