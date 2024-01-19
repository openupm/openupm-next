import redis from '../src/redis.js';

describe('hash', function () {
  afterAll(async () => {
    await redis.close();
  });

  it('hashset', async () => {
    // hset
    await redis.client!.hset('example-key', 'field-a', '1');
    // hget
    const val = await redis.client!.hget('example-key', 'field-a');
    expect(val).toEqual('1');
    // hkeys
    const keys = await redis.client!.hkeys('example-key');
    expect(keys).toEqual(['field-a']);
    // hgetall
    const results = await redis.client!.hgetall('example-key');
    expect(results).toEqual({ 'field-a': '1' });
    // hdel
    await redis.client!.hdel('example-key', 'field-a');
    // hget null
    const nullVal = await redis.client!.hget('example-key', 'field-a');
    expect(nullVal).toBeNull();
  });
});
