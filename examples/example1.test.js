// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';

jest.spyOn(global.console, 'log');
// eslint-disable-next-line import/first
import example from './example1.js';

describe('Examples', () => {
  afterEach(() => {
    jest.resetModules();
  });

  test('Example 1', async () => {
    expect.assertions(2);
    const value = await example;
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log.mock.calls[0]).toEqual(['result', 123]);
  });
});
