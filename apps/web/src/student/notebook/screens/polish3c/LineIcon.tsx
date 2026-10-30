const paths = {
  check: <path d="M5 12l5 5L20 7" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  book: <><path d="M4 4h6a2 2 0 0 1 2 2v14a3 3 0 0 0-3-2H4zM20 4h-6a2 2 0 0 0-2 2v14a3 3 0 0 1 3-2h5z" /></>,
  bell: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M10 19a2 2 0 0 0 4 0" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  game: <><rect x="3" y="8" width="18" height="10" rx="4" /><path d="M8 11v4M6 13h4" /><circle cx="16" cy="12" r=".8" /><circle cx="18" cy="14" r=".8" /></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  people: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5" /></>,
} as const;

export function LineIcon({ name }: { name: keyof typeof paths }) {
  return <svg className="i" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}
