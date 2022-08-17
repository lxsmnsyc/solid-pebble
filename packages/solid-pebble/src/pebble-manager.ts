import {
  Accessor,
  createMemo,
  createSignal,
  Owner,
  runWithOwner,
  Setter,
  Signal,
} from "solid-js";
import {
  ComputedPebble,
  Parameter,
  Pebble,
  PebbleContext,
  unwrapLazy,
} from "./core";

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
      () => createSignal(unwrapLazy(pebble.initialValue), pebble)
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

  read<T>(pebble: Pebble<T> | ComputedPebble<T>) {
    if (pebble.type === 'pebble') {
      return this.getPebble(pebble)[0]();
    }
    if (pebble.type === 'computed') {
      return this.getComputed(pebble)();
    }
    throw new Error('Unknown pebble type');
  }

  write<T>(pebble: Pebble<T>, value: Parameter<Setter<T>>): T {
    const setPebble = this.getPebble(pebble)[1];
    return setPebble(value);
  }
}