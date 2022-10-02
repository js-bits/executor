'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var enumerate = require('@js-bits/enumerate');
var ExtendablePromise = require('@js-bits/xpromise');
var Timeout = require('@js-bits/timeout');
var performance = require('@js-bits/performance');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var enumerate__default = /*#__PURE__*/_interopDefaultLegacy(enumerate);
var ExtendablePromise__default = /*#__PURE__*/_interopDefaultLegacy(ExtendablePromise);
var Timeout__default = /*#__PURE__*/_interopDefaultLegacy(Timeout);
var performance__default = /*#__PURE__*/_interopDefaultLegacy(performance);

const { Prefix } = enumerate__default["default"];

// pseudo-private properties emulation in order to avoid source code transpiling
// TODO: replace with #privateField syntax when it gains wide support
const ø = enumerate__default["default"]`
  options
  setTiming
  finalize
`;

const STATES = enumerate__default["default"]`
  CREATED
  EXECUTED
  RESOLVED
  REJECTED
  SETTLED
`;

const { CREATED, EXECUTED, RESOLVED, REJECTED, SETTLED } = STATES;

const ERRORS = enumerate__default["default"](Prefix('Executor|'))`
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
class Executor extends ExtendablePromise__default["default"] {
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

    if (timeout instanceof Timeout__default["default"]) {
      // soft timeout will be caught and processed externally
      this.timeout = timeout;
    } else if (timeout !== undefined) {
      // hard timeout (rejects the receiver if exceeded) or no timeout
      this.timeout = new Timeout__default["default"](timeout);
      this.timeout.catch(this.reject.bind(this));
    }

    this[ø.setTiming](CREATED);

    // We need to catch a situation when promise gets immediately rejected inside constructor
    // to prevent log messages or breakpoints in browser console. The reason of the rejection
    // can be caught (or will throw an error if not caught) later when .execute() method is invoked.
    this.catch(reason => {
      if (!this.timings[EXECUTED]) ;
    });
  }

  // eslint-disable-next-line class-methods-use-this
  get [Symbol.toStringTag]() {
    return 'Executor';
  }

  resolve(...args) {
    super.resolve(...args);
    this[ø.finalize](RESOLVED);
    // return this; // don't do this
  }

  reject(reason, ...args) {
    if (!this.timings[EXECUTED] && reason && reason instanceof Error && reason.name === Error.prototype.name) {
      reason.name = ERRORS.InitializationError;
    }

    super.reject(reason, ...args);
    this[ø.finalize](REJECTED);
    // returning anything can lead to a subsequent exceptions
    // for cases like promise.catch(executor.reject.bind(executor))
    // return this; // don't do this
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
    this.timings[state] = Math.round(performance__default["default"].now()); // milliseconds
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
}

exports.Executor = Executor;
exports.Receiver = Receiver;
