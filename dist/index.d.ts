declare module "src/executor" {
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
    class Executor<T> extends ExtendablePromise<T> {
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
    const STATES: any;
    import ExtendablePromise from "@js-bits/xpromise";
    import Timeout from "@js-bits/timeout";
}
declare module "src/receiver" {
    export default Receiver;
    /**
     * Does nothing but waits to be resolved or rejected by external code
     * (and also registers internal timings)
     * @template T
     * @extends Executor<T>
     */
    class Receiver<T> extends Executor<T> {
        constructor(...args: any[]);
    }
    import Executor from "src/executor";
}
declare module "index" {
    export { default as Executor } from "./src/executor.js";
    export { default as Receiver } from "./src/receiver.js";
}
