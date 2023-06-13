/* eslint-disable import/no-extraneous-dependencies, max-classes-per-file */
import { jest } from '@jest/globals';
import Timeout from '@js-bits/timeout';
import { Executor } from './executor.js';
// const Timeout = require('@js-bits/timeout');
// const { Executor } = require('../dist/index.cjs');

const { STATES } = Executor;

describe('Executor', () => {
  /** @type {ConstructorParameters<typeof Executor<unknown>>[0]} */
  let executorFunc;
  /** @type {Executor<unknown | void>} */
  let executor;

  const createClass = () => {
    /** @extends {Executor<unknown | void>} */
    class ExtExecutor extends Executor {
      constructor(/** @type {ConstructorParameters<typeof Executor<unknown>>[1]} */ options) {
        super(executorFunc, options);
      }
    }
    return ExtExecutor;
  };

  let TestExecutor = createClass();

  beforeEach(() => {
    executorFunc = jest.fn();

    TestExecutor = createClass();
    executor = new TestExecutor();
  });

  describe('#constructor', () => {
    test('should create an instance of TestExecutor', () => {
      expect(executor).toBeInstanceOf(TestExecutor);
      expect(executor).toBeInstanceOf(Executor);
      expect(executor).toBeInstanceOf(Promise);
      expect(String(executor)).toEqual('[object Executor]');
    });
    describe('when an external timings object is passed', () => {
      test('should use the passed object', () => {
        const timings = {};
        executor = new TestExecutor({
          timings,
        });
        expect(executor.timings).toBe(timings);
      });

      test('should reset state properties of the passed object', () => {
        const timings = {
          [STATES.EXECUTED]: 1,
          [STATES.RESOLVED]: 2,
          [STATES.REJECTED]: 3,
          [STATES.SETTLED]: 4,
        };
        executor = new TestExecutor({
          timings,
        });
        expect(executor.timings[STATES.EXECUTED]).toBeUndefined();
        expect(executor.timings[STATES.RESOLVED]).toBeUndefined();
        expect(executor.timings[STATES.REJECTED]).toBeUndefined();
        expect(executor.timings[STATES.SETTLED]).toBeUndefined();
      });
    });

    describe('when an external timeout is passed', () => {
      describe('when an external timeout is an object', () => {
        test('should use the passed timeout object', () => {
          const timeout = new Timeout(1000);
          executor = new TestExecutor({
            timeout,
          });
          expect(executor.timeout).toBe(timeout);
        });
      });

      describe('when an external timeout is a number', () => {
        test('should create a timeout', () => {
          executor = new TestExecutor({
            timeout: 100,
          });
          expect(executor.timeout).toBeInstanceOf(Timeout);
        });
      });
    });

    test('should set CREATED timing', () => {
      expect(executor.timings[STATES.CREATED]).toBeGreaterThan(0);
    });

    describe('when extended', () => {
      describe('when rejected in a constructor', () => {
        test('should throw an async error', async () => {
          expect.assertions(3);
          /** @extends {Executor<string>} */
          class MyPromise extends Executor {
            constructor() {
              super((resolve, reject) => {
                reject(new Error('async error'));
              });
              this.execute();
            }
          }
          let promise;
          let result = 'unchanged';
          try {
            promise = new MyPromise();
            result = await promise;
          } catch (error) {
            expect(error.message).toEqual('async error');
          }
          expect(promise).toEqual(expect.any(Executor));
          expect(result).toEqual('unchanged');
        });
      });
      describe('when resolved in a constructor', () => {
        test('should return resolved value', async () => {
          expect.assertions(2);
          /** @extends {Executor<string>} */
          class MyPromise extends Executor {
            constructor() {
              super(resolve => {
                resolve('async value');
              });
              this.execute();
            }
          }
          const promise = new MyPromise();
          const result = await promise;
          expect(promise).toEqual(expect.any(Executor));
          expect(result).toEqual('async value');
        });
      });
    });
  });

  describe('#execute', () => {
    test('should return a promise', () => {
      expect(executor.execute()).toBeInstanceOf(Promise);
    });

    test('should call executor function only once', () => {
      executor.execute(1, 'str', true);
      executor.execute(1234);
      executor.execute();
      expect(executorFunc).toHaveBeenCalledTimes(1);
      expect(executorFunc).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), 1, 'str', true);
    });

    test('should set EXECUTED timing', () => {
      expect(executor.timings[STATES.EXECUTED]).toBeUndefined();
      executor.execute();
      expect(executor.timings[STATES.EXECUTED]).toBeDefined();
      expect(executor.timings[STATES.EXECUTED]).toBeGreaterThanOrEqual(
        /** @type {number} */ (executor.timings[STATES.CREATED])
      );
    });

    describe('when a timeout is specified', () => {
      test('should set the timeout', () => {
        executor = new TestExecutor({
          timeout: 100,
        });
        jest.spyOn(executor.timeout, 'set');
        executor.execute();
        executor.execute();
        executor.execute();
        expect(executor.timeout.set).toHaveBeenCalledTimes(1);
      });

      describe('when timeout has exceeded', () => {
        describe('when hard timeout', () => {
          test('should reject the promise with TimeoutExceededError error', async () => {
            expect.assertions(2);
            executor = new TestExecutor({
              timeout: 100,
            });
            return executor.execute().catch(reason => {
              expect(reason.name).toEqual(Timeout.TimeoutExceededError);
              expect(reason.message).toEqual('Operation timeout exceeded');
            });
          });
        });

        describe('when soft timeout', () => {
          test('should reject the timeout promise with TimeoutExceededError error', async () => {
            expect.assertions(3);
            const timeout = new Timeout(100);
            executor = new TestExecutor({
              timeout,
            });

            setTimeout(() => {
              executor.resolve('success');
            }, 1000);

            timeout.catch(reason => {
              expect(reason.name).toEqual('Timeout|TimeoutExceededError');
              expect(reason.message).toEqual('Operation timeout exceeded');
            });

            return executor.execute().then(result => {
              expect(result).toEqual('success');
            });
          });
        });
      });
    });
  });

  describe('#resolve', () => {
    test('should resolve the promise with the first passed argument', async () => {
      expect.assertions(1);
      // @ts-expect-error Expected 1 arguments, but got 3.
      executor.resolve(123, 'str', true);
      return executor.execute().then((...args) => {
        expect(args).toEqual([123]);
      });
    });

    test('should return an executor', () => {
      expect(executor.resolve(123)).toBe(executor);
    });

    describe("when haven't been executed", () => {
      test('should finalize with RESOLVED state', async () => {
        expect.assertions(4);
        expect(executor.timings[STATES.RESOLVED]).toBeUndefined();
        /** @type {Executor<void>} */ (executor).resolve();
        const promise = executor.execute();
        expect(executor.timings[STATES.RESOLVED]).toBeGreaterThan(0);
        expect(executor.timings[STATES.RESOLVED]).toEqual(executor.timings[STATES.SETTLED]);
        expect(executor.timings[STATES.EXECUTED]).toBeUndefined();
        return promise.catch(() => {});
      });
    });

    describe('when have been executed', () => {
      test('should finalize with RESOLVED state', async () => {
        expect.assertions(5);
        expect(executor.timings[STATES.RESOLVED]).toBeUndefined();
        const promise = executor.execute();
        setTimeout(() => {
          /** @type {Executor<void>} */ (executor).resolve();
          expect(executor.timings[STATES.RESOLVED]).toBeGreaterThan(0);
          expect(executor.timings[STATES.RESOLVED]).toEqual(executor.timings[STATES.SETTLED]);
          const duration =
            /** @type {number} */ (executor.timings[STATES.RESOLVED]) -
            /** @type {number} */ (executor.timings[STATES.EXECUTED]);
          expect(duration).toBeGreaterThanOrEqual(80);
          expect(duration).toBeLessThanOrEqual(200);
        }, 100);
        return promise.catch(() => {});
      });
    });

    describe('when a timeout is specified', () => {
      test('should clear the timeout', () => {
        executor = new TestExecutor({
          timeout: 100,
        });
        jest.spyOn(executor.timeout, 'clear');
        /** @type {Executor<void>} */ (executor).resolve();
        expect(executor.timeout.clear).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('#reject', () => {
    describe("when haven't been executed", () => {
      test('should reject the promise', async () => {
        expect.assertions(3);
        executor.reject(new Error('Some error'));
        return executor.execute().catch(error => {
          expect(error.name).toEqual('Error');
          expect(error.message).toEqual('Some error');
          expect(executor.timings[STATES.EXECUTED]).toBeUndefined();
        });
      });

      test('should return an executor', async () => {
        expect.assertions(2);
        expect(executor.reject(new Error('async error'))).toBe(executor);
        executor.catch(error => {
          expect(error.message).toEqual('async error');
        });
      });

      describe('when a custom error is passed', () => {
        test('should reject the promise with the original error', async () => {
          expect.assertions(2);
          const error = new Error('Some error');
          error.name = 'CustomError';
          executor.reject(error);
          return executor.execute().catch(reason => {
            expect(reason.name).toEqual('CustomError');
            expect(reason.message).toEqual('Some error');
          });
        });
      });

      test('should finalize with REJECTED state', async () => {
        expect.assertions(5);
        expect(executor.timings[STATES.REJECTED]).toBeUndefined();
        const promise = executor.execute();
        setTimeout(() => {
          executor.reject(new Error('Rejected error'));
          expect(executor.timings[STATES.REJECTED]).toBeGreaterThan(0);
          expect(executor.timings[STATES.REJECTED]).toEqual(executor.timings[STATES.SETTLED]);
          const duration =
            /** @type {number} */ (executor.timings[STATES.REJECTED]) -
            /** @type {number} */ (executor.timings[STATES.EXECUTED]);
          expect(duration).toBeGreaterThanOrEqual(80);
          expect(duration).toBeLessThanOrEqual(200);
        }, 100);
        return promise.catch(() => {});
      });
    });

    describe('when haven been executed', () => {
      test('should reject the promise with passed error', async () => {
        expect.assertions(2);
        const promise = executor.execute();
        executor.reject(new Error('Some error'));
        return promise.catch(error => {
          expect(error.name).toEqual('Error');
          expect(error.message).toEqual('Some error');
        });
      });
    });

    describe('when a timeout is specified', () => {
      test('should clear the timeout', async () => {
        expect.assertions(1);
        executor = new TestExecutor({
          timeout: 100,
        });
        jest.spyOn(executor.timeout, 'clear');
        executor.reject(new Error('Rejected with timeout'));
        expect(executor.timeout.clear).toHaveBeenCalledTimes(1);
        return executor.catch(() => {});
      });
    });
  });

  describe('resolve/reject binding', () => {
    test('resolve', async () => {
      expect.assertions(3);
      const resolveFunc = jest.fn();
      /** @extends {Executor<boolean>} */
      class ResolvedPromise extends Executor {
        constructor() {
          super(resolve => {
            resolve(true);
          });
          this.execute();
        }

        resolve(/** @type {boolean} */ result) {
          resolveFunc(result);
          return super.resolve(result);
        }
      }
      const resolvedPromise = new ResolvedPromise();
      return resolvedPromise.then(result => {
        expect(result).toEqual(true);
        expect(resolveFunc).toHaveBeenCalledWith(true);
        expect(resolveFunc).toHaveBeenCalledTimes(1);
      });
    });

    test('reject', async () => {
      expect.assertions(2);
      const rejectFunc = jest.fn();
      /** @extends {Executor<unknown>} */
      class RejectedPromise extends Executor {
        constructor() {
          super((resolve, reject) => {
            reject(new Error('Rejected Promise'));
          });
          this.execute();
        }

        reject(/** @type {Error} */ reason) {
          rejectFunc(reason);
          return super.reject(reason);
        }
      }
      const rejectedPromise = new RejectedPromise();
      return rejectedPromise.catch(reason => {
        expect(reason.message).toEqual('Rejected Promise');
        expect(rejectFunc).toHaveBeenCalledTimes(1);
      });
    });
  });
});
