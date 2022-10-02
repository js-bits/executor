// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import example from './example2.js';

describe('Examples', () => {
  beforeEach(() => {
    global.console = { log: jest.fn() };
  });
  afterEach(() => {
    jest.resetModules();
  });

  test('Example 2', async () => {
    expect.assertions(4);
    await example;
    expect(console.log).toHaveBeenCalledTimes(3);
    expect(console.log.mock.calls[0]).toEqual([expect.stringMatching('DOMReadyReceiver created in [\\d.]+ s')]);
    expect(console.log.mock.calls[1]).toEqual([expect.stringMatching('DOMContentLoaded in [\\d.]+ s')]);
    expect(console.log.mock.calls[2]).toEqual([expect.stringMatching('Delay: \\d+ ms')]);
  });
});
