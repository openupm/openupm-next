import configRaw from 'config';
import { Job } from 'bullmq';
import type { JobType } from 'bullmq';
import { ReleaseErrorCode, ReleaseState } from '@openupm/types';
import redis from '@openupm/server-common/build/redis.js';
import {
  fetchAll,
  fetchOne,
  remove as removeReleaseRecord,
  save as saveRelease,
} from '@openupm/server-common/build/models/release.js';

import { addJob, closeQueues, getQueue, hasQueue } from './queues/core.js';
import { createJobId } from './queues/jobId.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;

type OutputMode = 'text' | 'json';

interface QueueCliArgs {
  command: string;
  rest: string[];
  output: OutputMode;
  limit: number;
}

interface QueueCliHelpArgs {
  command: 'help';
  topic?: string;
}

interface QueueJobSummary {
  id: string;
  name: string;
  state: string;
  attemptsMade: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  ageMs: number;
  data: unknown;
  failedReason?: string;
}

interface QueueJobsResult {
  queue: string;
  states: string[];
  total: number;
  limit: number;
  returned: number;
  jobs: QueueJobSummary[];
}

interface ReleaseSummary {
  packageName: string;
  version: string;
  state: string;
  stateCode: number;
  reason: string;
  reasonCode: number;
  buildId: string;
  tag: string;
  commit: string;
  updatedAt: number;
}

const knownJobTypes: JobType[] = [
  'active',
  'waiting',
  'delayed',
  'failed',
  'completed',
  'paused',
];

function parseQueueCliArgs(argv: string[]): QueueCliArgs | QueueCliHelpArgs {
  const args = argv.slice(3);
  if (!args.length || args[0] === '--help' || args[0] === '-h') {
    return { command: 'help' };
  }

  const commandIndex = args.findIndex((arg) => !arg.startsWith('-'));
  const command = commandIndex === -1 ? undefined : args[commandIndex];
  if (args.includes('--help') || args.includes('-h')) {
    return { command: 'help', topic: command };
  }

  const output: OutputMode = args.includes('--json') ? 'json' : 'text';
  const limitIndex = args.indexOf('--limit');
  let limit = 20;
  if (limitIndex !== -1) {
    const value = Number(args[limitIndex + 1]);
    if (!Number.isInteger(value) || value < 1) {
      throw new Error('Usage: queue-cli ... [--limit <positive integer>]');
    }
    limit = value;
  }
  const rest = args.filter((arg, index) => {
    if (arg === '--json') return false;
    if (
      limitIndex !== -1 &&
      (index === limitIndex || index === limitIndex + 1)
    ) {
      return false;
    }
    return true;
  });
  const parsedCommand = rest.shift();
  if (!parsedCommand) throw new Error(getUsage());
  return { command: parsedCommand, rest, output, limit };
}

function getUsage(): string {
  return [
    'OpenUPM queue operator CLI.',
    '',
    'Usage:',
    '  queue-cli <command> [arguments] [options]',
    '  queue-cli --help',
    '  queue-cli <command> --help',
    '',
    'Commands:',
    '  queue-status [queue] [--json]',
    '    Show BullMQ job counts and workers for all queues, or one queue.',
    '',
    '  queue-jobs <queue> [state...] [--limit n] [--json]',
    '    List jobs in a queue. If state is omitted, lists failed, active, and',
    '    waiting jobs. Common queues: pkg, rel. Common states: waiting, active,',
    '    delayed, failed, completed, paused.',
    '',
    '  remove-job <queue> <jobId> [--json]',
    '    Remove one BullMQ job by ID. This is destructive and only removes the',
    '    queue job; it does not delete package or release Redis records.',
    '',
    '  releases-failed [reason|unknown|timeout] [--limit n] [--json]',
    '    List failed release records, sorted by newest update time. "unknown"',
    '    means reason=None. "timeout" matches BuildTimeout, ConnectionTimeout,',
    '    and GatewayTimeout. Exact reason names such as VersionConflict are also',
    '    accepted.',
    '',
    '  release-show <package> <version> [--json]',
    '    Show one release Redis record.',
    '',
    '  release-remove <package> <version> [--json]',
    '    Delete one release Redis record and remove its deterministic rel queue',
    '    job. This is destructive.',
    '',
    '  release-requeue <package> <version> [--json]',
    '    Reset one release to Pending/None with an empty buildId, remove its',
    '    deterministic rel queue job, then enqueue a fresh rel build job.',
    '',
    '  package-requeue <package> [--json]',
    '    Remove the deterministic pkg queue job and enqueue a fresh package scan.',
  ].join('\n');
}

