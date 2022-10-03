import enumerate from '@js-bits/enumerate';
import ExtendablePromise from '@js-bits/xpromise';
import Timeout from '@js-bits/timeout';
import performance from '@js-bits/performance';

const { Prefix } = enumerate;

// pseudo-private properties emulation in order to avoid source code transpiling
// TODO: replace with #privateField syntax when it gains wide support
const ø = enumerate`
  options
  setTiming
  finalize
`;

const STATES = enumerate`
  CREATED
  EXECUTED
  RESOLVED
  REJECTED
  SETTLED
`;

const { CREATED, EXECUTED, RESOLVED, REJECTED, SETTLED } = STATES;

const ERRORS = enumerate(Prefix('Executor|'))`
  InitializationError
`;

/**
 * Base class for any Executor extends Promise functionality.
 * Executor is a class of objects which can perform some simple action
 * (e.g. AJAX request or function call) and return received data asynchronously.
 * Exposes .resolve(), .reject() methods and .timings, this.timeout properties.
 * @class
 * @param {Object} options - input parameters
 */
class Executor extends ExtendablePromise {
  constructor(executor, options = {}) {
    super(executor);
    this[ø.options] = options;

    const { timings = {}, timeout } = options;

    /**
     * Reference to store performance timings
     * @type {Object}
     */
    this.timings = timings;

    // make sure all timings are reset
    Object.values(STATES).forEach(state => {
      timings[state] = undefined;
    });

    if (timeout instanceof Timeout) {
      // soft timeout will be caught and processed externally
      this.timeout = timeout;
    } else if (timeout !== undefined) {
      // hard timeout (rejects the receiver if exceeded) or no timeout
      this.timeout = new Timeout(timeout);
      this.timeout.catch(this.reject.bind(this)).catch(() => {});
    }

    this[ø.setTiming](CREATED);
  }

  // eslint-disable-next-line class-methods-use-this
  get [Symbol.toStringTag]() {
    return 'Executor';
  }

  resolve(...args) {
    const result = super.resolve(...args);
    this[ø.finalize](RESOLVED);
    return result;
  }

  reject(reason, ...args) {
    const result = super.reject(reason, ...args);
    this[ø.finalize](REJECTED);
    return result;
  }

  /**
   * Returns promise which will be resolved when data is received.
   * @returns {Promise} - a promise
   */
  execute(...args) {
    if (!this.timings[EXECUTED] && !this.timings[SETTLED]) {
      super.execute(...args);
      this[ø.setTiming](EXECUTED);
      if (this.timeout) this.timeout.set();
    }

    return this;
  }

  /**
   * Measures performance metrics
   * @private
   * @param {string} state - 'executed', 'resolved' or 'rejected'
   * @returns {void}
   */
  [ø.setTiming](state) {
    this.timings[state] = Math.round(performance.now()); // milliseconds
  }

  /**
   * @private
   * @param {string} state - 'executed', 'resolved' or 'rejected'
   * @returns {void}
   */
  [ø.finalize](state) {
    if (this.timeout) this.timeout.clear();
    this[ø.setTiming](state);
    this.timings[SETTLED] = this.timings[state];
  }
}

Executor.STATES = STATES;
Object.assign(Executor, ERRORS);

export default Executor;
