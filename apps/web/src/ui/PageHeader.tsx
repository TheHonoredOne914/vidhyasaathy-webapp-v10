export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
      <header className="screen-header mb-6 max-w-xl">
      <h1 className="text-3xl font-semibold text-midnight">{title}</h1>
      <p className="mt-3 text-navy">{description}</p>
    </header>
  );
}
