import Executor from './executor.js';

/**
 * Does nothing but waits to be resolved or rejected by external code
 * (and also registers internal timings)
 */
class Receiver extends Executor {
  constructor(...args) {
    super(() => {}, ...args);
  }

  then(...args) {
    // execute when the result first gets accessed
    this.execute();
    return super.then(...args);
  }

  resolve(...args) {
    // execute when the result first gets resolved
    this.execute();
    return super.resolve(...args);
  }

  reject(...args) {
    // execute when the result first gets reject
    this.execute();
    return super.reject(...args);
  }
}

export default Receiver;
