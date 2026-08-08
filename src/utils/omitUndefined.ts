/**
 * Returns a copy of `source` without the keys whose value is `undefined`.
 *
 * Prisma's generated input types reject an explicit `undefined` under
 * `exactOptionalPropertyTypes`, so optional fields have to be left out
 * entirely rather than passed as `undefined`.
 */
export type WithoutUndefined<T> = { [K in keyof T]?: Exclude<T[K], undefined> };

export function omitUndefined<T extends object>(source: T): WithoutUndefined<T> {
  const result: WithoutUndefined<T> = {};

  for (const key of Object.keys(source) as (keyof T)[]) {
    const value = source[key];
    if (value !== undefined) {
      result[key] = value as Exclude<T[typeof key], undefined>;
    }
  }

  return result;
}
