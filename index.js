import enumerate from '@js-bits/enumerate';
import Timeout from '@js-bits/timeout';
import performance from '@js-bits/performance';

// pseudo-private properties emulation in order to avoid source code transpiling
// TODO: replace with #privateField syntax when it gains wide support
const ø = enumerate`
  options
  promise
  resolve
  reject
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
// SETTLED // either 'resolved' or 'rejected'

const ERRORS = enumerate(String)`
  ExecutorInitializationError
`;

/**
 * Base class for any Executor extends Promise functionality.
 * Executor is a class of objects which can perform some simple action
 * (e.g. AJAX request or function call) and return received data asynchronously.
 * Exposes .resolve(), .reject() methods and .timings, this.timeout properties.
 * @class
 * @param {Object} options - input parameters
 */
class Executor {
  constructor(options = {}) {
    /**
     * @private
     */
    this[ø.options] = options;

    const { timings = {}, timeout } = options;

    /**
     * Reference to store performance timings
     * @type {Object}
     */
    this.timings = timings;

    // make sure all timings are reset
    Object.keys(timings).forEach(name => {
      timings[name] = undefined;
    });

    /**
     * Internal promise
     * @private
     */
    this[ø.promise] = new Promise((resolve, reject) => {
      this[ø.resolve] = resolve;
      this[ø.reject] = reject;
    });

    if (timeout instanceof Timeout) {
      // soft timeout will be caught and processed externally
      this.timeout = timeout;
    } else if (timeout !== undefined) {
      // hard timeout (rejects the receiver if exceeded) or no timeout
      this.timeout = new Timeout(timeout);
      this.timeout.catch(this.reject.bind(this));
    }

    // We need to catch a situation when promise gets immediately rejected inside constructor
    // to prevent log messages or breakpoints in browser console. The reason of the rejection
    // can be caught (or will throw an error if not caught) later when .get() method is invoked.
    this[ø.promise].catch(reason => {
      if (!this.timings[EXECUTED]) {
        // log.debug('Rejected inside constructor', reason);
      }
    });
  }

  resolve(...args) {
    this[ø.resolve](...args);
    this[ø.finalize](RESOLVED);
  }

  reject(reason, ...args) {
    if (!this.timings[EXECUTED] && reason && reason instanceof Error && reason.name === Error.prototype.name) {
      reason.name = ERRORS.ExecutorInitializationError;
    }

    this[ø.reject](reason, ...args);
    this[ø.finalize](REJECTED);
  }

  /**
   * Returns promise which will be resolved when data is received.
   * @returns {Promise} - a promise
   */
  get(...args) {
    if (!this.timings[EXECUTED] && !this.timings[SETTLED]) {
      this.$execute(...args);
      this[ø.setTiming](EXECUTED);
      if (this.timeout) this.timeout.set();
    }

    return this[ø.promise];
  }

  /**
   * Derived classes must implement .$execute() method performing corresponding action.
   * @protected
   * @returns {void}
   */
  $execute() {
    this.reject(new Error('.$execute() method must be implemented'));
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
    this[ø.setTiming](SETTLED);
  }
}

Executor.STATES = STATES;
Object.assign(Executor, ERRORS);

export default Executor;
