import { Button } from './Button';
import { Saathy } from './Saathy';

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: (() => void) | null;
}) {
  return (
    <div role="alert" className="max-w-xl">
      <Saathy mood="think" size={88} alt="Saathy" />
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2">{message}</p>
      {onRetry ? <Button className="mt-4" onClick={onRetry}>Try again</Button> : null}
    </div>
  );
}
