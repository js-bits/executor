import Executor from './executor.js';

/**
 * Does nothing but waiting to be resolved or rejected by external code
 * (and also registers internal timings)
 */
class Receiver extends Executor {
  // eslint-disable-next-line class-methods-use-this
  $execute() {}
}

export default Receiver;
