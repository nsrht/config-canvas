import { describe, it, expect } from 'vitest';
import { setIn, isLosslessNumber } from '../utils/jsonUtils';
import { LosslessNumber } from 'lossless-json';

describe('setIn', () => {
  it('updates nested objects immutably', () => {
    const original = { a: { b: 1, c: 2 }, d: 3 };
    const updated = setIn(original, ['a', 'b'], 10);

    expect(updated.a.b).toBe(10);
    expect(updated.a.c).toBe(2);
    expect(original.a.b).toBe(1); // original remains unchanged
    expect(updated).not.toBe(original);
    expect(updated.a).not.toBe(original.a);
  });

  it('updates arrays immutably', () => {
    const original = { arr: [1, 2, { id: 3 }] };
    const updated = setIn(original, ['arr', '1'], 20);

    expect(updated.arr[1]).toBe(20);
    expect(original.arr[1]).toBe(2); // original unchanged
    expect(updated.arr).not.toBe(original.arr);
  });

  it('handles empty path (replacing root)', () => {
    const original = { a: 1 };
    const updated = setIn(original, [], { b: 2 });
    expect(updated).toEqual({ b: 2 });
  });

  it('does not iterate into LosslessNumber', () => {
    const num = new LosslessNumber('123');
    const original = { n: num };
    const updated = setIn(original, ['n'], new LosslessNumber('456'));
    expect(updated.n.toString()).toBe('456');
  });
});
