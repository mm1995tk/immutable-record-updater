import type { FieldPath, FieldPathValue } from 'react-hook-form';
import { Id, NonEmptyArray, composeId, isNonEmptyArray } from './lib';

export { type Id } from './lib';

/**
 * a function that updates records of the type passed as the type argument.
 */
export type RecordUpdater<T extends FieldValues> = {
  /**
   * it runs the program of update you define by recieve initial value.
   */
  run: Id<T>;
};

/**
 * generates a function that updates records of the type passed as the type argument.
 * @param constraints - constraints record should fulfill. you also can use this as preprocessor.
 */
export const generateRecordUpdater =
  <T extends FieldValues>(...constraints: Id<T>[]) =>
  <Path extends FieldPath<T>>(
    /**
     * path of value you would like to update.
     */
    path: Path,

    /**
     * value that replace old value or procedure of update.
     */
    valueOrFunc: FieldPathValue<T, Path> | ((item: FieldPathValue<T, Path>, origin: T) => FieldPathValue<T, Path>)
  ): RecordUpdater<T> => ({
    run: origin => {
      const go = (item: any, keys: string[]): any => {
        if (!keys.length) {
          if (typeof valueOrFunc === 'function') {
            return (valueOrFunc as (item: FieldPathValue<T, Path>, origin: T) => FieldPathValue<T, Path>)(item, origin);
          }
          return valueOrFunc;
        }

        const key = keys[0];
        const next = go(item[key], keys.slice(1));
        const result = { ...item, [key]: next };

        return Array.isArray(item) ? Object.values(result) : result;
      };

      const result = go(origin, path.split('.'));
      return isNonEmptyArray(constraints) ? composeId(...constraints)(result) : result;
    },
  });

/**
 * generate composer of a function that updates records of the type passed as the type argument.
 * @param constraints - constraints record should fulfill. you also can use this as preprocessor.
 */
export const generateComposerOfUpdater = <T extends FieldValues>(...constraints: Id<T>[]) => {
  const f = generateRecordUpdater<T>();
  return (g: (fn: typeof f) => NonEmptyArray<RecordUpdater<T>>): RecordUpdater<T> => {
    const y = g(f);
    const x = (item: T) =>
      y.slice(1).reduce((acc, cur) => {
        return cur.run(acc);
      }, y[0].run(item));
    return { run: composeId(x, ...constraints) };
  };
};

export const joinByDot =
  <T extends string>(item: T) =>
  <U extends string | number>(n: U): `${T}.${U}` =>
    `${item}.${n}`;

export default { generateRecordUpdater, generateComposerOfUpdater, joinByDot };

// ########################################################################################################################

type FieldValues = Record<string, unknown>;
