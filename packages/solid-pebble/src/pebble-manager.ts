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
  CustomPebble,
  CustomSignal,
  Pebble,
  PebbleContext,
  ProxyPebble,
  ProxySignal,
} from './core';
import { Parameter, unwrapLazy } from './utils';

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

  private proxies = new Map<string, ProxySignal<any, any, any>>();

  getProxy<T, A, R>(pebble: ProxyPebble<T, A, R>): ProxySignal<T, A, R> {
    const instance = this.proxies.get(pebble.name);
    if (instance) {
      return instance as ProxySignal<T, A, R>;
    }
    const signal = runWithOwner(
      this.owner,
      (): ProxySignal<T, A, R> => [
        createMemo(
          () => pebble.get(this),
          undefined,
          pebble,
        ),
        (action: A) => pebble.set(this, action),
      ],
    );
    this.proxies.set(pebble.name, signal as ProxySignal<any, any, any>);
    return signal;
  }

  private customs = new Map<string, CustomSignal<any, any, any>>();

  getCustom<T, A, R>(pebble: CustomPebble<T, A, R>): CustomSignal<T, A, R> {
    const instance = this.customs.get(pebble.name);
    if (instance) {
      return instance as CustomSignal<T, A, R>;
    }
    const signal = runWithOwner(
      this.owner,
      (): CustomSignal<T, A, R> => {
        const methods = pebble.factory(this);
        const [track, trigger] = createSignal([], {
          equals: false,
        });

        return [
          () => methods.get(() => {
            track();
          }),
          (action) => methods.set(
            () => {
              trigger([]);
            },
            action,
          ),
        ];
      },
    );
    this.customs.set(pebble.name, signal as CustomSignal<any, any, any>);
    return signal;
  }

  get<T>(pebble: Pebble<T>): T;

  get<T>(pebble: ComputedPebble<T>): T;

  get<T, A, R>(pebble: ProxyPebble<T, A, R>): T;

  get<T, A, R>(pebble: CustomPebble<T, A, R>): T;

  get<T, A, R>(
    pebble:
      Pebble<T>
      | ComputedPebble<T>
      | ProxyPebble<T, A, R>
      | CustomPebble<T, A, R>,
  ) {
    switch (pebble.type) {
      case 'pebble':
        return this.getPebble(pebble)[0]();
      case 'computed':
        return this.getComputed(pebble)();
      case 'proxy':
        return this.getProxy(pebble)[0]();
      case 'custom':
        return this.getCustom(pebble)[0]();
      default:
        throw new Error('Unknown pebble type');
    }
  }

  set<T>(pebble: Pebble<T>, value: Parameter<Setter<T>>): T;

  set<T, A, R>(pebble: ProxyPebble<T, A, R>, action: A): R;

  set<T, A, R>(pebble: CustomPebble<T, A, R>, action: A): R;

  set<T, A, R>(
    pebble:
      | Pebble<T>
      | ProxyPebble<T, A, R>
      | CustomPebble<T, A, R>,
    action: Parameter<Setter<T>> | A,
  ): T | R {
    switch (pebble.type) {
      case 'pebble':
        return this.getPebble(pebble)[1](action as Parameter<Setter<T>>);
      case 'proxy':
        return this.getProxy(pebble)[1](action as A);
      case 'custom':
        return this.getCustom(pebble)[1](action as A);
      default:
        throw new Error('Unknown pebble type');
    }
  }
}
