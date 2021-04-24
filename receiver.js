import Executor from './executor.js';

/**
 * Does nothing but waits to be resolved or rejected by external code
 * (and also registers internal timings)
 */
class Receiver extends Executor {
  constructor(options) {
    super(() => {}, options);
  }

  /**
   * An alias of {@link Executor#execute} method
   */
  async wait(...args) {
    return this.execute(...args);
  }
}

export default Receiver;
