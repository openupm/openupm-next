import { describe, expect, it } from 'vitest';

import { parseArgs } from '../src/index.js';

describe('parseArgs', () => {
  it('parses process command', () => {
    const parsed = parseArgs(['node', 'index.js', 'process', 'pkg']);
    expect(parsed).toEqual({ command: 'process', queueName: 'pkg' });
  });

  it('parses add-build-package-job command', () => {
    const parsed = parseArgs([
      'node',
      'index.js',
      'add-build-package-job',
      '--all',
      'com.a.b',
    ]);
    expect(parsed).toEqual({
      command: 'add-build-package-job',
      all: true,
      names: ['com.a.b'],
    });
  });
});