function getCommandUsage(topic: string | undefined): string {
  switch (topic) {
    case 'queue-status':
      return [
        'Usage: queue-cli queue-status [queue] [--json]',
        '',
        'Show BullMQ counts and worker metadata.',
        '',
        'Arguments:',
        '  queue    Optional queue name. Usually "pkg" or "rel".',
        '',
        'Options:',
        '  --json   Print JSON output.',
        '',
        'Examples:',
        '  queue-cli queue-status',
        '  queue-cli queue-status rel --json',
      ].join('\n');
    case 'queue-jobs':
      return [
        'Usage: queue-cli queue-jobs <queue> [state...] [--limit n] [--json]',
        '',
        'List BullMQ jobs from one queue.',
        '',
        'Arguments:',
        '  queue      Required queue name. Usually "pkg" or "rel".',
        '  state      Optional BullMQ state filter. May be repeated.',
        '             Supported values include waiting, active, delayed, failed,',
        '             completed, paused, prioritized, waiting-children, repeat.',
        '             Default: failed active waiting.',
        '',
        'Options:',
        '  --limit n  Maximum jobs to return. Default: 20.',
        '  --json     Print JSON output.',
        '',
        'Examples:',
        '  queue-cli queue-jobs rel',
        '  queue-cli queue-jobs rel failed active --limit 50 --json',
        '  queue-cli queue-jobs pkg waiting delayed --json',
      ].join('\n');
    case 'remove-job':
    case 'queue-remove':
      return [
        'Usage: queue-cli remove-job <queue> <jobId> [--json]',
        '',
        'Remove one BullMQ job by queue name and job ID.',
        '',
        'This is destructive. It removes the queue job only; it does not remove',
        'release Redis records. Use release-remove when the release record should',
        'also be deleted.',
        '',
        'Arguments:',
        '  queue    Required queue name. Usually "pkg" or "rel".',
        '  jobId    Required BullMQ job ID.',
        '',
        'Options:',
        '  --json   Print JSON output.',
        '',
        'Examples:',
        '  queue-cli remove-job rel build-rel%7Ccom.foo.bar%7C1.2.3 --json',
        "  queue-cli remove-job rel 'build-rel|com.foo.bar|1.2.3' --json",
      ].join('\n');
    case 'releases-failed':
      return [
        'Usage: queue-cli releases-failed [reason|unknown|timeout] [--limit n] [--json]',
        '',
        'List failed release Redis records, sorted by newest update time.',
        '',
        'Arguments:',
        '  reason     Optional filter. Use "unknown" for reason=None, "timeout"',
        '             for BuildTimeout/ConnectionTimeout/GatewayTimeout, or an',
        '             exact ReleaseErrorCode name such as VersionConflict,',
        '             Forbidden, PackageNotFound, NpmHookError.',
        '',
        'Options:',
        '  --limit n  Maximum releases to return. Default: 20.',
        '  --json     Print JSON output.',
        '',
        'Examples:',
        '  queue-cli releases-failed --json',
        '  queue-cli releases-failed unknown --limit 50 --json',
        '  queue-cli releases-failed timeout --json',
        '  queue-cli releases-failed VersionConflict --json',
      ].join('\n');
    case 'release-show':
      return [
        'Usage: queue-cli release-show <package> <version> [--json]',
        '',
        'Show one release Redis record.',
        '',
        'Examples:',
        '  queue-cli release-show com.foo.bar 1.2.3 --json',
      ].join('\n');
    case 'release-remove':
      return [
        'Usage: queue-cli release-remove <package> <version> [--json]',
        '',
        'Delete one release Redis record and remove its deterministic rel queue job.',
        '',
        'This is destructive. Use it when the release should no longer exist, such',
        'as when the package/tag was removed from git.',
        '',
        'Examples:',
        '  queue-cli release-remove com.foo.bar 1.2.3 --json',
      ].join('\n');
    case 'release-requeue':
      return [
        'Usage: queue-cli release-requeue <package> <version> [--json]',
        '',
        'Reset one release to state=Pending, reason=None, buildId="", remove its',
        'deterministic rel queue job, then enqueue a fresh rel build job.',
        '',
        'Examples:',
        '  queue-cli release-requeue com.foo.bar 1.2.3 --json',
      ].join('\n');
    case 'package-requeue':
      return [
        'Usage: queue-cli package-requeue <package> [--json]',
        '',
        'Remove the deterministic pkg queue job and enqueue a fresh package scan.',
        'The package scan refreshes release records and enqueues release jobs as',
        'needed.',
        '',
        'Examples:',
        '  queue-cli package-requeue com.foo.bar --json',
      ].join('\n');
    default:
      return getUsage();
  }
}

