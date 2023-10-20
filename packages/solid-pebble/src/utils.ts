export type Lazy<T> = T | (() => T);

function isLazy<T>(value: Lazy<T>): value is (() => T) {
  return typeof value === 'function';
}

export function unwrapLazy<T>(value: Lazy<T>): T {
  if (isLazy(value)) {
    return value();
  }
  return value;
}

export type Parameter<T> = T extends (arg: infer U) => any
  ? U
  : never;

let ID = 0;

export function getID(): number {
  const current = ID;
  ID += 1;
  return current;
}
