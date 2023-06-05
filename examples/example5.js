/* eslint-disable no-console */
// @ts-nocheck
import Receiver from '../src/receiver.js';

const someAsyncValue = new Receiver();
const { EXECUTED, RESOLVED } = Receiver.STATES;

export default (async () => {
  setTimeout(() => {
    someAsyncValue.resolve(123);
  }, 1000);

  const result = await someAsyncValue;
  console.log(`Received value: ${result}`); // Received value: 123
  console.log(`It took ${someAsyncValue.timings[RESOLVED] - someAsyncValue.timings[EXECUTED]} ms to receive the value`); // It took 1005 ms to receive the value
})();
