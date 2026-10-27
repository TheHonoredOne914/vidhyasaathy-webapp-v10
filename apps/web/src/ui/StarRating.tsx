export function StarRating({ value, max = 5, onChange, label = 'Rating' }: { value: number; max?: number; onChange?: (value: number) => void; label?: string }) {
  return <div className="inline-flex items-center gap-1" aria-label={`${label}: ${value} of ${max}`}>{Array.from({ length: max }, (_, index) => { const star = index + 1; return <button key={star} type="button" aria-label={`${star} star${star === 1 ? '' : 's'}`} disabled={!onChange} className={`text-2xl leading-none ${star <= value ? 'text-navy' : 'text-steel'}`} onClick={() => { onChange?.(star); }}>★</button>; })}</div>;
}
