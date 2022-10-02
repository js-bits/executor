import Timeout from '@js-bits/timeout';
import Executor from '../src/executor.js';

const asyncOperation = new Executor(
  (resolve, reject) => {
    setTimeout(() => {
      resolve('Success!!!'); // resolve the operation in about 1 second
    }, 1000);
  },
  {
    timeout: new Timeout(100),
  }
);

export default (async () => {
  asyncOperation.execute();
  asyncOperation.timeout.catch(reason => {
    if (reason.name === Timeout.TimeoutExceededError) {
      // you can report that operation has timed out
      console.log('Operation has exceeded specified timeout.'); // Operation has exceeded specified timeout.
    }
  });
  // operation can still continue
  const result = await asyncOperation;
  console.log(result); // Success!!!
})();
