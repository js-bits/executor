export default Executor;
export type States = Exclude<(typeof STATES)[keyof typeof STATES], boolean>;
export type Timings = {
    [x: string]: number;
    [x: number]: number;
    [x: symbol]: number;
};
/**
 * Base class for any Executor extends Promise functionality.
 * Executor is a class of objects which can perform some simple action
 * (e.g. AJAX request or function call) and return received data asynchronously.
 * Exposes .resolve(), .reject() methods and .timings, this.timeout properties.
 * @template T
 * @extends ExtendablePromise<T>
 */
declare class Executor<T> extends ExtendablePromise<T> {
    /**
     * @readonly
     */
    static readonly STATES: any;
    /**
     *
     * @param {ConstructorParameters<typeof ExtendablePromise<T>>[0]} executor
     * @param {{timings?: Timings, timeout?: number | Timeout}} options - input parameters
     */
    constructor(executor: ConstructorParameters<typeof ExtendablePromise<T>>[0], options?: {
        timings?: Timings;
        timeout?: number | Timeout;
    });
    /**
     * Reference to store performance timings
     * @type {Timings}
     */
    timings: Timings;
    timeout: Timeout;
    /**
     * Resolves `Executor`
     * @param result
     * @returns {this}
     */
    resolve(value: T): this;
    /**
     * Rejects `Executor`
     * @param reason
     * @returns {this}
     */
    reject(reason: Error): this;
    /**
     * Returns promise which will be resolved when data is received.
     * @returns {this} - a promise
     */
    execute(...args: unknown[]): this;
}
declare const STATES: any;
import ExtendablePromise from "@js-bits/xpromise";
import Timeout from "@js-bits/timeout";
