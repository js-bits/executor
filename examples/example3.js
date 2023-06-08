/* eslint-disable no-unused-vars, no-console */
import Timeout from '@js-bits/timeout';
import Executor from '../src/executor.js';

const asyncOperation = new Executor(
  (resolve, reject) => {
    setTimeout(() => {
      resolve(); // resolve the operation in about 1 second
    }, 1000);
  },
  {
    timeout: 100, // set timeout to 100 ms
  }
);

export default (async () => {
  const { EXECUTED, RESOLVED, SETTLED } = Executor.STATES;

  asyncOperation.execute();
  try {
    await asyncOperation;
    console.log(`Resolved in ${(asyncOperation.timings[RESOLVED] - asyncOperation.timings[EXECUTED]) / 1000} s`);
  } catch (reason) {
    // TimeoutExceededError: Operation timeout exceeded
    if (reason.name === Timeout.TimeoutExceededError) {
      console.log(`Timed out in ${asyncOperation.timings[SETTLED] - asyncOperation.timings[EXECUTED]} ms`); // Timed out in 104 ms
    }
  }
})();
