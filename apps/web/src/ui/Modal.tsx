import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => { const dialog = ref.current; if (!dialog) return; if (open && !dialog.open) dialog.showModal(); if (!open && dialog.open) dialog.close(); }, [open]);
  function trapTab(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const dialog = ref.current; if (!dialog) return;
    const focusable = [...dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')];
    const first = focusable[0]; const last = focusable.at(-1); if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  return <dialog ref={ref} aria-labelledby={titleId} className="vs-paper w-full max-w-md rounded-[18px] p-6" onClose={onClose} onKeyDown={trapTab}><div className="flex items-start justify-between gap-4"><h2 id={titleId} className="text-xl font-semibold">{title}</h2><button type="button" aria-label="Close" className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full text-2xl leading-none hover:bg-ice" onClick={onClose}>×</button></div><div className="mt-4">{children}</div></dialog>;
}
