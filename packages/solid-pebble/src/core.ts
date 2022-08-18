import { Accessor, Setter } from 'solid-js';

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
  get<T>(pebble: Pebble<T>): T;
  get<T>(pebble: ComputedPebble<T>): T;
  get<T, A>(pebble: ProxyPebble<T, A>): T;
  get<T, A>(pebble: CustomPebble<T, A>): T;

  set<T>(pebble: Pebble<T>, value: Parameter<Setter<T>>): void;
  set<T, A>(pebble: ProxyPebble<T, A>, action: A): void;
  set<T, A>(pebble: CustomPebble<T, A>, action: A): void;
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

export type ComputedPebbleOptionsWithoutInitial<T> = PebbleOptions<T>

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

export type ProxySignal<T, A> = [Accessor<T>, (action: A) => void];

export interface ProxyPebble<T, A> extends Omit<Pebble<T>, 'type' | 'initialValue'> {
  type: 'proxy';
  get: (context: PebbleContext) => T;
  set: (context: PebbleContext, action: A) => void;
}

export interface ProxyPebbleOptions<T, A> extends PebbleOptions<T> {
  get: (context: PebbleContext) => T;
  set: (context: PebbleContext, action: A) => void;
}

export function createProxyPebble<T, A>(
  options: ProxyPebbleOptions<T, A>,
): ProxyPebble<T, A> {
  return {
    type: 'proxy',
    get: options.get,
    set: options.set,
    name: options.name ?? `proxy-${getID()}`,
    equals: options.equals,
  };
}

export interface CustomPebbleMethods<T, A> {
  get: (track: () => void) => T;
  set: (trigger: () => void, action: A) => void;
}

export type CustomPebbleFactory<T, A> = (context: PebbleContext) => CustomPebbleMethods<T, A>;

export interface CustomPebbleOptions {
  name: string;
}

export interface CustomPebble<T, A> {
  type: 'custom';
  factory: CustomPebbleFactory<T, A>;
  name: string;
}

export type CustomSignal<T, A> = ProxySignal<T, A>;

export function createCustomPebble<T, A>(
  factory: CustomPebbleFactory<T, A>,
  options?: CustomPebbleOptions,
): CustomPebble<T, A> {
  return {
    type: 'custom',
    factory,
    name: options?.name ?? `custom-${getID()}`,
  };
}
