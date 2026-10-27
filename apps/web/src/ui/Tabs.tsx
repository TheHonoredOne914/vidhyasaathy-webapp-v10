import type { ReactNode } from 'react';

export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return <div className="flex flex-wrap gap-2" role="tablist">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={active === tab.id} className={`min-h-12 rounded-full px-4 text-lg transition-colors ${active === tab.id ? 'bg-navy text-ivory' : 'text-blue hover:bg-ice'}`} onClick={() => { onChange(tab.id); }}>{tab.label}</button>)}</div>;
}

export function TabPanel({ children, active = true }: { children: ReactNode; active?: boolean }) {
  return active ? <div role="tabpanel" className="pt-4">{children}</div> : null;
}
