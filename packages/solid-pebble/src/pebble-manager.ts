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

  private customs = new Map<string, CustomSignal<any, any>>();

  getCustom<T, A>(pebble: CustomPebble<T, A>): CustomSignal<T, A> {
    const instance = this.customs.get(pebble.name);
    if (instance) {
      return instance as CustomSignal<T, A>;
    }
    const signal = runWithOwner(
      this.owner,
      (): CustomSignal<T, A> => {
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
    this.customs.set(pebble.name, signal as CustomSignal<any, any>);
    return signal;
  }

  get<T>(pebble: Pebble<T>): T;

  get<T>(pebble: ComputedPebble<T>): T;

  get<T, A>(pebble: ProxyPebble<T, A>): T;

  get<T, A>(pebble: CustomPebble<T, A>): T;

  get<T, A>(
    pebble:
      Pebble<T>
      | ComputedPebble<T>
      | ProxyPebble<T, A>
      | CustomPebble<T, A>,
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

  set<T>(pebble: Pebble<T>, value: Parameter<Setter<T>>): void;

  set<T, A>(pebble: ProxyPebble<T, A>, action: A): void;

  set<T, A>(pebble: CustomPebble<T, A>, action: A): void;

  set<T, A>(
    pebble:
      | Pebble<T>
      | ProxyPebble<T, A>
      | CustomPebble<T, A>,
    action: any,
  ): void {
    switch (pebble.type) {
      case 'pebble':
        this.getPebble(pebble)[1](action as Parameter<Setter<T>>);
        break;
      case 'proxy':
        this.getProxy(pebble)[1](action as A);
        break;
      case 'custom':
        this.getCustom(pebble)[1](action as A);
        break;
      default:
        throw new Error('Unknown pebble type');
    }
  }
}
