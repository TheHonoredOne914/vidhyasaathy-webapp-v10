export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const safeValue = Math.min(100, Math.max(0, value));
  return <div className="grid gap-1" aria-label={label}><div className="vs-pencil-progress" role="progressbar" aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${safeValue}%` }} /></div>{label ? <span className="text-sm text-navy">{label}</span> : null}</div>;
}
