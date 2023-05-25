import type { FieldPath, FieldPathValue } from 'react-hook-form';
import { Id, NonEmptyArray, composeId, isNonEmptyArray } from './lib';

export { type Id } from './lib';

//TODO safe~を普通にして普通をunsafeにする
//TODO .xxx() で、setのキーと、関数のタプルの累積を吐き出す関数を実装する。

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

  setIfNotNullish<Path extends FieldPath<T>>(
    /**
     * path of value you would like to update.
     */
    path: Path,

    /**
     * value that replace old value or procedure of update.
     */
    valueOrFunc: Value<T, Path> | ((item: NonNullable<FieldPathValue<T, Path>>, origin: T) => FieldPathValue<T, Path>)
  ): RecordUpdater<T>;
};

export type SafeRecordUpdater<T extends FieldValues, Error, RemoveKey extends FieldPath<T>> = {
  /**
   * it runs the program of update you define by recieve initial value.
   */
  run: (item: T) => Result<T, Error>;

  /** it's an immutable setter. */
  set<Path extends FieldPath<T>>(
    /**
     * path of value you would like to update.
     */
    path: Exclude<Path, RemoveKey | `${RemoveKey}.${string | number}`>,

    /**
     * value that replace old value or procedure of update.
     */
    valueOrFunc: ValueOrSafeFunc<T, Path, Error>
  ): SafeRecordUpdater<T, Error, RemoveKey>;

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
  ): SafeRecordUpdater<T, Error, RemoveKey>;
};

/**
 * generate updater.
 * @param constraints - constraints record should fulfill. you also can use this as preprocessor.
 */
export const generateRecordUpdater = <T extends FieldValues>() => {
  const updater = (queue: Id<T>[]): RecordUpdater<T> => {
    const createSetter =
      (b: boolean) =>
      <Path extends FieldPath<T>>(path: Path, valueOrFunc: ValueOrFunc<T, Path>) => {
        return updater([
          ...queue,
          origin => {
            const go = getGo(origin, valueOrFunc, b);

            return go(origin, path.split('.'));
          },
        ]);
      };

    return {
      run: origin => {
        return isNonEmptyArray(queue) ? composeId(...queue)(origin) : origin;
      },
      set: createSetter(false),
      setIfNotNullish: createSetter(true),
    };
  };

  return updater([]);
};

export const generateSafeRecordUpdater = <
  T extends FieldValues,
  Error extends DefaultError | string = DefaultError,
  RemoveKey extends FieldPath<T> = never
>(
  ...constraints: Constraint<T, Error>[]
) => {
  const validate: Validate<T, Error> = pre => {
    if (!isNonEmptyArray(constraints)) {
      return { success: true };
    }

    const errors: Error[] = [];

    for (const constraint of constraints) {
      const err = constraint(pre);
      if (err && typeof err !== 'boolean') {
        errors.push(err);
      }
    }

    if (!isNonEmptyArray(errors)) {
      return { success: true };
    }

    return { success: false, errors };
  };

  const updater = (queue: Id<T>[]): SafeRecordUpdater<T, Error, RemoveKey> => {
    const createSetter =
      (b: boolean) =>
      <Path extends FieldPath<T>>(
        path: never extends RemoveKey ? Path : Exclude<Path, RemoveKey>,
        valueOrFunc: ValueOrSafeFunc<T, Path, Error>
      ) => {
        return updater([
          ...queue,
          origin => {
            const go = getSafeGo(origin, valueOrFunc, b, validate);

            return go(origin, path.split('.'));
          },
        ]);
      };

    return {
      run: origin => {
        const result = isNonEmptyArray(queue) ? composeId(...queue)(origin) : origin;
        const validated = validate(result);
        if (!validated.success) {
          return validated;
        }
        return { success: true, data: result };
      },
      set: createSetter(false),
      setIfNotNullish: createSetter(true),
    };
  };

  return updater([]);
};

export const joinByDot =
  <T extends string>(item: T) =>
  <U extends string | number>(n: U): `${T}.${U}` =>
    `${item}.${n}`;

export default { generateRecordUpdater, joinByDot, generateSafeRecordUpdater };

// ########################################################################################################################

const getGo = <T extends FieldValues, Path extends FieldPath<T>>(
  origin: T,
  valueOrFunc: ValueOrFunc<T, Path>,
  nullishFlag: boolean
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

      return valueOrFunc(item, origin);
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

const getSafeGo = <T extends FieldValues, Path extends FieldPath<T>, Error>(
  origin: T,
  valueOrFunc: ValueOrSafeFunc<T, Path, Error>,
  nullishFlag: boolean,
  validate: Validate<T, Error>
) => {
  const go = (item: any, keys: string[]): any => {
    if (item == null && !!keys.length) {
      return null;
    }

    if (!keys.length) {
      if (!isSafeFunc(valueOrFunc)) {
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

const isFunc = <T extends FieldValues, Path extends FieldPath<T>>(
  valueOrFunc: ValueOrFunc<T, Path>
): valueOrFunc is Func<T, Path> => typeof valueOrFunc === 'function';

const isSafeFunc = <T extends FieldValues, Path extends FieldPath<T>, Error>(
  valueOrFunc: ValueOrSafeFunc<T, Path, Error>
): valueOrFunc is SafeFunc<T, Path, Error> => typeof valueOrFunc === 'function';

type FieldValues = Record<string, unknown>;

type ValueOrFunc<T extends FieldValues, Path extends FieldPath<T>> = Value<T, Path> | Func<T, Path>;

type Value<T extends FieldValues, Path extends FieldPath<T>> = FieldPathValue<T, Path>;

type Func<T extends FieldValues, Path extends FieldPath<T>> = (
  item: FieldPathValue<T, Path>,
  origin: T
) => FieldPathValue<T, Path>;

type ValueOrSafeFunc<T extends FieldValues, Path extends FieldPath<T>, Error> =
  | Value<T, Path>
  | SafeFunc<T, Path, Error>;

type SafeFunc<T extends FieldValues, Path extends FieldPath<T>, Error> = (
  item: FieldPathValue<T, Path>,
  origin: () => Result<T, Error>
) => FieldPathValue<T, Path>;

type Constraint<T extends FieldValues, Error> = (item: T) => Error | undefined | true;

type Validate<T extends FieldValues, Error> = (item: T) =>
  | {
      success: true;
    }
  | { success: false; errors: NonEmptyArray<Error> };

type Result<T extends FieldValues, Error> =
  | {
      success: true;
      data: T;
    }
  | { success: false; errors: NonEmptyArray<Error> };

type DefaultError = Error;
