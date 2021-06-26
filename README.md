# Abstract Executor class

`Executor` is a class derived from `Promise` and it has similar behavior but with one major difference: asynchronous operation that ties an outcome to a promise is decoupled from the constructor.

`Executor` also has two useful features:

- Built-in monitoring of execution time
- Optional rejection by a specified timeout

The package additionally includes a simple executor implementation called `Receiver`.

## Installation

Install with npm:

```
npm install @js-bits/executor
```

Install with yarn:

```
yarn add @js-bits/executor
```

Import where you need it:

```javascript
import Executor, { Receiver } from '@js-bits/executor';
```

## How to use

Since asynchronous operation is decoupled it won't be executed automatically when a new `Executor` gets created. Instead you have to call `.execute()` method explicitly.

```javascript
const asyncOperation = new Executor((resolve, reject) => {
  // perform some asynchronous actions
  // ...
  // and resolve the promise when the operation is completed
  resolve(123);
});
// ...
asyncOperation.execute();
// ...
asyncOperation.then(result => {
  // handle the result
  console.log('result', result); // 123
});
```

## Execution timings

There are five metrics available any time through `timings` property:

- `CREATED`
- `EXECUTED`
- `RESOLVED`
- `REJECTED`
- `SETTLED` (equals to either `RESOLVED` or `REJECTED`)

Use `Executor.STATES` static enum property in order to to access them.

```javascript
// create a new class of Executor
class DOMReadyReceiver extends Executor {
  constructor(...args) {
    super((resolve, reject) => {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        resolve(true);
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          resolve(false);
        });
      }
    }, ...args);
    this.execute(); // let's execute it right away for the sake of demo
  }
}

// create local state constants for convenience
const { CREATED, EXECUTED, RESOLVED } = DOMReadyReceiver.STATES;

(async () => {
  // create an instance of the class to be able to handle DOM Ready event
  const domReady = new DOMReadyReceiver();
  // wait for it to be resolved
  const isDomReady = await domReady;

  // check execution metrics
  console.log(`DOMReadyReceiver created in ${domReady.timings[CREATED] / 1000} s`); // DOMReadyReceiver created in 0.629 s
  console.log(`${isDomReady ? 'DOM ready' : 'DOMContentLoaded'} in ${domReady.timings[RESOLVED] / 1000} s`); // DOMContentLoaded in 0.644 s
  console.log(`Delay: ${domReady.timings[RESOLVED] - domReady.timings[EXECUTED]} ms`); // Delay: 15 ms
})();
```

## Receiver

`Receiver` does not accept any executor function which means it doesn't perform any actions by itself. `Receiver` can be used to asynchronously assign a value to some variable or indicate some event.

```javascript
const someAsyncValue = new Receiver();
const { EXECUTED, RESOLVED } = Receiver.STATES;

(async () => {
  setTimeout(() => {
    someAsyncValue.resolve(123);
  }, 1000);

  console.log(`Received value: ${await someAsyncValue}`); // Received value: 123
  console.log(`It took ${someAsyncValue.timings[RESOLVED] - someAsyncValue.timings[EXECUTED]} ms to receive the value`); // It took 1005 ms to receive the value
})();
```

## Notes

- Internet Explorer is not supported.
