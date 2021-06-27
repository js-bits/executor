/* eslint-disable max-classes-per-file */
import { jest } from '@jest/globals';
import { cyan } from '@js-bits/log-in-color';
import Timeout from '@js-bits/timeout';
import Executor from './executor.js';

const env = cyan(`[${typeof window === 'undefined' ? 'node' : 'jsdom'}]`);

const {
  STATES: { CREATED, EXECUTED, RESOLVED, REJECTED, SETTLED },
} = Executor;

describe(`Executor: ${env}`, () => {
  let executorFunc;
  let executor;
  let TestExecutor;
  beforeEach(() => {
    executorFunc = jest.fn();
    class ExtExecutor extends Executor {
      constructor(...arg) {
        super(executorFunc, ...arg);
      }
    }
    TestExecutor = ExtExecutor;
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
          [EXECUTED]: 1,
          [RESOLVED]: 2,
          [REJECTED]: 3,
          [SETTLED]: 4,
        };
        executor = new TestExecutor({
          timings,
        });
        expect(executor.timings[EXECUTED]).toBeUndefined();
        expect(executor.timings[RESOLVED]).toBeUndefined();
        expect(executor.timings[REJECTED]).toBeUndefined();
        expect(executor.timings[SETTLED]).toBeUndefined();
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
      expect(executor.timings[CREATED]).toBeGreaterThan(0);
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
      expect(executor.timings[EXECUTED]).toBeUndefined();
      executor.execute();
      expect(executor.timings[EXECUTED]).toBeDefined();
      expect(executor.timings[EXECUTED]).toBeGreaterThanOrEqual(executor.timings[CREATED]);
    });

    describe('when a timeout is specified', () => {
      test('should set the timeout', () => {
        executor = new TestExecutor({
          timeout: 100,
        });
        executor.timeout.set = jest.fn();
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
              expect(reason.name).toEqual('TimeoutExceededError');
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
              expect(reason.name).toEqual('TimeoutExceededError');
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
      executor.resolve(123, 'str', true);
      return executor.execute().then((...args) => {
        expect(args).toEqual([123]);
      });
    });

    describe("when haven't been executed", () => {
      test('should finalize with RESOLVED state', async () => {
        expect.assertions(4);
        expect(executor.timings[RESOLVED]).toBeUndefined();
        executor.resolve();
        const promise = executor.execute();
        expect(executor.timings[RESOLVED]).toBeGreaterThan(0);
        expect(executor.timings[RESOLVED]).toEqual(executor.timings[SETTLED]);
        expect(executor.timings[EXECUTED]).toBeUndefined();
        return promise.catch(() => {});
      });
    });

    describe('when have been executed', () => {
      test('should finalize with RESOLVED state', async () => {
        expect.assertions(5);
        expect(executor.timings[RESOLVED]).toBeUndefined();
        const promise = executor.execute();
        setTimeout(() => {
          executor.resolve();
          expect(executor.timings[RESOLVED]).toBeGreaterThan(0);
          expect(executor.timings[RESOLVED]).toEqual(executor.timings[SETTLED]);
          const duration = executor.timings[RESOLVED] - executor.timings[EXECUTED];
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
        executor.timeout.clear = jest.fn();
        executor.resolve();
        expect(executor.timeout.clear).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('#reject', () => {
    describe("when haven't been executed", () => {
      test('should reject the promise with ExecutorInitializationError', async () => {
        expect.assertions(2);
        executor.reject(new Error('Some error'));
        return executor.execute().catch(error => {
          expect(error.name).toEqual(Executor.ExecutorInitializationError);
          expect(error.message).toEqual('Some error');
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
        expect(executor.timings[REJECTED]).toBeUndefined();
        const promise = executor.execute();
        setTimeout(() => {
          executor.reject(new Error());
          expect(executor.timings[REJECTED]).toBeGreaterThan(0);
          expect(executor.timings[REJECTED]).toEqual(executor.timings[SETTLED]);
          const duration = executor.timings[REJECTED] - executor.timings[EXECUTED];
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
      test('should clear the timeout', () => {
        executor = new TestExecutor({
          timeout: 100,
        });
        executor.timeout.clear = jest.fn();
        executor.reject(new Error());
        expect(executor.timeout.clear).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('resolve/reject binding', () => {
    test('resolve', async () => {
      expect.assertions(3);
      const resolveFunc = jest.fn();
      class ResolvedPromise extends Executor {
        constructor(...args) {
          super((resolve, reject) => {
            resolve(true);
          }, ...args);
          this.execute();
        }

        resolve(...args) {
          resolveFunc(...args);
          super.resolve(...args);
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
      class RejectedPromise extends Executor {
        constructor(...args) {
          super((resolve, reject) => {
            reject(new Error('Rejected Promise'));
          }, ...args);
          this.execute();
        }

        reject(...args) {
          rejectFunc(...args);
          super.reject(...args);
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
