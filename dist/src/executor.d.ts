export default Executor;
export type Statuses = {
    readonly CREATED: "CREATED";
    readonly EXECUTED: "EXECUTED";
    readonly RESOLVED: "RESOLVED";
    readonly REJECTED: "REJECTED";
    readonly SETTLED: "SETTLED";
};
export type StateCodes = Statuses[keyof Statuses];
export type Timings = {
    CREATED?: number;
    EXECUTED?: number;
    RESOLVED?: number;
    REJECTED?: number;
    SETTLED?: number;
};
export type Options = {
    timings?: Timings;
    timeout?: number | Timeout;
};
/**
 * @typedef {{ readonly [Key in Exclude<keyof STATES, symbol>]: (typeof STATES)[Key]}} Statuses
 */
/**
 * @typedef {Statuses[keyof Statuses]} StateCodes
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
declare class Executor<T> extends ExtendablePromise<T> {
    /**
     * @type {Statuses}
     * @readonly
     */
    static readonly STATES: Statuses;
    /**
     *
     * @param {ConstructorParameters<typeof ExtendablePromise<T>>[0]} executor
     * @param {Options} options - input parameters
     */
    constructor(executor: ConstructorParameters<typeof ExtendablePromise<T>>[0], options?: Options);
    /**
     * Reference to store performance timings
     * @type {Timings}
     */
    timings: Timings;
    /**
     * Reference to the timeout (if specified)
     * @type {Timeout}
     */
    timeout: Timeout;
    /**
     * Resolves `Executor`
     * @param value
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
    /**
     * Measures performance metrics
     * @private
     * @param {StateCodes} state - CREATED, RESOLVED etc.
     * @returns {void}
     * @ignore
     */
    private [UniqueSymbols.UNIQUE_SYMBOL481];
    /**
     * @private
     * @param {StateCodes} state - CREATED, RESOLVED etc.
     * @returns {void}
     * @param {any} state
     * @ignore
     */
    private [UniqueSymbols.UNIQUE_SYMBOL482];
    [UniqueSymbols.UNIQUE_SYMBOL480]: Options;
}
declare const STATES: import("@js-bits/enumerate/types/types").EnumType<"\n  CREATED\n  EXECUTED\n  RESOLVED\n  REJECTED\n  SETTLED\n", StringConstructor, ["CREATED", "EXECUTED", "RESOLVED", "REJECTED", "SETTLED"]>;
import Timeout from "@js-bits/timeout";
import ExtendablePromise from "@js-bits/xpromise";

import * as UniqueSymbols from '@js-bits/enumerate/types/unique-symbols';
