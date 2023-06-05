import Executor from './executor.js';

/**
 * Does nothing but waits to be resolved or rejected by external code
 * (and also registers internal timings)
 * @template T
 * @extends Executor<T>
 */
class Receiver extends Executor {
  constructor(/** @type {ConstructorParameters<typeof Executor<unknown>>[1]} */ options) {
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
   * @param result
   * @returns {this}
   */
  resolve(/** @type {T} */ result) {
    // execute when the result first gets resolved
    this.execute();
    return super.resolve(result);
  }

  /**
   * Rejects `Receiver`
   * @param reason
   * @returns {this}
   */
  reject(/** @type {Error} */ reason) {
    // execute when the result first gets reject
    this.execute();
    return super.reject(reason);
  }
}

export default Receiver;
