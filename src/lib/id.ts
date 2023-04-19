export type Id<T> = (_: T) => T;

export const composeId = <T extends Record<string, unknown>>(head: Id<T>, ...tail: Id<T>[]): Id<T> => {
  return (item: T) =>
    tail.reduce((acc, cur) => {
      return cur(acc);
    }, head(item));
};
