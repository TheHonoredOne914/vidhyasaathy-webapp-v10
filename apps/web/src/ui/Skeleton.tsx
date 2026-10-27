export function Skeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="grid max-w-xl gap-3">
      <p className="text-navy">Loading</p>
      <div className="h-8 w-48 max-w-full animate-pulse rounded-md bg-ice" />
      <div className="h-4 w-full animate-pulse rounded-md bg-ice" />
      <div className="h-4 w-2/3 animate-pulse rounded-md bg-ice" />
    </div>
  );
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return <div aria-busy="true" aria-live="polite" className="inline-flex items-center gap-3 text-navy"><span className="inline-flex size-8 items-center justify-center rounded-full border-2 border-navy bg-sky text-xs" aria-hidden="true">S</span><span>{label}</span></div>;
}
