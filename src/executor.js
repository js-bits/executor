import enumerate from '@js-bits/enumerate';
import ExtendablePromise from '@js-bits/xpromise';
import Timeout from '@js-bits/timeout';
import performance from '@js-bits/performance';

// pseudo-private properties emulation in order to avoid source code transpiling
// TODO: replace with #privateField syntax when it gains wide support
const ø = enumerate.ts(`
  options
  setTiming
  finalize
`);

const STATES = enumerate.ts(
  `
  CREATED
  EXECUTED
  RESOLVED
  REJECTED
  SETTLED
`,
  String
);

/**
 * @typedef {{ readonly [Key in Exclude<keyof STATES, symbol>]: (typeof STATES)[Key]}} States
 */

/**
 * @typedef {States[keyof States]} StateCodes
 */

/**
 * @typedef {{ [Key in StateCodes]?: number }} Timings
 */

/**
 * @typedef {{timings?: Timings, timeout?: number | Timeout}} Options
 */

/**
 * Base class for any Executor extends Promise functionality.
 * Executor is a class of objects which can perform some simple action
 * (e.g. AJAX request or function call) and return received data asynchronously.
 * Exposes .resolve(), .reject() methods and .timings, this.timeout properties.
 * @template T
 * @extends ExtendablePromise<T>
 */
class Executor extends ExtendablePromise {
  /**
   * Reference to store performance timings
   * @type {Timings}
   */
  timings;

  /**
   * Reference to the timeout (if specified)
   * @type {Timeout}
   */
  timeout;

  /**
   * Creates new `Executor` instance.
   * @param {ConstructorParameters<typeof ExtendablePromise<T>>[0]} executor
   * @param {Options} [options] - input parameters
   */
  constructor(executor, options = {}) {
    super(executor);
    this[ø.options] = options;

    const { timings = {}, timeout } = options;

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

    this[ø.setTiming](STATES.CREATED);
  }

  // eslint-disable-next-line class-methods-use-this
  get [Symbol.toStringTag]() {
    return Executor.name;
  }

  /**
   * Resolves `Executor`
   * @param {T} value
   * @returns {this}
   */
  resolve(value) {
    const result = super.resolve(value);
    this[ø.finalize](STATES.RESOLVED);
    return result;
  }

  /**
   * Rejects `Executor`
   * @param {Error} reason
   * @returns {this}
   */
  reject(reason) {
    const result = super.reject(reason);
    this[ø.finalize](STATES.REJECTED);
    return result;
  }

  /**
   * Returns promise which will be resolved when data is received.
   * @param {unknown[]} args
   * @returns {this} - a promise
   */
  execute(...args) {
    if (!this.timings[STATES.EXECUTED] && !this.timings[STATES.SETTLED]) {
      super.execute(...args);
      this[ø.setTiming](STATES.EXECUTED);
      if (this.timeout) this.timeout.set();
    }

    return this;
  }

  /**
   * Measures performance metrics
   * @private
   * @param {StateCodes} state - CREATED, RESOLVED etc.
   * @returns {void}
   */
  [ø.setTiming](state) {
    this.timings[state] = Math.round(performance.now()); // milliseconds
  }

  /**
   * @private
   * @param {StateCodes} state - CREATED, RESOLVED etc.
   * @returns {void}
   */
  [ø.finalize](state) {
    if (this.timeout) this.timeout.clear();
    this[ø.setTiming](state);
    this.timings[STATES.SETTLED] = this.timings[state];
  }
}

// Assigning properties like this helps typescript to declare the namespace properly
Executor.STATES = { ...STATES };

// eslint-disable-next-line import/prefer-default-export
export { Executor };
