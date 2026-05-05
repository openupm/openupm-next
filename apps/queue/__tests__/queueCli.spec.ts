import { describe, expect, it } from 'vitest';

import {
  getCommandUsage,
  getUsage,
  parseQueueCliArgs,
} from '../src/queueCli.js';

describe('parseQueueCliArgs', () => {
  it('parses json and limit flags', () => {
    const parsed = parseQueueCliArgs([
      'node',
      'index.js',
      'queue-cli',
      'releases-failed',
      'timeout',
      '--limit',
      '10',
      '--json',
    ]);

    expect(parsed).toEqual({
      command: 'releases-failed',
      rest: ['timeout'],
      output: 'json',
      limit: 10,
    });
  });

  it('keeps the first positional command when limit is omitted', () => {
    const parsed = parseQueueCliArgs([
      'node',
      'index.js',
      'queue-cli',
      'queue-status',
      'rel',
    ]);

    expect(parsed).toEqual({
      command: 'queue-status',
      rest: ['rel'],
      output: 'text',
      limit: 20,
    });
  });

  it('parses top-level help', () => {
    const parsed = parseQueueCliArgs(['node', 'index.js', 'queue-cli', '--help']);
    expect(parsed).toEqual({ command: 'help' });
  });

  it('parses subcommand help', () => {
    const parsed = parseQueueCliArgs([
      'node',
      'index.js',
      'queue-cli',
      'queue-jobs',
      '--help',
    ]);
    expect(parsed).toEqual({ command: 'help', topic: 'queue-jobs' });
  });

  it('documents the full queue-jobs interface', () => {
    const help = getCommandUsage('queue-jobs');
    expect(help).toContain('queue-cli queue-jobs <queue> [state...]');
    expect(help).toContain('Default: failed active waiting.');
    expect(help).toContain('waiting, active, delayed, failed');
  });

  it('documents the full releases-failed interface', () => {
    const help = getCommandUsage('releases-failed');
    expect(help).toContain('queue-cli releases-failed [reason|unknown|timeout]');
    expect(help).toContain('BuildTimeout/ConnectionTimeout/GatewayTimeout');
    expect(help).toContain('VersionConflict');
  });

  it('documents destructive commands in top-level help', () => {
    const help = getUsage();
    expect(help).toContain('remove-job <queue> <jobId>');
    expect(help).toContain('This is destructive');
    expect(help).toContain('release-remove <package> <version>');
  });
});
