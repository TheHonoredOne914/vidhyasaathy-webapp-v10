/** Stable 2-new:1-review selection; exhaust the remaining pool without duplicates. */
export function interleave<T extends { id: string }>(fresh: readonly T[], reviews: readonly T[], limit: number) {
  if (!Number.isSafeInteger(limit) || limit < 0) throw new RangeError('Invalid practice limit.');
  const reviewIds = new Set(reviews.map((item) => item.id));
  const seen = new Set<string>();
  const unique = (pool: readonly T[]) => pool.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id); return true;
  });
  const newPool = unique(fresh.filter((item) => !reviewIds.has(item.id)));
  const reviewPool = unique(reviews);
  const result: { item: T; kind: 'new' | 'review' }[] = [];
  let n = 0, r = 0;
  while (result.length < limit && (n < newPool.length || r < reviewPool.length)) {
    const useReview = (result.length % 3 === 2 && r < reviewPool.length) || n >= newPool.length;
    const item = useReview ? reviewPool[r++]! : newPool[n++]!;
    result.push({ item, kind: useReview ? 'review' : 'new' });
  }
  return result;
}
