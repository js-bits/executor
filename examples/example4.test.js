// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import example from './example4.js';

describe('Examples', () => {
  /** @type {any} */
  let consoleLog;
  beforeEach(() => {
    consoleLog = jest.spyOn(console, 'log');
  });
  afterEach(() => {
    jest.resetModules();
  });

  test('Example 4', async () => {
    expect.assertions(3);
    await example;
    expect(consoleLog).toHaveBeenCalledTimes(2);
    expect(consoleLog.mock.calls[0]).toEqual(['Operation has exceeded specified timeout.']);
    expect(consoleLog.mock.calls[1]).toEqual(['Success!!!']);
  });
});
