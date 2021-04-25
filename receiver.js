import Executor from './executor.js';

/**
 * Does nothing but waits to be resolved or rejected by external code
 * (and also registers internal timings)
 */
class Receiver extends Executor {
  constructor(...args) {
    super(() => {}, ...args);
    this.execute();
  }
}

export default Receiver;
