# solid-pebble

> State management library for SolidJS

[![NPM](https://img.shields.io/npm/v/solid-pebble.svg)](https://www.npmjs.com/package/solid-pebble) [![JavaScript Style Guide](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)[![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-blue?style=flat-square&logo=codesandbox)](https://codesandbox.io/s/github/LXSMNSYC/solid-pebble/tree/main/examples/demo)

## Install

```bash
npm i solid-pebble
```

```bash
yarn add solid-pebble
```

```bash
pnpm add solid-pebble
```

## Why

Global state management in SolidJS is an already solved problem, however, even though it is handy, it introduces another problem: when working with SSR, global state tend to persist its current state as long as the runtime persist, which is bad for SSR because a lifetime of a global state should be bound to the app's instance. This is referred to as "cross-request state pollution" as two concurrent SSR requests may inadvertently share the same state.

`solid-pebble` allows you to declare global states that behave like a local state. These states are tied to their app/boundary instance so it keeps the state from getting shared across boundaries.

## Usage

### Boundary

Before using `solid-pebble`, one must mount the `PebbleBoundary` to their app, ideally, at the root.

```js
import { PebbleBoundary } from 'solid-pebble';

<PebbleBoundary>
  <App />
</PebbleBoundary>
```

`PebbleBoundary` will manage the lifecycles and instances of the pebbles.

### Pebbles

A pebble is the synonym of `createSignal` for `solid-pebble`: a fundamental "global" state. It shares almost the same syntax:

```tsx
import { createPebble } from 'solid-pebble';

const countPebble = createPebble(0);
```

but unlike signals, pebbles are lazily-evaluated, so you won't get the accessor nor the setter of a pebble without the use of `usePebble`.

```tsx
import { usePebble } from 'solid-pebble';

function Counter() {
  const [count, setCount] = usePebble(countPebble);
  
  function increment() {
    setCount((c) => c + 1);
  }

  return (
    <> 
      <h1>Count: {count()}</h1>
      <button onClick={increment}>Increment</button>
    </>
  );
}
```

Since pebble instances are managed by `PebbleBoundary`, unmounting the component that uses `usePebble` won't reset the state of the given pebble, and the state of the given pebble is also shared by similar components, which means that if one component updates a given pebble, the other components that uses it will also receive the same update.

and by lazily-evaluated, you can also use lazy initial values

```js
const lazyPebble = createPebble(() => initializePebbleValue());
```

### Computed pebbles

Pebbles themselves are great, just like signals, but how do we make computed pebbles? We can use `createComputedPebble` which is also similar to `createMemo` with some significant difference.

```js
import { createComputedPebble } from 'solid-pebble';

const doubleCountPebble = createComputedPebble(
  (context) => context.get(countPebble) * 2,
);
```

`createComputedPebble` receives a context object that helps us read values from other pebbles and computed pebbles, this also tracks the pebbles for value updates.

Like `createPebble`, we use `usePebble` to get the accessor from `createComputedPebble`

```js
import { usePebble } from 'solid-pebble';

function DoubleCounter() {
  const doubleCount = usePebble(doubleCountPebble);

  return (
    <h1>Double Count: {doubleCount()}</h1>
  );
}
```

Just like `createMemo`, you can pass an initial value and/or receive the previously computed value

```js
const upwardsCount = createComputedPebble((context, previous) => {
  const current = context.get(countPebble);
  if (previous < current) {
    return current;
  }
  return previous;
}, {
  initialValue: 10, // can also be lazy i.e. () => Math.random() * 100
});
```

## License

MIT © [lxsmnsyc](https://github.com/lxsmnsyc)
