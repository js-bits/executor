// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import example from './example3.js';

describe('Examples', () => {
  beforeEach(() => {
    global.console = { log: jest.fn() };
  });
  afterEach(() => {
    jest.resetModules();
  });

  test('Example 3', async () => {
    expect.assertions(2);
    await example;
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log.mock.calls[0]).toEqual([expect.stringMatching('Timed out in \\d+ ms')]);
  });
});
