import { Accessor, Setter } from 'solid-js';
import { getID, Lazy, Parameter } from './utils';

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

export interface PebbleContext {
  get<T>(pebble: Pebble<T>): T;
  get<T>(pebble: ComputedPebble<T>): T;
  get<T, A, R>(pebble: ProxyPebble<T, A, R>): T;
  get<T, A, R>(pebble: CustomPebble<T, A, R>): T;

  set<T>(pebble: Pebble<T>, value: Parameter<Setter<T>>): void;
  set<T, A, R>(pebble: ProxyPebble<T, A, R>, action: A): R;
  set<T, A, R>(pebble: CustomPebble<T, A, R>, action: A): R;
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

export type ProxySignal<T, A, R> = [Accessor<T>, (action: A) => R];

export interface ProxyPebble<T, A, R> extends Omit<Pebble<T>, 'type' | 'initialValue'> {
  type: 'proxy';
  get: (context: PebbleContext) => T;
  set: (context: PebbleContext, action: A) => R;
}

export interface ProxyPebbleOptions<T, A, R> extends PebbleOptions<T> {
  get: (context: PebbleContext) => T;
  set: (context: PebbleContext, action: A) => R;
}

export function createProxyPebble<T, A, R>(
  options: ProxyPebbleOptions<T, A, R>,
): ProxyPebble<T, A, R> {
  return {
    type: 'proxy',
    get: options.get,
    set: options.set,
    name: options.name ?? `proxy-${getID()}`,
    equals: options.equals,
  };
}

export interface CustomPebbleMethods<T, A, R> {
  get: (track: () => void) => T;
  set: (trigger: () => void, action: A) => R;
}

export type CustomPebbleFactory<T, A, R> = (context: PebbleContext) => CustomPebbleMethods<T, A, R>;

export interface CustomPebbleOptions {
  name: string;
}

export interface CustomPebble<T, A, R> {
  type: 'custom';
  factory: CustomPebbleFactory<T, A, R>;
  name: string;
}

export type CustomSignal<T, A, R> = ProxySignal<T, A, R>;

export function createCustomPebble<T, A, R>(
  factory: CustomPebbleFactory<T, A, R>,
  options?: CustomPebbleOptions,
): CustomPebble<T, A, R> {
  return {
    type: 'custom',
    factory,
    name: options?.name ?? `custom-${getID()}`,
  };
}
