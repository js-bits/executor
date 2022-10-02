import Executor from '../src/executor.js';

const asyncOperation = new Executor((resolve, reject) => {
  // perform some asynchronous actions
  // ...
  // and resolve the promise when the operation is completed
  resolve(123);
});
// ...
// execute the operation where necessary
asyncOperation.execute();
// ...
// handle the result
asyncOperation.then(result => {
  console.log('result', result); // 123
});

export default asyncOperation;
