import type { EvidenceSummary } from '@vidhyasaathy/contracts';

export function evidenceLabel(row: EvidenceSummary): string {
  const pending = row.pendingReview ? ` ${row.pendingReview} waiting for review.` : '';
  if (row.confidence === 'insufficient') {
    return `${row.attempts} marked. A rate needs ${row.minAttempts} marked checks.${pending}`;
  }
  const percent = Math.round((row.passRate ?? 0) * 100);
  return `${row.correct} of ${row.attempts} correct, ${percent} percent. Enough marked checks to show a rate.${pending}`;
}

export function heatClass(needingPractice: number): string {
  if (needingPractice >= 3) return 'heat-many';
  if (needingPractice >= 1) return 'heat-some';
  return 'heat-none';
}

export function clockFromMinutes(total: number): string {
  const minutes = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function minutesFromClock(value: string): number | null {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}
