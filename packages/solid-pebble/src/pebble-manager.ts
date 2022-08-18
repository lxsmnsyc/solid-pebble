import {
  Accessor,
  createMemo,
  createSignal,
  Owner,
  runWithOwner,
  Setter,
  Signal,
} from 'solid-js';
import {
  ComputedPebble,
  Parameter,
  Pebble,
  PebbleContext,
  ProxyPebble,
  ProxySignal,
  unwrapLazy,
} from './core';

export default class PebbleManager implements PebbleContext {
  private owner: Owner;

  constructor(owner: Owner) {
    this.owner = owner;
  }

  private pebbles = new Map<string, Signal<any>>();

  getPebble<T>(pebble: Pebble<T>): Signal<T> {
    const instance = this.pebbles.get(pebble.name);
    if (instance) {
      return instance as Signal<T>;
    }
    const signal = runWithOwner(
      this.owner,
      () => createSignal(unwrapLazy(pebble.initialValue), pebble),
    );
    this.pebbles.set(pebble.name, signal as Signal<any>);
    return signal;
  }

  private computeds = new Map<string, Accessor<any>>();

  getComputed<T>(pebble: ComputedPebble<T>): Accessor<T> {
    const instance = this.computeds.get(pebble.name);
    if (instance) {
      return instance as Accessor<T>;
    }
    const memo = runWithOwner(
      this.owner,
      () => {
        if ('initialValue' in pebble) {
          return createMemo(
            (prev) => pebble.computation(this, prev),
            unwrapLazy(pebble.initialValue),
            pebble,
          );
        }
        return createMemo(
          (prev) => pebble.computation(this, prev),
          undefined,
          pebble,
        );
      },
    );
    this.computeds.set(pebble.name, memo as Accessor<any>);
    return memo;
  }

  private proxies = new Map<string, ProxySignal<any, any>>();

  getProxy<T, A>(pebble: ProxyPebble<T, A>): ProxySignal<T, A> {
    const instance = this.proxies.get(pebble.name);
    if (instance) {
      return instance as ProxySignal<T, A>;
    }
    const signal = runWithOwner(
      this.owner,
      (): ProxySignal<T, A> => [
        createMemo(
          () => pebble.get(this),
          undefined,
          pebble,
        ),
        (action: A) => pebble.set(this, action),
      ],
    );
    this.proxies.set(pebble.name, signal as ProxySignal<any, any>);
    return signal;
  }

  get<T>(pebble: Pebble<T>): Signal<T>;

  get<T>(pebble: ComputedPebble<T>): Accessor<T>;

  get<T, A>(pebble: ProxyPebble<T, A>): ProxySignal<T, A>;

  get<T, A>(
    pebble:
      Pebble<T>
      | ComputedPebble<T>
      | ProxyPebble<T, A>,
  ) {
    if (pebble.type === 'pebble') {
      return this.getPebble(pebble)[0]();
    }
    if (pebble.type === 'computed') {
      return this.getComputed(pebble)();
    }
    if (pebble.type === 'proxy') {
      return this.getProxy(pebble)[0]();
    }
    throw new Error('Unknown pebble type');
  }

  set<T>(pebble: Pebble<T>, value: Parameter<Setter<T>>): T {
    const setPebble = this.getPebble(pebble)[1];
    return setPebble(value);
  }
}
