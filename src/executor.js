import enumerate from '@js-bits/enumerate';
import ExtendablePromise from '@js-bits/xpromise';
import Timeout from '@js-bits/timeout';
import performance from '@js-bits/performance';

const { Prefix } = enumerate;

// pseudo-private properties emulation in order to avoid source code transpiling
// TODO: replace with #privateField syntax when it gains wide support
const ø = enumerate.ts(`
  options
  setTiming
  finalize
`);

const STATES = enumerate.ts(`
  CREATED
  EXECUTED
  RESOLVED
  REJECTED
  SETTLED
`);

/**
 * @typedef {{ readonly [Key in Exclude<keyof STATES, symbol>]: (typeof STATES)[Key]}} Statuses
 */

/**
 * @typedef {Statuses[keyof Statuses]} StateCodes
 */

/**
 * @typedef {{ [Key in StateCodes]?: number }} Timings
 */

const ERRORS = enumerate.ts(
  `
  InitializationError
`,
  Prefix('Executor|')
);

/**
 * Base class for any Executor extends Promise functionality.
 * Executor is a class of objects which can perform some simple action
 * (e.g. AJAX request or function call) and return received data asynchronously.
 * Exposes .resolve(), .reject() methods and .timings, this.timeout properties.
 * @template T
 * @extends ExtendablePromise<T>
 */
class Executor extends ExtendablePromise {
  // /**
  //  * @type {'Executor|InitializationError'}
  //  * @readonly
  //  */
  // static InstantiationError = ERRORS.InitializationError;

  /**
   * @readonly
   * @type {Statuses}
   */
  static STATES = STATES;

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
   *
   * @param {ConstructorParameters<typeof ExtendablePromise<T>>[0]} executor
   * @param {{timings?: Timings, timeout?: number | Timeout}} options - input parameters
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
    return 'Executor';
  }

  /**
   * Resolves `Executor`
   * @param value
   * @returns {this}
   */
  resolve(/** @type {T} */ value) {
    const result = super.resolve(value);
    this[ø.finalize](STATES.RESOLVED);
    return result;
  }

  /**
   * Rejects `Executor`
   * @param reason
   * @returns {this}
   */
  reject(/** @type {Error} */ reason) {
    const result = super.reject(reason);
    this[ø.finalize](STATES.REJECTED);
    return result;
  }

  /**
   * Returns promise which will be resolved when data is received.
   * @returns {this} - a promise
   */
  execute(/** @type {unknown[]} */ ...args) {
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
   * @ignore
   */
  [ø.setTiming](state) {
    // @ts-ignore
    this.timings[state] = Math.round(performance.now()); // milliseconds
  }

  /**
   * @private
   * @param {StateCodes} state - CREATED, RESOLVED etc.
   * @returns {void}
   * @param {any} state
   * @ignore
   */
  [ø.finalize](state) {
    if (this.timeout) this.timeout.clear();
    this[ø.setTiming](state);
    this.timings[STATES.SETTLED] = this.timings[state];
  }
}

Object.assign(Executor, ERRORS);

export default Executor;
