import { Link } from 'react-router-dom';
import { EmptyState } from '../ui/EmptyState';

export function NameList({
  label,
  items,
  emptyTitle,
  emptyDetail,
}: {
  label: string;
  items: { id: string; name: string; to?: string }[];
  emptyTitle: string;
  emptyDetail: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState title={emptyTitle}>
        <p>{emptyDetail}</p>
      </EmptyState>
    );
  }
  return (
      <ul aria-label={label} className="catalog-list mb-6">
      {items.map((item) => (
        <li key={item.id} className="break-words">
          {item.to ? <Link className="text-link" to={item.to}>{item.name}</Link> : <span className="inline-flex min-h-11 items-center">{item.name}</span>}
        </li>
      ))}
    </ul>
  );
}
