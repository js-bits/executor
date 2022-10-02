// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import example from './example4.js';

describe('Examples', () => {
  beforeEach(() => {
    global.console = { log: jest.fn() };
  });
  afterEach(() => {
    jest.resetModules();
  });

  test('Example 4', async () => {
    expect.assertions(3);
    await example;
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log.mock.calls[0]).toEqual(['Operation has exceeded specified timeout.']);
    expect(console.log.mock.calls[1]).toEqual(['Success!!!']);
  });
});
