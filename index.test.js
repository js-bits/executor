/* eslint-disable max-classes-per-file */
// import { performance } from 'perf_hooks';
import { jest } from '@jest/globals';
import { cyan } from '@js-bits/log-in-color';
import Timeout from '@js-bits/timeout';
import Executor from './index.js';

const env = cyan(`[${typeof window === 'undefined' ? 'node' : 'jsdom'}]`);

const {
  STATES: { CREATED, EXECUTED, RESOLVED, REJECTED, SETTLED },
} = Executor;

describe(`Executor: ${env}`, () => {
  let executor;
  let TestExecutor;
  beforeEach(() => {
    class ExtExecutor extends Executor {
      constructor(...arg) {
        super(...arg);
        this.execute = jest.fn();
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

  describe('#do', () => {
    test('should return a promise', () => {
      expect(executor.do()).toBeInstanceOf(Promise);
    });

    test('should call execute method once', () => {
      executor.do(1, 'str', true);
      executor.do(1234);
      executor.do();
      expect(executor.execute).toHaveBeenCalledTimes(1);
      expect(executor.execute).toHaveBeenCalledWith(1, 'str', true);
    });

    test('should set EXECUTED timing', () => {
      expect(executor.timings[EXECUTED]).toBeUndefined();
      executor.do();
      expect(executor.timings[EXECUTED]).toBeDefined();
    });

    describe('when a timeout is specified', () => {
      test('should set the timeout', () => {
        executor = new TestExecutor({
          timeout: 100,
        });
        executor.timeout.set = jest.fn();
        executor.do();
        executor.do();
        executor.do();
        expect(executor.timeout.set).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('#resolve', () => {
    test('should resolve the promise with the first passed argument', async () => {
      expect.assertions(1);
      executor.resolve(123, 'str', true);
      return executor.do().then((...args) => {
        expect(args).toEqual([123]);
      });
    });

    describe("when haven't been executed", () => {
      test('should finalize with RESOLVED state', async () => {
        expect.assertions(4);
        expect(executor.timings[RESOLVED]).toBeUndefined();
        executor.resolve();
        const promise = executor.do();
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
        const promise = executor.do();
        setTimeout(() => {
          executor.resolve();
          expect(executor.timings[RESOLVED]).toBeGreaterThan(0);
          expect(executor.timings[RESOLVED]).toEqual(executor.timings[SETTLED]);
          const duration = executor.timings[RESOLVED] - executor.timings[EXECUTED];
          expect(duration).toBeGreaterThanOrEqual(80);
          expect(duration).toBeLessThanOrEqual(150);
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
        return executor.do().catch(error => {
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
          return executor.do().catch(reason => {
            expect(reason.name).toEqual('CustomError');
            expect(reason.message).toEqual('Some error');
          });
        });
      });

      test('should finalize with REJECTED state', async () => {
        expect.assertions(5);
        expect(executor.timings[REJECTED]).toBeUndefined();
        const promise = executor.do();
        setTimeout(() => {
          executor.reject(new Error());
          expect(executor.timings[REJECTED]).toBeGreaterThan(0);
          expect(executor.timings[REJECTED]).toEqual(executor.timings[SETTLED]);
          const duration = executor.timings[REJECTED] - executor.timings[EXECUTED];
          expect(duration).toBeGreaterThanOrEqual(80);
          expect(duration).toBeLessThanOrEqual(150);
        }, 100);
        return promise.catch(() => {});
      });
    });

    describe('when haven been executed', () => {
      test('should reject the promise with passed error', async () => {
        expect.assertions(2);
        const promise = executor.do();
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

  describe('#execute', () => {
    test('should reject the promise when execute is not implemented in a derived class', async () => {
      expect.assertions(2);
      class ExtExecutor extends Executor {}
      const ex = new ExtExecutor();

      ex.execute();
      return ex.do().catch(error => {
        expect(error.name).toEqual(Executor.ExecutorInitializationError);
        expect(error.message).toEqual('.execute() method must be implemented');
      });
    });
  });
});
