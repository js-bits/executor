/* eslint-disable no-console */
// @ts-nocheck
import Executor from '../src/executor.js';

const document = {};
const window = {
  addEventListener(event, callback) {
    setTimeout(callback, 100);
  },
};

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

export default (async () => {
  // create an instance of the class to be able to handle DOM Ready event
  const domReady = new DOMReadyReceiver();
  // wait for it to be resolved
  const isDomReady = await domReady;

  // check execution metrics
  console.log(`DOMReadyReceiver created in ${domReady.timings[CREATED] / 1000} s`); // DOMReadyReceiver created in 0.629 s
  console.log(`${isDomReady ? 'DOM ready' : 'DOMContentLoaded'} in ${domReady.timings[RESOLVED] / 1000} s`); // DOMContentLoaded in 0.644 s
  console.log(`Delay: ${domReady.timings[RESOLVED] - domReady.timings[EXECUTED]} ms`); // Delay: 15 ms
})();
