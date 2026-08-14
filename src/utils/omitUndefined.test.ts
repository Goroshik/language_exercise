import { describe, expect, it } from 'vitest';
import { omitUndefined } from './omitUndefined';

describe('omitUndefined', () => {
  it('drops keys whose value is undefined', () => {
    expect(omitUndefined({ a: 1, b: undefined, c: 'x' })).toEqual({ a: 1, c: 'x' });
  });

  it('keeps null, zero, empty string and false', () => {
    expect(omitUndefined({ a: null, b: 0, c: '', d: false })).toEqual({
      a: null,
      b: 0,
      c: '',
      d: false
    });
  });

  it('returns an empty object when every value is undefined', () => {
    expect(omitUndefined({ a: undefined, b: undefined })).toEqual({});
  });

  it('does not mutate the source', () => {
    const source = { a: 1, b: undefined };
    omitUndefined(source);
    expect(Object.keys(source)).toEqual(['a', 'b']);
  });

  it('keeps a __proto__ key as an own property', () => {
    const result = omitUndefined(JSON.parse('{"__proto__": "x", "a": 1}') as object);
    expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });

  it('removes the key rather than leaving it undefined', () => {
    expect(Object.prototype.hasOwnProperty.call(omitUndefined({ a: undefined }), 'a')).toBe(false);
  });
});
