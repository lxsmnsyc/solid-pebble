import {
  PebbleBoundary,
  createComputedPebble,
  createPebble,
  usePebble,
} from 'solid-pebble';

const countPebble = createPebble(0);
const countTitle = createComputedPebble(
  context => `Count: ${context.get(countPebble)}`,
);

function Increment() {
  const [, setCount] = usePebble(countPebble);

  function increment() {
    setCount(c => c + 1);
  }

  return (
    <button
      type="button"
      onClick={increment}
      class="p-2 rounded-lg bg-gray-900 bg-opacity-10"
    >
      Increment
    </button>
  );
}

function Decrement() {
  const [, setCount] = usePebble(countPebble);

  function decrement() {
    setCount(c => c - 1);
  }

  return (
    <button
      type="button"
      onClick={decrement}
      class="p-2 rounded-lg bg-gray-900 bg-opacity-10"
    >
      Decrement
    </button>
  );
}

function Count() {
  const title = usePebble(countTitle);

  return <span>{title()}</span>;
}

export default function App() {
  return (
    <PebbleBoundary>
      <div class="flex items-center justify-center space-x-2 text-white p-2 rounded-lg bg-gray-900 bg-opacity-10">
        <Increment />
        <Count />
        <Decrement />
      </div>
    </PebbleBoundary>
  );
}
