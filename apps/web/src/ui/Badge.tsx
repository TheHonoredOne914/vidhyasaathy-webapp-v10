import type { ReactNode } from 'react';

export function Badge({ children, tone = 'navy' }: { children: ReactNode; tone?: 'navy' | 'peach' | 'success' }) {
  return <span className={`inline-flex items-center rounded-full border border-blue px-3 py-1 text-sm font-semibold ${tone === 'peach' ? 'bg-peach text-midnight' : tone === 'success' ? 'bg-[#d9efdf] text-midnight' : 'bg-ice text-midnight'}`}>{children}</span>;
}

export function Stamp({ children }: { children: ReactNode }) { return <span className="inline-flex rotate-[-4deg] items-center rounded-full border-2 border-navy px-3 py-1 text-sm font-semibold text-navy">{children}</span>; }
