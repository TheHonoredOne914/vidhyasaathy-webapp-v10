export interface SessionProgress {
  viewedSlides: number;
  totalSlides: number;
  checkAvailable: boolean;
  completed: boolean;
}

function validate(totalSlides: number, viewedSlides: number) {
  if (!Number.isSafeInteger(totalSlides) || totalSlides < 1
    || !Number.isSafeInteger(viewedSlides) || viewedSlides < 0 || viewedSlides > totalSlides) {
    throw new RangeError('Use a positive slide count and a viewed count within that range.');
  }
}

export function sessionProgress(totalSlides: number, viewedSlides = 0, checkSubmitted = false): SessionProgress {
  validate(totalSlides, viewedSlides);
  const checkAvailable = viewedSlides === totalSlides;
  if (checkSubmitted && !checkAvailable) throw new RangeError('Finish every slide before submitting the check.');
  return { viewedSlides, totalSlides, checkAvailable, completed: checkAvailable && checkSubmitted };
}

// Zero-based slide positions; replaying a viewed slide never regresses progress.
export function advanceSlide(totalSlides: number, viewedSlides: number, position: number): number {
  validate(totalSlides, viewedSlides);
  if (!Number.isSafeInteger(position) || position < 0 || position >= totalSlides || position > viewedSlides) {
    throw new RangeError('Finish the previous slide before advancing.');
  }
  return Math.max(viewedSlides, position + 1);
}

// The caller validates a full check submission; viewing the last slide alone is not completion.
export function completeSession(totalSlides: number, viewedSlides: number, checkSubmitted: boolean): SessionProgress {
  const progress = sessionProgress(totalSlides, viewedSlides, checkSubmitted);
  if (!progress.completed) throw new RangeError('Submit the check after finishing every slide.');
  return progress;
}
