# Abstract executor

An abstract executor is similar to a promise with two major differences:

- Asynchronous operation that ties an outcome to a promise is decoupled from resolve/reject functions
- Built-in execution time monitoring

The package also includes a basic executor implementation called `Receiver`.

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

Since `Executor` is an abstract class it is not possible to use it directly. In order to be able to create executor instances you have to create a derived class implementing `.execute()` method. The method basically defines what an executor actually does and what should be its outcome.

```javascript
class AsyncOperation extends Executor {
  async execute() {
    // perform some asynchronous actions
    // ...
    // and resolve the promise when it's completed
    this.resolve(result);
  }
}

const asyncOp = new AsyncOperation();
// ...
asyncOp.execute();
// ...
asyncOp.then(result => {
  // handle the result
});
```

## Notes

- Internet Explorer is not supported.
