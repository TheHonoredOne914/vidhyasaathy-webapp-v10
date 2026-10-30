export function NotebookState({ title, message, loading, retry }: {
  title: string; message?: string; loading?: boolean; retry?: () => void;
}) {
  return <section className="nb-card" aria-busy={loading || undefined}>
    <h1 className="nb-h2">{title}</h1>
    {loading ? <div aria-label="Loading notebook" className="nb-note"><p>Opening your notebook…</p><hr /><hr /><hr /></div>
      : <p className="nb-note" role={retry ? 'alert' : undefined}>{message}</p>}
    {retry ? <button className="nb-btn" onClick={retry}>Try again</button> : null}
  </section>;
}
