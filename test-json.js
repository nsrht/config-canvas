import { parse, stringify, isLosslessNumber } from 'lossless-json';
const text = '{"a": 123456789012345678901234567890, "b": 1.23, "c": null, "d": [1, 2]}';
const parsed = parse(text);
console.log(parsed.a.toString());
console.log(isLosslessNumber(parsed.a));
console.log(stringify(parsed));
