import { hello } from '../src/index.js';

describe('Dummy test', () => {
  // Act before assertions
  beforeAll(async () => {});

  // Teardown (cleanup) after assertions
  afterAll(() => {});

  // Assert greeter result
  it('Hello world', () => {
    expect(hello()).toEqual('hello world');
  });
});
