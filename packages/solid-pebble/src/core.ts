import { Setter } from "solid-js";

type Lazy<T> = T | (() => T);

function isLazy<T>(value: Lazy<T>): value is (() => T) {
  return typeof value === 'function';
}

export function unwrapLazy<T>(value: Lazy<T>): T {
  if (isLazy(value)) {
    return value();
  }
  return value;
}

export interface Pebble<T> {
  type: 'pebble';
  initialValue: Lazy<T>;
  name: string;
  equals?: false | ((prev: T, next: T) => boolean);
}

export interface PebbleOptions<T> {
  name?: string;
  equals?: false | ((prev: T, next: T) => boolean);
}

let ID = 0;

function getID() {
  const current = ID;
  ID += 1;
  return current;
}

export function createPebble<T>(
  initialValue: Lazy<T>,
  options?: PebbleOptions<T>,
): Pebble<T> {
  return {
    type: 'pebble',
    initialValue,
    name: options?.name ?? `pebble-${getID()}`,
    equals: options?.equals,
  };
}

export type Parameter<T> = T extends (arg: infer U) => any
  ? U
  : never;

export interface PebbleContext {
  read<T>(pebble: Pebble<T> | ComputedPebble<T>): T;
  write<T>(pebble: Pebble<T>, value: Parameter<Setter<T>>): T;
}

export type ComputedPebbleComputationWithInitial<T> = (context: PebbleContext, prev: T) => T;
export type ComputedPebbleComputationWithoutInitial<T> = (context: PebbleContext, prev?: T) => T;

export type ComputedPebbleComputation<T> =
  | ComputedPebbleComputationWithInitial<T>
  | ComputedPebbleComputationWithoutInitial<T>;

export interface ComputedPebbleWithInitial<T> extends Omit<Pebble<T>, 'type'> {
  type: 'computed';
  computation: ComputedPebbleComputationWithInitial<T>;
}

export interface ComputedPebbleWithoutInitial<T> extends Omit<Pebble<T>, 'type' | 'initialValue'> {
  type: 'computed';
  computation: ComputedPebbleComputationWithoutInitial<T>;
}

export type ComputedPebble<T> =
  | ComputedPebbleWithInitial<T>
  | ComputedPebbleWithoutInitial<T>;

export interface ComputedPebbleOptionsWithInitial<T> extends PebbleOptions<T> {
  initialValue: Lazy<T>;
}

export interface ComputedPebbleOptionsWithoutInitial<T> extends PebbleOptions<T> {
}

export type ComputedPebbleOptions<T> =
  | ComputedPebbleOptionsWithInitial<T>
  | ComputedPebbleOptionsWithoutInitial<T>;

export function createComputedPebble<T>(
  computation: ComputedPebbleComputationWithInitial<T>,
  options?: ComputedPebbleOptionsWithInitial<T>,
): ComputedPebbleWithInitial<T>;
export function createComputedPebble<T>(
  computation: ComputedPebbleComputationWithoutInitial<T>,
  options?: ComputedPebbleOptionsWithoutInitial<T>,
): ComputedPebbleWithoutInitial<T>;
export function createComputedPebble<T>(
  computation: ComputedPebbleComputation<T>,
  options?: ComputedPebbleOptions<T>,
): ComputedPebble<T> {
  if (options && 'initialValue' in options) {
    return {
      type: 'computed',
      computation,
      name: options.name ?? `computed-${getID()}`,
      equals: options.equals,
      initialValue: options.initialValue,
    };
  }
  return {
    type: 'computed',
    computation,
    name: `computed-${getID()}`,
  } as ComputedPebbleWithoutInitial<T>;
}