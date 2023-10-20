import type {
  JSX,
  Signal,
  Accessor,
} from 'solid-js';
import {
  createContext,
  createComponent,
  useContext,
  getOwner,
} from 'solid-js';
import type {
  ComputedPebble,
  CustomPebble,
  CustomSignal,
  Pebble,
  ProxyPebble,
  ProxySignal,
} from './core';
import PebbleManager from './pebble-manager';

const PebbleBoundaryContext = createContext<PebbleManager>();

export interface PebbleBoundaryProps {
  children: JSX.Element;
}

export function PebbleBoundary(props: PebbleBoundaryProps): JSX.Element {
  const owner = getOwner();

  if (!owner) {
    throw new Error('Unexpected missing owner.');
  }

  const manager = new PebbleManager(owner);

  return createComponent(PebbleBoundaryContext.Provider, {
    value: manager,
    get children() {
      return props.children;
    },
  });
}

function usePebbleBoundaryContext(): PebbleManager {
  const ctx = useContext(PebbleBoundaryContext);

  if (ctx) {
    return ctx;
  }
  throw new Error('Missing <PebbleBoundary>');
}

export function usePebble<T>(pebble: Pebble<T>): Signal<T>;
export function usePebble<T>(pebble: ComputedPebble<T>): Accessor<T>;
export function usePebble<T, A, R>(pebble: ProxyPebble<T, A, R>): ProxySignal<T, A, R>;
export function usePebble<T, A, R>(pebble: CustomPebble<T, A, R>): CustomSignal<T, A, R>;
export function usePebble<T, A, R>(
  pebble: Pebble<T> | ComputedPebble<T> | ProxyPebble<T, A, R> | CustomPebble<T, A, R>,
): Signal<T> | Accessor<T> | ProxySignal<T, A, R> | CustomSignal<T, A, R> {
  const ctx = usePebbleBoundaryContext();
  if (pebble.type === 'pebble') {
    return ctx.getPebble(pebble);
  }
  if (pebble.type === 'computed') {
    return ctx.getComputed(pebble);
  }
  if (pebble.type === 'proxy') {
    return ctx.getProxy(pebble);
  }
  if (pebble.type === 'custom') {
    return ctx.getCustom(pebble);
  }
  throw new Error('Unexpected pebble type.');
}
