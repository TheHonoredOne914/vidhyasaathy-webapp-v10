import type { SessionProgress } from '@vidhyasaathy/contracts';

export function chapterStatusLabel(status: 'not_started' | 'in_progress' | 'completed'): string {
  if (status === 'in_progress') return 'In progress';
  if (status === 'completed') return 'Completed';
  return 'Not started';
}

export function contentStateLabel(status: 'draft' | 'published', releaseAt: number | null, now = Date.now()): string {
  if (status !== 'published') return 'Draft';
  if (releaseAt !== null && releaseAt > now) return `Releases ${new Date(releaseAt).toLocaleString()}`;
  return 'Published';
}

export function sessionProgressLabel(progress: SessionProgress | null, status: 'draft' | 'published'): string {
  if (!progress) return status === 'draft' ? 'Draft' : 'Published';
  if (progress.completed) return 'Completed';
  if (progress.checkAvailable) return 'Check ready';
  if (progress.viewedSlides === 0) return 'Not started';
  return `Slide ${progress.viewedSlides} of ${progress.totalSlides}`;
}

export function fileSize(size: number): string {
  if (size < 1024) return `${size} bytes`;
  return `${Math.ceil(size / 1024)} KB`;
}
