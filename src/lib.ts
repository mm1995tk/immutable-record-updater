export type UnaryOperator<T> = (_: T) => T;
export type NonEmptyArray<T> = [T, ...T[]];

export const composeUnaryOperator =
  <T extends Record<string, unknown>>(head: UnaryOperator<T>, ...tail: UnaryOperator<T>[]): UnaryOperator<T> =>
  (item: T) =>
    tail.reduce((acc, cur) => cur(acc), head(item));

export const isNonEmptyArray = <T>(items: T[]): items is NonEmptyArray<T> => !!items.length;
