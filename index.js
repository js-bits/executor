import enumerate from '@js-bits/enumerate';
import Timeout from '@js-bits/timeout';
import performance from '@js-bits/performance';

// pseudo-private properties emulation in order to avoid source code transpiling
// TODO: replace with #privateField syntax when it gains wide support
const ø = enumerate`
  finalize
`;

const STATES = {
  // we can also add CREATED:'created' if necessary
  EXECUTED: 'executed',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  // SETTLED // either 'resolved' or 'rejected'
};

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
const Executor = function (options) {
  /**
   * @private
   */
  this.$options = options || {};

  /**
   * Reference to store performance timings
   * @type {Object}
   */
  this.timings = this.$options.timings || {};

  // make sure all timings are reset
  Object.keys(this.timings).forEach(name => {
    this.timings[name] = undefined;
  });

  /**
   * Internal promise
   * @private
   */
  this.$promise = new Promise((resolve, reject) => {
    this.resolve = (...args) => {
      resolve(...args);
      this[ø.finalize](STATES.RESOLVED);
    };
    this.reject = (reason, ...args) => {
      if (!this.timings[STATES.EXECUTED] && reason.name === Error.prototype.name) {
        reason.name = ERRORS.ExecutorInitializationError;
      }

      reject(reason, ...args);
      this[ø.finalize](STATES.REJECTED);
    };
  });

  if (this.$options.timeout instanceof Timeout) {
    // soft timeout will be caught and processed externally
    this.timeout = this.$options.timeout;
  } else if (this.$options.timeout !== undefined) {
    // hard timeout (rejects the receiver if exceeded) or no timeout
    this.timeout = new Timeout(this.$options.timeout);
    this.timeout.catch(this.reject.bind(this));
  }

  // We need to catch a situation when promise gets immediately rejected inside constructor
  // to prevent log messages or breakpoints in browser console. The reason of the rejection
  // can be caught (or will throw an error if not caught) later when .get() method is invoked.
  this.$promise.catch(reason => {
    if (!this.timings[STATES.EXECUTED]) {
      // log.debug('Rejected inside constructor', reason);
    }
  });
};

Executor.prototype = {
  /**
   * Returns promise which will be resolved when data is received.
   * @returns {Promise} - a promise
   */
  get(...args) {
    if (!this.timings[STATES.EXECUTED] && !this.timings[STATES.RESOLVED] && !this.timings[STATES.REJECTED]) {
      this.$execute(...args);
      this.$setTiming(STATES.EXECUTED);
      if (this.timeout) this.timeout.set();
    }

    return this.$promise;
  },

  /**
   * Derived classes must implement .$execute() method performing corresponding action.
   * @protected
   * @returns {void}
   */
  $execute() {
    this.reject(new Error('.$execute() method must be implemented'));
  },

  /**
   * Measures performance metrics
   * @private
   * @param {string} state - 'executed', 'resolved' or 'rejected'
   * @returns {void}
   */
  $setTiming(state) {
    this.timings[state] = Math.round(performance.now()); // milliseconds
  },

  /**
   * @private
   * @param {string} state - 'executed', 'resolved' or 'rejected'
   * @returns {void}
   */
  [ø.finalize](state) {
    if (this.timeout) this.timeout.clear();
    this.$setTiming(state);
  },
};

Executor.STATES = STATES;
Object.assign(Executor, ERRORS);

export default Executor;
