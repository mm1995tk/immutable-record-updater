import type { FieldPath, FieldPathValue } from 'react-hook-form';
import { Id, NonEmptyArray, composeId, isNonEmptyArray } from './lib';

export { type Id } from './lib';

export type RecordUpdater<
  T extends FieldValues,
  Error extends DefaultError | string,
  RemoveKey extends FieldPath<T>
> = {
  /**
   * it runs the program of update you define by receiving the initial value.
   */
  run: (item: T) => Result<T, Error>;

  /**
   * it runs the program of update you define by receiving the initial value.  
   * however, this method throws an exception.  
   * the test of this method is not yet implemented.
   * @alpha
   * @param item - initial value
   * @param throwError - you must throw error in this function.
   * @throws error you throw in {@link throwError}
   */
  runOrThrowError: (item: T, throwError: (errors: NonEmptyArray<Error>) => never) => T;

  /** it's an immutable setter. */
  set<Path extends FieldPath<T>>(
    /**
     * path of value you would like to update.
     */
    path: Exclude<Path, RemoveKey | `${RemoveKey}.${string | number}`>,

    /**
     * value that replace old value or procedure of update.
     */
    valueOrFunc: ValueOrFunc<T, Path, Error>
  ): RecordUpdater<T, Error, RemoveKey>;

  /**
   * the test of this method is not yet implemented.
   * @alpha
   */
  setIfNotNullish<Path extends FieldPath<T>>(
    /**
     * path of value you would like to update.
     */
    path: Exclude<Path, RemoveKey | `${RemoveKey}.${string | number}`>,

    /**
     * value that replace old value or procedure of update.
     */
    valueOrFunc:
      | Value<T, Path>
      | ((item: NonNullable<FieldPathValue<T, Path>>, origin: () => Result<T, Error>) => FieldPathValue<T, Path>)
  ): RecordUpdater<T, Error, RemoveKey>;
};

export const generateRecordUpdater = <
  T extends FieldValues,
  Error extends DefaultError | string = DefaultError,
  RemoveKey extends FieldPath<T> = never
>(
  ...constraints: Constraint<T, Error>[]
) => {
  const validate: Validate<T, Error> = pre => {
    if (!isNonEmptyArray(constraints)) {
      return { success: true, data: pre };
    }

    const errors: Error[] = [];

    for (const constraint of constraints) {
      const err = constraint(pre);
      if (err && typeof err !== 'boolean') {
        errors.push(err);
      }
    }

    if (!isNonEmptyArray(errors)) {
      return { success: true, data: pre };
    }

    return { success: false, errors, invalidData: pre };
  };

  const updater = (queue: Id<T>[]): RecordUpdater<T, Error, RemoveKey> => {
    const createSetter =
      (b: boolean) =>
      <Path extends FieldPath<T>>(
        path: never extends RemoveKey ? Path : Exclude<Path, RemoveKey>,
        valueOrFunc: ValueOrFunc<T, Path, Error>
      ) => {
        return updater([
          ...queue,
          origin => {
            const go = getGo(origin, valueOrFunc, b, validate);

            return go(origin, path.split('.'));
          },
        ]);
      };

    const run: (item: T) => Result<T, Error> = origin => {
      const result = isNonEmptyArray(queue) ? composeId(...queue)(origin) : origin;
      const validated = validate(result);
      if (!validated.success) {
        return validated;
      }
      return { success: true, data: result };
    };

    return {
      run,
      runOrThrowError: (origin, throwError) => {
        const r = run(origin);
        if (!r.success) {
          throwError(r.errors);
          throw new Error('throw custom error in errorBuilder');
        }
        return r.data;
      },
      set: createSetter(false),
      setIfNotNullish: createSetter(true),
    };
  };

  return updater([]);
};

export default { generateRecordUpdater };

// ########################################################################################################################

const getGo = <T extends FieldValues, Path extends FieldPath<T>, Error>(
  origin: T,
  valueOrFunc: ValueOrFunc<T, Path, Error>,
  nullishFlag: boolean,
  validate: Validate<T, Error>
) => {
  const go = (item: any, keys: string[]): any => {
    if (item == null && !!keys.length) {
      return null;
    }

    if (!keys.length) {
      if (!isFunc(valueOrFunc)) {
        return valueOrFunc;
      }

      if (nullishFlag && item == null) {
        return item;
      }

      return valueOrFunc(item, () => {
        const validated = validate(origin);
        if (!validated.success) {
          return validated;
        }
        return { success: true, data: origin };
      });
    }

    const key = keys[0];
    const next = go(item[key], keys.slice(1));
    const result = { ...item, [key]: next };

    if (Array.isArray(item)) {
      const len = item.length;
      const index = Number(key);
      return Object.values(index > len - 1 ? item : result);
    }

    return result;
  };

  return go;
};

const isFunc = <T extends FieldValues, Path extends FieldPath<T>, Error>(
  valueOrFunc: ValueOrFunc<T, Path, Error>
): valueOrFunc is Func<T, Path, Error> => typeof valueOrFunc === 'function';

type FieldValues = Record<string, unknown>;

type Value<T extends FieldValues, Path extends FieldPath<T>> = FieldPathValue<T, Path>;

type ValueOrFunc<T extends FieldValues, Path extends FieldPath<T>, Error> = Value<T, Path> | Func<T, Path, Error>;

type Func<T extends FieldValues, Path extends FieldPath<T>, Error> = (
  item: FieldPathValue<T, Path>,
  origin: () => Result<T, Error>
) => FieldPathValue<T, Path>;

type Constraint<T extends FieldValues, Error> = (item: T) => Error | undefined | true;

type Validate<T extends FieldValues, Error> = (item: T) => Result<T, Error>;

type Result<T extends FieldValues, Error> =
  | {
      success: true;
      data: T;
    }
  | { success: false; errors: NonEmptyArray<Error>; invalidData: T };

type DefaultError = Error;
