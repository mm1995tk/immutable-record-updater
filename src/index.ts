import type { FieldPath, FieldPathValue } from 'react-hook-form';
import { Id, composeId, isNonEmptyArray } from './lib';

export { type Id } from './lib';

/**
 * the interface to update a record.
 */
export type RecordUpdater<T extends FieldValues> = {
  /**
   * it runs the program of update you define by recieve initial value.
   */
  run: Id<T>;

  /** it's an immutable setter. */
  set<Path extends FieldPath<T>>(
    /**
     * path of value you would like to update.
     */
    path: Path,

    /**
     * value that replace old value or procedure of update.
     */
    valueOrFunc: ValueOrFunc<T, Path>
  ): RecordUpdater<T>;
};

/**
 * generate updater.
 * @param constraints - constraints record should fulfill. you also can use this as preprocessor.
 */
export const generateRecordUpdater = <T extends FieldValues>(...constraints: Id<T>[]) => {
  const updater = (queue: Id<T>[]): RecordUpdater<T> => {
    return {
      run: origin => {
        const result = isNonEmptyArray(queue) ? composeId(...queue)(origin) : origin;

        return isNonEmptyArray(constraints) ? composeId(...constraints)(result) : result;
      },
      set: <Path extends FieldPath<T>>(path: Path, valueOrFunc: ValueOrFunc<T, Path>) => {
        return updater([
          ...queue,
          origin => {
            const go = (item: any, keys: string[]): any => {
              if (item == null && !!keys.length) {
                return null;
              }

              if (!keys.length) {
                if (typeof valueOrFunc === 'function') {
                  return (valueOrFunc as Func<T, Path>)(item, origin);
                }
                return valueOrFunc;
              }

              const key = keys[0];
              const next = go(item[key], keys.slice(1));
              const result = { ...item, [key]: next };

              return Array.isArray(item) ? Object.values(result) : result;
            };

            return go(origin, path.split('.'));
          },
        ]);
      },
    };
  };

  return updater([]);
};

export const joinByDot =
  <T extends string>(item: T) =>
  <U extends string | number>(n: U): `${T}.${U}` =>
    `${item}.${n}`;

export default { generateRecordUpdater, joinByDot };

// ########################################################################################################################

type FieldValues = Record<string, unknown>;

type ValueOrFunc<T extends FieldValues, Path extends FieldPath<T>> = Value<T, Path> | Func<T, Path>;

type Value<T extends FieldValues, Path extends FieldPath<T>> = FieldPathValue<T, Path>;

type Func<T extends FieldValues, Path extends FieldPath<T>> = (
  item: FieldPathValue<T, Path>,
  origin: T
) => FieldPathValue<T, Path>;
