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

## Receiver

`Receiver` does not accept any executor function which means it doesn't perform any actions by itself. `Receiver` can be used to asynchronously assign a value to a variable.

```javascript
(async () => {
  const someAsyncValue = new Receiver();

  setTimeout(() => {
    someAsyncValue.resolve(234);
  }, 1000);

  console.log('result', await someAsyncValue); // 234
})();
```

## Notes

- Internet Explorer is not supported.
