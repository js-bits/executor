// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import example from './example2.js';

describe('Examples', () => {
  /** @type {any} */
  let consoleLog;
  beforeEach(() => {
    consoleLog = jest.spyOn(console, 'log');
  });
  afterEach(() => {
    jest.resetModules();
  });

  test('Example 2', async () => {
    expect.assertions(4);
    await example;
    expect(consoleLog).toHaveBeenCalledTimes(3);
    expect(consoleLog.mock.calls[0]).toEqual([expect.stringMatching('DOMReadyReceiver created in [\\d.]+ s')]);
    expect(consoleLog.mock.calls[1]).toEqual([expect.stringMatching('DOMContentLoaded in [\\d.]+ s')]);
    expect(consoleLog.mock.calls[2]).toEqual([expect.stringMatching('Delay: \\d+ ms')]);
  });
});