function enumName<T extends Record<string, string | number>>(
  obj: T,
  value: number,
): string {
  return (obj[value as keyof T] as string | undefined) ?? `${value}`;
}

function formatTimestamp(value?: number): string {
  if (!value) return '';
  return new Date(value).toISOString();
}

async function summarizeJob(job: Job): Promise<QueueJobSummary> {
  const state = await job.getState();
  return {
    id: `${job.id ?? ''}`,
    name: job.name,
    state,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    ageMs: Date.now() - job.timestamp,
    data: job.data,
    failedReason: job.failedReason,
  };
}

function summarizeRelease(rel: {
  packageName: string;
  version: string;
  state: number;
  reason: number;
  buildId: string;
  tag: string;
  commit: string;
  updatedAt: number;
}): ReleaseSummary {
  return {
    packageName: rel.packageName,
    version: rel.version,
    state: enumName(ReleaseState, rel.state),
    stateCode: rel.state,
    reason: enumName(ReleaseErrorCode, rel.reason),
    reasonCode: rel.reason,
    buildId: rel.buildId,
    tag: rel.tag,
    commit: rel.commit,
    updatedAt: rel.updatedAt,
  };
}

function writeOutput(value: unknown, output: OutputMode): void {
  if (output === 'json') {
    console.log(JSON.stringify(value, null, 2));
    return;
  }

  console.log(formatValue(value));
}

function formatValue(value: unknown): string {
  if (typeof value !== 'object' || value === null) return `${value}`;

  if (Array.isArray(value)) return value.map(formatValue).join('\n\n');
  if (isQueueStatusList(value)) return value.map(formatQueueStatus).join('\n\n');
  if (isQueueStatus(value)) return formatQueueStatus(value);
  if (isQueueJobsResult(value)) return formatQueueJobsResult(value);
  if (isQueueJobSummary(value)) return formatQueueJob(value);
  if (isReleaseSummary(value)) return formatRelease(value);

  return Object.entries(value as Record<string, unknown>)
    .map(([key, item]) => {
      if (key.endsWith('At') || key.endsWith('On') || key === 'timestamp') {
        return `${key}=${formatTimestamp(item as number) || item}`;
      }
      if (typeof item === 'object' && item !== null) {
        return `${key}=${JSON.stringify(item)}`;
      }
      return `${key}=${item}`;
    })
    .join(' ');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isQueueStatusList(value: unknown): value is Array<Record<string, unknown>> {
  return Array.isArray(value) && value.every(isQueueStatus);
}

function isQueueStatus(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && typeof value.queue === 'string' && isRecord(value.counts);
}

function isQueueJobsResult(value: unknown): value is QueueJobsResult {
  return (
    isRecord(value) &&
    typeof value.queue === 'string' &&
    Array.isArray(value.states) &&
    typeof value.total === 'number' &&
    typeof value.limit === 'number' &&
    Array.isArray(value.jobs)
  );
}

function isQueueJobSummary(value: unknown): value is QueueJobSummary {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.state === 'string' &&
    typeof value.attemptsMade === 'number'
  );
}

