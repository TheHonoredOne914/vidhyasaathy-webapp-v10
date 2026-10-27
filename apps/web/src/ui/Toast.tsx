import type { ReactNode } from 'react';

export function Toast({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'success' | 'danger' }) {
  return <div role="status" className={`inline-flex items-center rounded-[14px] border-2 border-navy px-4 py-3 shadow-card ${tone === 'success' ? 'bg-[#d9efdf]' : tone === 'danger' ? 'bg-[#ffe0dc]' : 'bg-ivory'}`}>{children}</div>;
}
