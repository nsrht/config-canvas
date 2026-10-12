import { parse, stringify, isLosslessNumber } from 'lossless-json';

export function parseJson(text: string): { data: any; isValid: boolean; error: string | null } {
  try {
    const data = parse(text);
    return { data, isValid: true, error: null };
  } catch (err: any) {
    return { data: null, isValid: false, error: err.message || 'Invalid JSON' };
  }
}

export function stringifyJson(data: any, space = 2): string {
  return stringify(data, undefined, space) || '';
}

export { isLosslessNumber };

export function setIn(obj: any, pathParts: string[], value: any): any {
  if (pathParts.length === 0) return value;

  const [first, ...rest] = pathParts;

  if (Array.isArray(obj)) {
    const newArr = [...obj];
    const index = parseInt(first, 10);
    newArr[index] = setIn(obj[index], rest, value);
    return newArr;
  } else if (obj !== null && typeof obj === 'object' && !isLosslessNumber(obj)) {
    return {
      ...obj,
      [first]: setIn(obj[first], rest, value)
    };
  }

  return obj;
}

// Check if a LosslessNumber can be safely represented as a JavaScript number.
export function isSafeNumber(value: string | number): boolean {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value);
  }

  // For strings from lossless-json
  const strValue = value.toString();

  // If it has decimal point or exponent, we might lose precision if it's too long
  // But generally standard float can hold it if it parses back exactly
  // Or we just check length/magnitude. Let's do a round-trip check
  try {
    const num = Number(strValue);
    if (!Number.isFinite(num)) return false;

    // For integers
    if (!strValue.includes('.') && !strValue.includes('e') && !strValue.includes('E')) {
      return Number.isSafeInteger(num) && String(num) === strValue;
    }

    // For decimals, JavaScript might truncate.
    // If it's a very long string, say more than 15 digits, it's unsafe to edit without potentially losing precision.
    // A simple heuristic for safe float:
    const digitCount = strValue.replace(/[\.\-eE+]/g, '').length;
    if (digitCount > 15) return false;

    return true;
  } catch {
    return false;
  }
}