function isReleaseSummary(value: unknown): value is ReleaseSummary {
  return (
    isRecord(value) &&
    typeof value.packageName === 'string' &&
    typeof value.version === 'string' &&
    typeof value.state === 'string' &&
    typeof value.reason === 'string'
  );
}

function formatQueueStatus(value: Record<string, unknown>): string {
  const counts = value.counts as Record<string, unknown>;
  const workers = Array.isArray(value.workers) ? value.workers : [];
  const lines = [
    `Queue ${value.queue}`,
    `  counts: ${Object.entries(counts)
      .map(([key, item]) => `${key}=${item}`)
      .join(' ')}`,
    `  workers: ${workers.length}`,
  ];
  for (const worker of workers) {
    if (!isRecord(worker)) continue;
    lines.push(
      [
        `    - name=${worker.name ?? ''}`,
        `id=${worker.id ?? ''}`,
        `cmd=${worker.cmd ?? ''}`,
        `addr=${worker.addr ?? ''}`,
        `age=${worker.age ?? ''}`,
        `idle=${worker.idle ?? ''}`,
      ].join(' '),
    );
  }
  return lines.join('\n');
}

function formatQueueJobsResult(value: QueueJobsResult): string {
  const lines = [
    `Queue ${value.queue}`,
    `  states: ${value.states.join(', ')}`,
    `  total: ${value.total}`,
    `  returned: ${value.returned}`,
    `  limit: ${value.limit}`,
  ];
  if (value.total > value.returned) {
    lines.push(`  note: use --limit ${value.total} to show all matching jobs`);
  }
  if (!value.jobs.length) return lines.join('\n');
  lines.push('', 'Jobs:');
  for (const job of value.jobs) lines.push(formatQueueJob(job, '  '));
  return lines.join('\n');
}

function formatQueueJob(job: QueueJobSummary, indent = ''): string {
  const lines = [
    `${indent}- id: ${job.id}`,
    `${indent}  name: ${job.name}`,
    `${indent}  state: ${job.state}`,
    `${indent}  attempts: ${job.attemptsMade}`,
    `${indent}  ageMs: ${job.ageMs}`,
    `${indent}  timestamp: ${formatTimestamp(job.timestamp)}`,
    `${indent}  data: ${JSON.stringify(job.data)}`,
  ];
  if (job.processedOn) lines.push(`${indent}  processedOn: ${formatTimestamp(job.processedOn)}`);
  if (job.finishedOn) lines.push(`${indent}  finishedOn: ${formatTimestamp(job.finishedOn)}`);
  if (job.failedReason) lines.push(`${indent}  failedReason: ${job.failedReason}`);
  return lines.join('\n');
}

function formatRelease(release: ReleaseSummary): string {
  return [
    `${release.packageName}@${release.version}`,
    `  state: ${release.state} (${release.stateCode})`,
    `  reason: ${release.reason} (${release.reasonCode})`,
    `  buildId: ${release.buildId}`,
    `  tag: ${release.tag}`,
    `  commit: ${release.commit}`,
    `  updatedAt: ${formatTimestamp(release.updatedAt)}`,
  ].join('\n');
}

