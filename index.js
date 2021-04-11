const log = require('logger')(module)
let window = require('browser').window
let Promise = window.Promise || require('promise-polyfill')
let TimeoutPromise = require('TimeoutPromise')
let extend = require('backbone').Model.extend
let utils = require('utils')

let STATES = {
  // we can also add CREATED:'created' if necessary
  EXECUTED: 'executed',
  RESOLVED: 'resolved',
  REJECTED: 'rejected'
}

let ERRORS = {
  INITIALIZATION: 'BaseReceiverInitializationError'
}

/**
 * Base class for any Receiver extends Promise functionality.
 * Receiver is a class of objects which can perform some simple action
 * (e.g. AJAX request or function call) and return received data asynchronously.
 * Exposes .resolve(), .reject() methods and .timings, this.timeout properties.
 * @class
 * @param {Object} options - input parameters
 */
let BaseReceiver = function (options) {
  let _this = this

  /**
   * @private
   */
  this._options = options || {}

  /**
   * Reference to store performance timings
   * @type {Object}
   */
  this.timings = this._options.timings || {}

  // make sure all timings are reset
  for (let name in this.timings) {
    this.timings[name] = undefined
  }

  /**
   * Internal promise
   * @private
   */
  this._promise = new Promise(function (resolve, reject) {
    _this.resolve = function () {
      resolve.apply(null, arguments)

      // "this" here is a ref to derived class instance, where "_this" is a ref to BaseReceiver instance
      this._finalize(STATES.RESOLVED)
    }
    _this.reject = function (reason) {
      if (
        !this.timings[STATES.EXECUTED] &&
        reason.name === Error.prototype.name
      ) {
        reason.name = ERRORS.INITIALIZATION
      }

      reject.apply(null, arguments)
      this._finalize(STATES.REJECTED)
    }
  })

  if (this._options.timeout instanceof TimeoutPromise) {
    // soft timeout will be caught and processed externally
    this.timeout = this._options.timeout
  } else {
    // hard timeout (rejects the receiver if exceeded) or no timeout
    this.timeout = new TimeoutPromise(this._options.timeout)
    this.timeout.catch(this.reject.bind(this))
  }

  // We need to catch a situation when promise gets immediately rejected inside constructor
  // to prevent log messages or breakpoints in browser console. The reason of the rejection
  // can be caught (or will throw an error if not caught) later when .get() method is invoked.
  this._promise.catch(function (reason) {
    if (!_this.timings[STATES.EXECUTED]) {
      log.debug('Rejected inside constructor', reason)
    }
  })
}

BaseReceiver.prototype = {
  /**
   * Returns promise which will be resolved when data is received.
   * @returns {Promise} - a promise
   */
  get: function () {
    if (
      !this.timings[STATES.EXECUTED] &&
      !this.timings[STATES.RESOLVED] &&
      !this.timings[STATES.REJECTED]
    ) {
      this._execute.apply(this, arguments)
      this._setTiming(STATES.EXECUTED)
      this.timeout.start()
    }

    return this._promise
  },

  /**
   * Derived classes must implement ._execute() method performing corresponding action.
   * @protected
   * @returns {void}
   */
  _execute: function () {
    this.reject(new Error('._execute() method must be implemented'))
  },

  /**
   * Measures performance metrics
   * @private
   * @param {string} state - 'executed', 'resolved' or 'rejected'
   * @returns {void}
   */
  _setTiming: function (state) {
    this.timings[state] = utils.getTiming()
  },

  /**
   * @private
   * @param {string} state - 'executed', 'resolved' or 'rejected'
   * @returns {void}
   */
  _finalize: function (state) {
    this.timeout.stop()
    this._setTiming(state)
  }
}

BaseReceiver.extend = extend
BaseReceiver.STATES = STATES
BaseReceiver.ERRORS = ERRORS

module.exports = BaseReceiver
