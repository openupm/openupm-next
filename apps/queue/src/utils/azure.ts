import util from 'util';
import configRaw from 'config';
import azureDevops from 'azure-devops-node-api';
import buildInterfaces from 'azure-devops-node-api/interfaces/BuildInterfaces.js';

import { createLogger } from '@openupm/server-common/build/log.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = configRaw as any;
const sleep = util.promisify(setTimeout);
const logger = createLogger('@openupm/queue/azure');

export const BuildStatus = buildInterfaces.BuildStatus;
export const BuildResult = buildInterfaces.BuildResult;

export async function getBuildApi(): Promise<any> {
  const authHandler = azureDevops.getPersonalAccessTokenHandler(
    config.azureDevops.token,
  );
  const conn = new azureDevops.WebApi(config.azureDevops.endpoint, authHandler);
  return await conn.getBuildApi();
}

export async function queueBuild(
  buildApi: any,
  definitionId: number,
  parameters: object,
): Promise<any> {
  return await buildApi.queueBuild(
    {
      definition: { id: definitionId },
      parameters: JSON.stringify(parameters),
    },
    config.azureDevops.project,
  );
}

export async function waitBuild(
  buildApi: any,
  buildId: string,
): Promise<any | null> {
  for (let i = 0; i < config.azureDevops.check.retries; i++) {
    const build = await buildApi.getBuild(config.azureDevops.project, buildId);
    const status = build.status;
    const result = build.result;
    logger.debug({ buildId, status, result }, 'wait build');
    if (status === BuildStatus.Completed || status === BuildStatus.Cancelling) {
      return build;
    }
    await sleep(config.azureDevops.check.retryIntervalStep * (i + 1));
  }
  return null;
}

function joinUrl(...parts: Array<string | number>): string {
  return parts
    .map((x) => String(x).replace(/^\/+/g, '').replace(/\/+$/g, ''))
    .filter(Boolean)
    .join('/');
}

export function getBuildLogsUrl(buildId: string): string {
  return joinUrl(config.azureDevops.buildUrlBase, '_apis/build/builds', buildId, 'logs');
}

export function getBuildSectionLogUrl(buildId: string, stepId: number): string {
  return joinUrl(
    config.azureDevops.buildUrlBase,
    '_apis/build/builds',
    buildId,
    'logs',
    stepId,
  );
}