function getBuildReleaseJobId(packageName: string, version: string): string {
  const jobConfig = config.jobs.buildRelease;
  return createJobId(jobConfig.name, packageName, version);
}

function getBuildPackageJobId(packageName: string): string {
  const jobConfig = config.jobs.buildPackage;
  return createJobId(jobConfig.name, packageName);
}

function assertQueue(queueName: string): void {
  if (!hasQueue(queueName)) throw new Error(`Unknown queue: ${queueName}`);
}

async function queueStatus(queueName?: string): Promise<unknown[]> {
  const queueNames = queueName
    ? [queueName]
    : Object.keys(config.queueSettings);
  return await Promise.all(
    queueNames.map(async (name) => {
      assertQueue(name);
      const queue = getQueue(name);
      return {
        queue: name,
        counts: await queue.getJobCounts(...knownJobTypes),
        workers: await queue.getWorkers(),
      };
    }),
  );
}

async function queueJobs(
  queueName: string,
  states: string[],
  limit: number,
): Promise<QueueJobsResult> {
  assertQueue(queueName);
  const queue = getQueue(queueName);
  const jobTypes = (states.length
    ? states
    : ['failed', 'active', 'waiting']) as JobType[];
  const counts = await queue.getJobCounts(...jobTypes);
  const jobs = await queue.getJobs(jobTypes, 0, limit - 1, false);
  const summaries = await Promise.all(
    jobs.map(async (job) => await summarizeJob(job as Job)),
  );
  return {
    queue: queueName,
    states: jobTypes,
    total: Object.values(counts).reduce((sum, count) => sum + count, 0),
    limit,
    returned: summaries.length,
    jobs: summaries,
  };
}

async function queueRemove(
  queueName: string,
  jobId: string,
): Promise<Record<string, unknown>> {
  assertQueue(queueName);
  const removed = await getQueue(queueName).remove(jobId, {
    removeChildren: true,
  });
  return { queue: queueName, jobId, removed: removed === 1 };
}

async function scanReleasePackageNames(): Promise<string[]> {
  const client = redis.client!;
  const names: string[] = [];
  let cursor = '0';
  do {
    const [nextCursor, keys] = await client.scan(
      cursor,
      'MATCH',
      'rel:*',
      'COUNT',
      200,
    );
    cursor = nextCursor;
    for (const key of keys) names.push(key.slice('rel:'.length));
  } while (cursor !== '0');
  names.sort();
  return names;
}

function matchesReason(
  rel: ReleaseSummary,
  reasonFilter: string | undefined,
): boolean {
  if (!reasonFilter) return true;
  if (reasonFilter === 'unknown') return rel.reasonCode === ReleaseErrorCode.None;
  if (reasonFilter === 'timeout') {
    return (
      rel.reasonCode === ReleaseErrorCode.BuildTimeout ||
      rel.reasonCode === ReleaseErrorCode.ConnectionTimeout ||
      rel.reasonCode === ReleaseErrorCode.GatewayTimeout
    );
  }
  return rel.reason.toLowerCase() === reasonFilter.toLowerCase();
}

async function releasesFailed(
  reasonFilter: string | undefined,
  limit: number,
): Promise<ReleaseSummary[]> {
  const packageNames = await scanReleasePackageNames();
  const result: ReleaseSummary[] = [];
  for (const packageName of packageNames) {
    const releases = await fetchAll(packageName);
    for (const release of releases) {
      const summary = summarizeRelease(release);
      if (
        summary.stateCode === ReleaseState.Failed &&
        matchesReason(summary, reasonFilter)
      ) {
        result.push(summary);
      }
    }
  }
  result.sort((lhs, rhs) => rhs.updatedAt - lhs.updatedAt);
  return result.slice(0, limit);
}

async function releaseShow(
  packageName: string,
  version: string,
): Promise<ReleaseSummary | null> {
  const release = await fetchOne(packageName, version);
  return release ? summarizeRelease(release) : null;
}

