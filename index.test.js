/* eslint-disable max-classes-per-file */
// import { performance } from 'perf_hooks';
import { jest } from '@jest/globals';
import { cyan } from '@js-bits/log-in-color';
import Executor from './index.js';

const env = cyan(`[${typeof window === 'undefined' ? 'node' : 'jsdom'}]`);

describe(`Executor: ${env}`, () => {
  describe('#get', () => {
    let executor;
    beforeEach(() => {
      class TestExecutor extends Executor {
        constructor() {
          super();
          this.$execute = jest.fn();
        }
      }
      executor = new TestExecutor();
    });

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
  });

  describe('#resolve', () => {
    let executor;
    beforeEach(() => {
      class TestExecutor extends Executor {
        constructor() {
          super();
          this.$execute = jest.fn();
        }
      }
      executor = new TestExecutor();
    });

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
  });

  describe('#reject', () => {
    let executor;
    beforeEach(() => {
      class TestExecutor extends Executor {
        constructor() {
          super();
          this.$execute = jest.fn();
        }
      }
      executor = new TestExecutor();
    });

    describe("when haven't been executed", () => {
      test('should reject the promise with BaseReceiverInitializationError', async () => {
        expect.assertions(2);
        executor.reject(new Error('Some error'));
        return executor.get().catch(error => {
          expect(error.name).toEqual('BaseReceiverInitializationError');
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
  });

  describe('#$execute', () => {
    test('should reject the promise when $execute is not implemented in a derived class', async () => {
      expect.assertions(2);
      class TestExecutor extends Executor {}
      const executor = new TestExecutor();

      executor.$execute();
      return executor.get().catch(error => {
        expect(error.name).toEqual('BaseReceiverInitializationError');
        expect(error.message).toEqual('.$execute() method must be implemented');
      });
    });
  });
});
