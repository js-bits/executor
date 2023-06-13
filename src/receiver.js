import { Executor } from './executor.js';

/**
 * Does nothing but waits to be resolved or rejected by external code
 * (and also registers internal timings)
 * @template T
 * @extends Executor<T>
 */
class Receiver extends Executor {
  // eslint-disable-next-line class-methods-use-this
  get [Symbol.toStringTag]() {
    return Receiver.name;
  }

  /**
   * Creates new `Receiver` instance.
   * @param {ConstructorParameters<typeof Executor<unknown>>[1]} [options]
   */
  constructor(options) {
    super(() => {}, options);
  }

  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @type {Promise<T>['then']}
   */
  then(...args) {
    // execute when the result first gets accessed
    this.execute();
    return super.then(...args);
  }

  /**
   * Resolves `Receiver`
   * @param {T} result
   * @returns {this}
   */
  resolve(result) {
    // execute when the result first gets resolved
    this.execute();
    return super.resolve(result);
  }

  /**
   * Rejects `Receiver`
   * @param {Error} reason
   * @returns {this}
   */
  reject(reason) {
    // execute when the result first gets reject
    this.execute();
    return super.reject(reason);
  }
}

// eslint-disable-next-line import/prefer-default-export
export { Receiver };
