export function ScreenState({ loading, error, retry }: { loading?: boolean; error?: string | null; retry: () => void }) {
  if (loading) return <section className="nb-card" aria-busy="true" aria-label="Opening your notebook"><div className="nb-skel" /><div className="nb-skel" /></section>;
  return <section className="nb-card" role="alert"><p className="nb-text">{error ?? 'Could not open this page.'}</p><button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" onClick={retry}>Try again</button></section>;
}
