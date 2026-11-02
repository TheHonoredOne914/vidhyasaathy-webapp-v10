import { useEffect, useId, useRef, type ReactNode } from 'react';

export function DemoDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const focused = ref.current?.querySelector<HTMLElement>('input, select, button');
    focused?.focus();
    return () => { if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  return <div className="demo-overlay"><section ref={ref} className="demo-editor" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={(event) => {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    if (event.key !== 'Tab') return;
    const nodes = ref.current?.querySelectorAll<HTMLElement>('input, select, textarea, button');
    const first = nodes?.[0]; const last = nodes?.[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}><h2 id={titleId}>{title}</h2>{children}</section></div>;
}
