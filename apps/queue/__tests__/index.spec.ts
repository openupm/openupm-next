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

  it('parses schedule command', () => {
    const parsed = parseArgs([
      'node',
      'index.js',
      'schedule',
      'add-build-package-job',
    ]);
    expect(parsed).toEqual({
      command: 'schedule',
      jobName: 'add-build-package-job',
    });
  });

  it('parses queue-cli command', () => {
    const parsed = parseArgs(['node', 'index.js', 'queue-cli', 'queue-status']);
    expect(parsed).toEqual({ command: 'queue-cli' });
  });

  it('parses health command', () => {
    const parsed = parseArgs(['node', 'index.js', 'health', 'pkg']);
    expect(parsed).toEqual({ command: 'health', queueNames: ['pkg'] });
  });

  it('parses help command', () => {
    const parsed = parseArgs(['node', 'index.js', '--help']);
    expect(parsed).toEqual({ command: 'help' });
  });
});
