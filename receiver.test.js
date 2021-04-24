/* eslint-disable max-classes-per-file */
// import { performance } from 'perf_hooks';
import { cyan } from '@js-bits/log-in-color';
import Receiver from './receiver.js';

const env = cyan(`[${typeof window === 'undefined' ? 'node' : 'jsdom'}]`);

describe(`Receiver: ${env}`, () => {
  test('should implement execute and wait methods', async () => {
    expect.assertions(1);
    const receiver = new Receiver();
    setTimeout(() => {
      receiver.resolve(123, 'str', true);
    }, 100);
    return receiver.wait().then((...args) => {
      expect(args).toEqual([123]);
    });
  });
});
