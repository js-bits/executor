/* eslint-disable max-classes-per-file */
import { cyan } from '@js-bits/log-in-color';
import Executor from './executor.js';
import Receiver from './receiver.js';

const env = cyan(`[${typeof window === 'undefined' ? 'node' : 'jsdom'}]`);

const {
  STATES: { CREATED, EXECUTED, RESOLVED, SETTLED },
} = Receiver;

describe(`Receiver: ${env}`, () => {
  test('should create an instance', () => {
    const receiver = new Receiver();
    expect(receiver).toBeInstanceOf(Receiver);
    expect(receiver).toBeInstanceOf(Executor);
    expect(receiver).toBeInstanceOf(Promise);
  });

  test('should execute immediately after it gets created', async () => {
    expect.assertions(3);
    const receiver = new Receiver();
    setTimeout(() => {
      receiver.resolve(123, 'str', true);
    }, 100);
    return receiver
      .then((...args) => {
        expect(args).toEqual([123]);
        expect(receiver.timings[CREATED]).toEqual(receiver.timings[EXECUTED]);
        return 'done';
      })
      .then(result => {
        expect(result).toEqual('done');
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
});
