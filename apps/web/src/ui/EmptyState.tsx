import type { ReactNode } from 'react';
import { Card } from './Card';
import { Saathy } from './Saathy';

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card variant="note" className="max-w-xl">
      <Saathy mood="wave" size={88} alt="Saathy" />
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-2 text-navy">{children}</div>
    </Card>
  );
}