async function releaseRemove(
  packageName: string,
  version: string,
): Promise<Record<string, unknown>> {
  const jobId = getBuildReleaseJobId(packageName, version);
  const queueName = config.jobs.buildRelease.queue;
  const removedJob = await getQueue(queueName).remove(jobId, {
    removeChildren: true,
  });
  await removeReleaseRecord(packageName, version);
  return {
    packageName,
    version,
    releaseRemoved: true,
    relatedJob: { queue: queueName, jobId, removed: removedJob === 1 },
  };
}

async function releaseRequeue(
  packageName: string,
  version: string,
): Promise<Record<string, unknown>> {
  const release = await fetchOne(packageName, version);
  if (!release) throw new Error(`Release not found: ${packageName}@${version}`);

  const jobConfig = config.jobs.buildRelease;
  const queue = getQueue(jobConfig.queue);
  const jobId = getBuildReleaseJobId(packageName, version);
  await queue.remove(jobId, { removeChildren: true });
  const saved = await saveRelease({
    ...release,
    state: ReleaseState.Pending,
    reason: ReleaseErrorCode.None,
    buildId: '',
  });
  const job = await addJob({
    queue,
    name: jobConfig.name,
    data: { name: packageName, version },
    opts: { jobId },
  });
  return {
    release: summarizeRelease(saved),
    job: { queue: jobConfig.queue, jobId, added: job !== null },
  };
}

async function packageRequeue(
  packageName: string,
): Promise<Record<string, unknown>> {
  const jobConfig = config.jobs.buildPackage;
  const queue = getQueue(jobConfig.queue);
  const jobId = getBuildPackageJobId(packageName);
  await queue.remove(jobId, { removeChildren: true });
  const job = await addJob({
    queue,
    name: jobConfig.name,
    data: { name: packageName },
    opts: { jobId },
  });
  return {
    packageName,
    job: { queue: jobConfig.queue, jobId, added: job !== null },
  };
}

function requireArgs(args: string[], count: number): void {
  if (args.length < count) throw new Error(getUsage());
}

export async function runQueueCli(argv: string[] = process.argv): Promise<void> {
  const args = parseQueueCliArgs(argv);
  if (args.command === 'help') {
    const helpArgs = args as QueueCliHelpArgs;
    console.log(getCommandUsage(helpArgs.topic));
    return;
  }

  let result: unknown;
  try {
    switch (args.command) {
      case 'queue-status':
        result = await queueStatus(args.rest[0]);
        break;
      case 'queue-jobs':
        requireArgs(args.rest, 1);
        result = await queueJobs(args.rest[0], args.rest.slice(1), args.limit);
        break;
      case 'remove-job':
      case 'queue-remove':
        requireArgs(args.rest, 2);
        result = await queueRemove(args.rest[0], args.rest[1]);
        break;
      case 'releases-failed':
        result = await releasesFailed(args.rest[0], args.limit);
        break;
      case 'release-show':
        requireArgs(args.rest, 2);
        result = await releaseShow(args.rest[0], args.rest[1]);
        break;
      case 'release-remove':
        requireArgs(args.rest, 2);
        result = await releaseRemove(args.rest[0], args.rest[1]);
        break;
      case 'release-requeue':
        requireArgs(args.rest, 2);
        result = await releaseRequeue(args.rest[0], args.rest[1]);
        break;
      case 'package-requeue':
        requireArgs(args.rest, 1);
        result = await packageRequeue(args.rest[0]);
        break;
      default:
        throw new Error(getUsage());
    }
    writeOutput(result, args.output);
  } finally {
    await closeQueues();
    redis.close();
  }
}

export {
  parseQueueCliArgs,
  getUsage,
  getCommandUsage,
  queueStatus,
  queueJobs,
  queueRemove,
  releasesFailed,
  releaseShow,
  releaseRemove,
  releaseRequeue,
  packageRequeue,
};
