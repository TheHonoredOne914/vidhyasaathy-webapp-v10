import type { AskResponse } from '@vidhyasaathy/contracts';

export function askMessage(reply: AskResponse): string {
  if (reply.status === 'not_configured') return "Saathy's hints are taking a break. Your question is still here. You can look at your chapter notes and try again later.";
  if (reply.status === 'unavailable') return 'Your notebook helper could not open the notes just now. Your question is safe; try again.';
  return reply.message;
}
