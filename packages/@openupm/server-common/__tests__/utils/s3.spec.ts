import { normalizeS3ClientConfig } from '../../src/utils/s3.js';

describe('normalizeS3ClientConfig()', function () {
  it('converts legacy top-level credentials to AWS SDK v3 credentials', function () {
    const result = normalizeS3ClientConfig({
      endpoint: 'https://sfo2.digitaloceanspaces.com',
      region: 'sfo2',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      sessionToken: 'session',
      s3ForcePathStyle: true,
      sslEnabled: false,
    });

    expect(result).toEqual({
      endpoint: 'https://sfo2.digitaloceanspaces.com',
      region: 'sfo2',
      credentials: {
        accessKeyId: 'key',
        secretAccessKey: 'secret',
        sessionToken: 'session',
      },
      forcePathStyle: true,
      tls: false,
    });
  });

  it('clones nested credentials from immutable config objects', function () {
    const credentials = Object.freeze({
      accessKeyId: 'key',
      secretAccessKey: 'secret',
    });
    const rawConfig = Object.freeze({
      endpoint: 'https://sfo2.digitaloceanspaces.com',
      region: 'sfo2',
      credentials,
    });

    const result = normalizeS3ClientConfig(rawConfig);

    expect(result.credentials).toEqual(credentials);
    expect(result.credentials).not.toBe(credentials);
  });
});
