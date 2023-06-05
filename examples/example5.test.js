// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import example from './example5.js';

describe('Examples', () => {
  /** @type {any} */
  let consoleLog;
  beforeEach(() => {
    consoleLog = jest.spyOn(console, 'log');
  });
  afterEach(() => {
    jest.resetModules();
  });

  test('Example 5', async () => {
    expect.assertions(3);
    await example;
    expect(consoleLog).toHaveBeenCalledTimes(2);
    expect(consoleLog.mock.calls[0]).toEqual(['Received value: 123']);
    expect(consoleLog.mock.calls[1]).toEqual([expect.stringMatching('It took \\d+ ms to receive the value')]);
  });
});
