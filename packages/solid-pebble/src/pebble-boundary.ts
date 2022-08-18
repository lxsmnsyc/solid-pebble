import {
  createContext,
  JSX,
  createComponent,
  useContext,
  Signal,
  Accessor,
  getOwner,
} from 'solid-js';
import {
  ComputedPebble,
  Pebble,
  ProxyPebble,
  ProxySignal,
} from './core';
import PebbleManager from './pebble-manager';

const PebbleBoundaryContext = createContext<PebbleManager>();

export interface PebbleBoundaryProps {
  children: JSX.Element;
}

export function PebbleBoundary(props: PebbleBoundaryProps) {
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
export function usePebble<T, A>(pebble: ProxyPebble<T, A>): ProxySignal<T, A>;
export function usePebble<T, A>(
  pebble: Pebble<T> | ComputedPebble<T> | ProxyPebble<T, A>,
): Signal<T> | Accessor<T> | ProxySignal<T, A> {
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
  throw new Error('Unexpected pebble type.');
}
