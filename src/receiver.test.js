/* eslint-disable max-classes-per-file */
import { Executor } from './executor.js';
import { Receiver } from './receiver.js';
// const { Executor, Receiver } = require('../dist/index.cjs');

const { STATES } = Receiver;

describe('Receiver', () => {
  test('should create an instance', () => {
    const receiver = new Receiver();
    expect(receiver).toBeInstanceOf(Receiver);
    expect(receiver).toBeInstanceOf(Executor);
    expect(receiver).toBeInstanceOf(Promise);
    expect(String(receiver)).toEqual('[object Receiver]');
  });

  describe('check executed', () => {
    describe('when resolved before gets accessed', () => {
      test('should execute only when resolved', done => {
        expect.assertions(7);
        const receiver = new Receiver();
        setTimeout(() => {
          // @ts-expect-error Expected 1 arguments, but got 3.
          receiver.resolve(123, 'str', true);
          expect(receiver.timings[STATES.EXECUTED]).toBeGreaterThan(
            /** @type {number} */ (receiver.timings[STATES.CREATED])
          );
          receiver
            .then((...args) => {
              expect(args).toEqual([123]);
              expect(receiver.timings[STATES.EXECUTED]).toBeGreaterThan(
                /** @type {number} */ (receiver.timings[STATES.CREATED])
              );
              return 'done';
            })
            .then(result => {
              expect(result).toEqual('done');
              done();
            });
        }, 100);
        expect(receiver.timings[STATES.CREATED]).toBeGreaterThan(10);
        expect(receiver.timings[STATES.CREATED]).toBeLessThan(10000);
        expect(receiver.timings[STATES.EXECUTED]).toBeUndefined();
      });
    });
    describe('when resolved after gets accessed', () => {
      test('should execute only when accessed', done => {
        expect.assertions(5);
        const receiver = new Receiver();
        setTimeout(() => {
          // @ts-expect-error Expected 1 arguments, but got 3.
          receiver.resolve(123, 'str', true);
        }, 100);
        expect(receiver.timings[STATES.CREATED]).toBeGreaterThan(10);
        expect(receiver.timings[STATES.EXECUTED]).toBeUndefined();
        receiver.then((...args) => {
          expect(args).toEqual([123]);
          expect(receiver.timings[STATES.EXECUTED]).toBeGreaterThanOrEqual(
            /** @type {number} */ (receiver.timings[STATES.CREATED])
          );
          done();
        });
        expect(receiver.timings[STATES.EXECUTED]).toBeGreaterThanOrEqual(
          /** @type {number} */ (receiver.timings[STATES.CREATED])
        );
      });
    });
    describe('when rejected before gets accessed', () => {
      test('should execute only when rejected', done => {
        expect.assertions(4);
        const receiver = new Receiver();
        setTimeout(() => {
          const promise = receiver.reject(new Error('async error'));
          expect(receiver.timings[STATES.EXECUTED]).toBeGreaterThan(
            /** @type {number} */ (receiver.timings[STATES.CREATED])
          );
          promise
            .then((...args) => {
              expect(args).toEqual([123]);
            })
            .catch(reason => {
              expect(reason.message).toEqual('async error');
              done();
            });
        }, 100);
        expect(receiver.timings[STATES.CREATED]).toBeGreaterThan(10);
        expect(receiver.timings[STATES.EXECUTED]).toBeUndefined();
      });
    });
    describe('when rejected after gets accessed', () => {
      test('should execute only when accessed', done => {
        expect.assertions(5);
        const receiver = new Receiver();
        setTimeout(() => {
          receiver.reject(new Error('async error'));
        }, 100);
        expect(receiver.timings[STATES.CREATED]).toBeGreaterThan(10);
        expect(receiver.timings[STATES.EXECUTED]).toBeUndefined();
        receiver.catch((...args) => {
          expect(args).toEqual([new Error('async error')]);
          expect(receiver.timings[STATES.EXECUTED]).toBeGreaterThanOrEqual(
            /** @type {number} */ (receiver.timings[STATES.CREATED])
          );
          done();
        });
        expect(receiver.timings[STATES.EXECUTED]).toBeGreaterThanOrEqual(
          /** @type {number} */ (receiver.timings[STATES.CREATED])
        );
      });
    });
  });

  test('should finalize with RESOLVED state when resolved', async () => {
    expect.assertions(5);
    const receiver = new Receiver();
    expect(receiver.timings[STATES.RESOLVED]).toBeUndefined();
    setTimeout(() => {
      /** @type {Receiver<void>} */ (receiver).resolve();
      expect(receiver.timings[STATES.RESOLVED]).toBeGreaterThan(0);
      expect(receiver.timings[STATES.RESOLVED]).toEqual(receiver.timings[STATES.SETTLED]);
      const duration =
        /** @type {number} */ (receiver.timings[STATES.RESOLVED]) -
        /** @type {number} */ (receiver.timings[STATES.EXECUTED]);
      expect(duration).toBeGreaterThanOrEqual(80);
      expect(duration).toBeLessThanOrEqual(200);
    }, 100);
    return receiver;
  });

  describe('#resolve', () => {
    test('should return receiver', () => {
      const receiver = new Receiver();
      expect(receiver.resolve(123)).toBe(receiver);
    });
  });

  describe('#reject', () => {
    test('should return receiver', async () => {
      expect.assertions(2);
      const receiver = new Receiver();
      expect(receiver.reject(new Error('async error'))).toBe(receiver);
      receiver.catch(error => {
        expect(error.message).toEqual('async error');
      });
    });
  });
});
