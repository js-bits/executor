/* eslint-disable max-classes-per-file */
import Executor from './executor.js';
import Receiver from './receiver.js';
// const { Executor, Receiver } = require('../dist/index.cjs');

const {
  STATES: { CREATED, EXECUTED, RESOLVED, SETTLED },
} = Receiver;

describe('Receiver', () => {
  test('should create an instance', () => {
    const receiver = new Receiver();
    expect(receiver).toBeInstanceOf(Receiver);
    expect(receiver).toBeInstanceOf(Executor);
    expect(receiver).toBeInstanceOf(Promise);
  });

  describe('check executed', () => {
    describe('when resolved before gets accessed', () => {
      test('should execute only when resolved', done => {
        expect.assertions(7);
        const receiver = new Receiver();
        setTimeout(() => {
          receiver.resolve(123, 'str', true);
          expect(receiver.timings[EXECUTED]).toBeGreaterThan(receiver.timings[CREATED]);
          receiver
            .then((...args) => {
              expect(args).toEqual([123]);
              expect(receiver.timings[EXECUTED]).toBeGreaterThan(receiver.timings[CREATED]);
              return 'done';
            })
            .then(result => {
              expect(result).toEqual('done');
              done();
            });
        }, 100);
        expect(receiver.timings[CREATED]).toBeGreaterThan(10);
        expect(receiver.timings[CREATED]).toBeLessThan(2000);
        expect(receiver.timings[EXECUTED]).toBeUndefined();
      });
    });
    describe('when resolved after gets accessed', () => {
      test('should execute only when accessed', done => {
        expect.assertions(5);
        const receiver = new Receiver();
        setTimeout(() => {
          receiver.resolve(123, 'str', true);
        }, 100);
        expect(receiver.timings[CREATED]).toBeGreaterThan(10);
        expect(receiver.timings[EXECUTED]).toBeUndefined();
        receiver.then((...args) => {
          expect(args).toEqual([123]);
          expect(receiver.timings[EXECUTED]).toBeGreaterThanOrEqual(receiver.timings[CREATED]);
          done();
        });
        expect(receiver.timings[EXECUTED]).toBeGreaterThanOrEqual(receiver.timings[CREATED]);
      });
    });
    describe('when rejected before gets accessed', () => {
      test('should execute only when rejected', done => {
        expect.assertions(4);
        const receiver = new Receiver();
        setTimeout(() => {
          const promise = receiver.reject('async error');
          expect(receiver.timings[EXECUTED]).toBeGreaterThan(receiver.timings[CREATED]);
          promise
            .then((...args) => {
              expect(args).toEqual([123]);
            })
            .catch(reason => {
              expect(reason).toEqual('async error');
              done();
            });
        }, 100);
        expect(receiver.timings[CREATED]).toBeGreaterThan(10);
        expect(receiver.timings[EXECUTED]).toBeUndefined();
      });
    });
    describe('when rejected after gets accessed', () => {
      test('should execute only when accessed', done => {
        expect.assertions(5);
        const receiver = new Receiver();
        setTimeout(() => {
          receiver.reject('async error');
        }, 100);
        expect(receiver.timings[CREATED]).toBeGreaterThan(10);
        expect(receiver.timings[EXECUTED]).toBeUndefined();
        receiver.catch((...args) => {
          expect(args).toEqual(['async error']);
          expect(receiver.timings[EXECUTED]).toBeGreaterThanOrEqual(receiver.timings[CREATED]);
          done();
        });
        expect(receiver.timings[EXECUTED]).toBeGreaterThanOrEqual(receiver.timings[CREATED]);
      });
    });
  });

  test('should finalize with RESOLVED state when resolved', async () => {
    expect.assertions(5);
    const receiver = new Receiver();
    expect(receiver.timings[RESOLVED]).toBeUndefined();
    setTimeout(() => {
      receiver.resolve();
      expect(receiver.timings[RESOLVED]).toBeGreaterThan(0);
      expect(receiver.timings[RESOLVED]).toEqual(receiver.timings[SETTLED]);
      const duration = receiver.timings[RESOLVED] - receiver.timings[EXECUTED];
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
      expect(receiver.reject('async error')).toBe(receiver);
      receiver.catch(error => {
        expect(error).toEqual('async error');
      });
    });
  });
});
