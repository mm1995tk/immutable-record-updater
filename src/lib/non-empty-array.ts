export type NonEmptyArray<T> = [T, ...T[]];

export const isNonEmptyArray = <T>(items: T[]): items is NonEmptyArray<T> => !!items.length;
