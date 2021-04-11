import Timeout from '@js-bits/timeout';

const STATES = {
  // we can also add CREATED:'created' if necessary
  EXECUTED: 'executed',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

const ERRORS = {
  INITIALIZATION: 'BaseReceiverInitializationError',
};

/**
 * Base class for any Receiver extends Promise functionality.
 * Receiver is a class of objects which can perform some simple action
 * (e.g. AJAX request or function call) and return received data asynchronously.
 * Exposes .resolve(), .reject() methods and .timings, this.timeout properties.
 * @class
 * @param {Object} options - input parameters
 */
const BaseReceiver = function (options) {
  const $this = this;

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
    $this.resolve = function (...args) {
      resolve(...args);

      // "this" here is a ref to derived class instance, where "_this" is a ref to BaseReceiver instance
      this.$finalize(STATES.RESOLVED);
    };
    $this.reject = function (reason, ...args) {
      if (!this.timings[STATES.EXECUTED] && reason.name === Error.prototype.name) {
        reason.name = ERRORS.INITIALIZATION;
      }

      reject(reason, ...args);
      this.$finalize(STATES.REJECTED);
    };
  });

  if (this.$options.timeout instanceof Timeout) {
    // soft timeout will be caught and processed externally
    this.timeout = this.$options.timeout;
  } else {
    // hard timeout (rejects the receiver if exceeded) or no timeout
    this.timeout = new Timeout(this.$options.timeout);
    this.timeout.catch(this.reject.bind(this));
  }

  // We need to catch a situation when promise gets immediately rejected inside constructor
  // to prevent log messages or breakpoints in browser console. The reason of the rejection
  // can be caught (or will throw an error if not caught) later when .get() method is invoked.
  this.$promise.catch(reason => {
    if (!$this.timings[STATES.EXECUTED]) {
      // log.debug('Rejected inside constructor', reason);
    }
  });
};

BaseReceiver.prototype = {
  /**
   * Returns promise which will be resolved when data is received.
   * @returns {Promise} - a promise
   */
  get(...args) {
    if (!this.timings[STATES.EXECUTED] && !this.timings[STATES.RESOLVED] && !this.timings[STATES.REJECTED]) {
      this.$execute.apply(this, ...args);
      this.$setTiming(STATES.EXECUTED);
      this.timeout.start();
    }

    return this.$promise;
  },

  /**
   * Derived classes must implement ._execute() method performing corresponding action.
   * @protected
   * @returns {void}
   */
  $execute() {
    this.reject(new Error('._execute() method must be implemented'));
  },

  /**
   * Measures performance metrics
   * @private
   * @param {string} state - 'executed', 'resolved' or 'rejected'
   * @returns {void}
   */
  $setTiming(state) {
    this.timings[state] = Math.round(window.performance.now()); // milliseconds
  },

  /**
   * @private
   * @param {string} state - 'executed', 'resolved' or 'rejected'
   * @returns {void}
   */
  $finalize(state) {
    this.timeout.stop();
    this.$setTiming(state);
  },
};

BaseReceiver.STATES = STATES;
BaseReceiver.ERRORS = ERRORS;

export default BaseReceiver;
