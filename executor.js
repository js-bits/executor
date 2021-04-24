import enumerate from '@js-bits/enumerate';
import Timeout from '@js-bits/timeout';
import performance from '@js-bits/performance';

// pseudo-private properties emulation in order to avoid source code transpiling
// TODO: replace with #privateField syntax when it gains wide support
const ø = enumerate`
  options
  executor
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

const ERRORS = enumerate(String)`
  ExecutorInitializationError
`;

// https://stackoverflow.com/questions/6598945/detect-if-function-is-native-to-browser
const isNativeFunction = func =>
  typeof func === 'function' && /\{\s+\[native code\]/.test(Function.prototype.toString.call(func));

/**
 * Base class for any Executor extends Promise functionality.
 * Executor is a class of objects which can perform some simple action
 * (e.g. AJAX request or function call) and return received data asynchronously.
 * Exposes .resolve(), .reject() methods and .timings, this.timeout properties.
 * @class
 * @param {Object} options - input parameters
 */
class Executor extends Promise {
  constructor(...args) {
    const lastArg = args[args.length - 1];
    if (isNativeFunction(lastArg)) {
      // internal promise call
      // eslint-disable-next-line constructor-super
      return super(lastArg);
    }

    let resolve;
    let reject;
    super((...funcs) => {
      [resolve, reject] = funcs;
    });
    this[ø.resolve] = resolve;
    this[ø.reject] = reject;

    const [executor, options = {}] = args;
    this[ø.options] = options;
    this[ø.executor] = executor;

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
      this.timeout.catch(this.reject.bind(this));
    }

    this[ø.setTiming](CREATED);

    // We need to catch a situation when promise gets immediately rejected inside constructor
    // to prevent log messages or breakpoints in browser console. The reason of the rejection
    // can be caught (or will throw an error if not caught) later when .do() method is invoked.
    this.catch(reason => {
      if (!this.timings[EXECUTED]) {
        // log.debug('Rejected inside constructor', reason);
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  get [Symbol.toStringTag]() {
    return 'Executor';
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
  execute(...args) {
    if (!this.timings[EXECUTED] && !this.timings[SETTLED]) {
      this[ø.executor](...args);
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
