import { describe, it, expect } from 'vitest';
import { parseJson, isSafeNumber } from '../utils/jsonUtils';
import { LosslessNumber } from 'lossless-json';

describe('jsonUtils', () => {
  it('parses safe numbers', () => {
    const { data } = parseJson('{"a": 123}');
    expect(isSafeNumber(data.a)).toBe(true);
  });

  it('detects unsafe large integers', () => {
    const { data } = parseJson('{"a": 9007199254740995}');
    expect(isSafeNumber(data.a)).toBe(false);
  });

  it('detects unsafe decimals', () => {
    const { data } = parseJson('{"a": 1.234567890123456789}');
    expect(isSafeNumber(data.a)).toBe(false);
  });
});
