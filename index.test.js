/* eslint-disable max-classes-per-file */
// import { performance } from 'perf_hooks';
import { jest } from '@jest/globals';
import { cyan } from '@js-bits/log-in-color';
import Timeout from '@js-bits/timeout';
import Executor from './index.js';

const env = cyan(`[${typeof window === 'undefined' ? 'node' : 'jsdom'}]`);

describe(`Executor: ${env}`, () => {
  let executor;
  let TestExecutor;
  beforeEach(() => {
    class ExtExecutor extends Executor {
      constructor(...arg) {
        super(...arg);
        this.$execute = jest.fn();
      }
    }
    TestExecutor = ExtExecutor;
    executor = new TestExecutor();
  });

  describe('#constructor', () => {
    describe('when an external timings object is passed', () => {
      test('should use the passed object', () => {
        const timings = {};
        executor = new TestExecutor({
          timings,
        });
        expect(executor.timings).toBe(timings);
      });

      test('should reset all properties of the passed object', () => {
        const timings = {
          prop1: 1,
          prop2: 2,
        };
        executor = new TestExecutor({
          timings,
        });
        expect(executor.timings).toEqual({
          prop1: undefined,
          prop2: undefined,
        });
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
  });

  describe('#get', () => {
    test('should return a promise', () => {
      expect(executor.get()).toBeInstanceOf(Promise);
    });

    test('should call $execute method once', () => {
      executor.get(1, 'str', true);
      executor.get(1234);
      executor.get();
      expect(executor.$execute).toHaveBeenCalledTimes(1);
      expect(executor.$execute).toHaveBeenCalledWith(1, 'str', true);
    });

    test('should set EXECUTED timing', () => {
      expect(executor.timings.executed).toBeUndefined();
      executor.get();
      expect(executor.timings.executed).toBeDefined();
    });

    describe('when a timeout is specified', () => {
      test('should start the timeout', () => {
        executor = new TestExecutor({
          timeout: 100,
        });
        executor.timeout.start = jest.fn();
        executor.get();
        executor.get();
        executor.get();
        expect(executor.timeout.start).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('#resolve', () => {
    test('should resolve the promise with the first passed argument', async () => {
      expect.assertions(1);
      executor.resolve(123, 'str', true);
      return executor.get().then((...args) => {
        expect(args).toEqual([123]);
      });
    });

    describe("when haven't been executed", () => {
      test('should finalize with RESOLVED state', async () => {
        expect.assertions(3);
        expect(executor.timings.resolved).toBeUndefined();
        executor.resolve();
        const promise = executor.get();
        expect(executor.timings.resolved).toBeGreaterThan(0);
        expect(executor.timings.executed).toBeUndefined();
        return promise.catch(() => {});
      });
    });

    describe('when have been executed', () => {
      test('should finalize with RESOLVED state', async () => {
        expect.assertions(4);
        expect(executor.timings.resolved).toBeUndefined();
        const promise = executor.get();
        setTimeout(() => {
          executor.resolve();
          expect(executor.timings.resolved).toBeGreaterThan(0);
          const duration = executor.timings.resolved - executor.timings.executed;
          expect(duration).toBeGreaterThanOrEqual(100);
          expect(duration).toBeLessThanOrEqual(200);
        }, 100);
        return promise.catch(() => {});
      });
    });

    describe('when a timeout is specified', () => {
      test('should stop the timeout', () => {
        executor = new TestExecutor({
          timeout: 100,
        });
        executor.timeout.stop = jest.fn();
        executor.resolve();
        expect(executor.timeout.stop).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('#reject', () => {
    describe("when haven't been executed", () => {
      test('should reject the promise with ExecutorInitializationError', async () => {
        expect.assertions(2);
        executor.reject(new Error('Some error'));
        return executor.get().catch(error => {
          expect(error.name).toEqual('ExecutorInitializationError');
          expect(error.message).toEqual('Some error');
        });
      });

      describe('when a custom error is passed', () => {
        test('should reject the promise with the original error', async () => {
          expect.assertions(2);
          const error = new Error('Some error');
          error.name = 'CustomError';
          executor.reject(error);
          return executor.get().catch(reason => {
            expect(reason.name).toEqual('CustomError');
            expect(reason.message).toEqual('Some error');
          });
        });
      });

      test('should finalize with REJECTED state', async () => {
        expect.assertions(4);
        expect(executor.timings.rejected).toBeUndefined();
        const promise = executor.get();
        setTimeout(() => {
          executor.reject(new Error());
          expect(executor.timings.rejected).toBeGreaterThan(0);
          const duration = executor.timings.rejected - executor.timings.executed;
          expect(duration).toBeGreaterThanOrEqual(100);
          expect(duration).toBeLessThanOrEqual(200);
        }, 100);
        return promise.catch(() => {});
      });
    });

    describe('when haven been executed', () => {
      test('should reject the promise with passed error', async () => {
        expect.assertions(2);
        const promise = executor.get();
        executor.reject(new Error('Some error'));
        return promise.catch(error => {
          expect(error.name).toEqual('Error');
          expect(error.message).toEqual('Some error');
        });
      });
    });

    describe('when a timeout is specified', () => {
      test('should stop the timeout', () => {
        executor = new TestExecutor({
          timeout: 100,
        });
        executor.timeout.stop = jest.fn();
        executor.reject(new Error());
        expect(executor.timeout.stop).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('#$execute', () => {
    test('should reject the promise when $execute is not implemented in a derived class', async () => {
      expect.assertions(2);
      class ExtExecutor extends Executor {}
      const ex = new ExtExecutor();

      ex.$execute();
      return ex.get().catch(error => {
        expect(error.name).toEqual('ExecutorInitializationError');
        expect(error.message).toEqual('.$execute() method must be implemented');
      });
    });
  });
});
