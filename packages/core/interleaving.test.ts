import { expect, it } from 'vitest';
import { interleave } from './interleaving.ts';

it('interleaves 2:1 without mutating inputs and fills from whichever pool remains', () => {
  const fresh = Object.freeze(['a', 'b', 'c', 'd'].map((id) => ({ id })));
  const review = Object.freeze(['r', 's'].map((id) => ({ id })));
  expect(interleave(fresh, review, 6).map(({ item }) => item.id)).toEqual(['a', 'b', 'r', 'c', 'd', 's']);
  expect(interleave(fresh, [], 6).map(({ item }) => item.id)).toEqual(['a', 'b', 'c', 'd']);
  expect(interleave([], review, 6).map(({ kind }) => kind)).toEqual(['review', 'review']);
  expect(fresh.map(({ id }) => id)).toEqual(['a', 'b', 'c', 'd']);
});

it('deduplicates across pools with review priority and validates limits', () => {
  const selected = interleave([{ id: 'a' }, { id: 'a' }, { id: 'b' }], [{ id: 'a' }, { id: 'a' }], 10);
  expect(selected).toEqual([{ item: { id: 'b' }, kind: 'new' }, { item: { id: 'a' }, kind: 'review' }]);
  expect(interleave([{ id: 'a' }], [], 0)).toEqual([]);
  for (const limit of [-1, NaN, 1.5, Infinity]) expect(() => interleave([], [], limit)).toThrow(RangeError);
});
