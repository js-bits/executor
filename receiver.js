import Executor from './executor.js';

/**
 * Does nothing but waits to be resolved or rejected by external code
 * (and also registers internal timings)
 */
class Receiver extends Executor {
  // eslint-disable-next-line class-methods-use-this
  execute() {}

  /**
   * Alias of {@link Executor#do} method
   */
  wait(...args) {
    return this.do(...args);
  }
}

export default Receiver;
