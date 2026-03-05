import path from 'path';
import { promises as afs } from 'fs';
import yaml from 'js-yaml';

import { getLocalDataDir } from '@openupm/local-data';
import { createLogger } from '@openupm/server-common/build/log.js';
import { cacheAvatarImageForGithubUser } from './fetchPackageExtra.js';

const logger = createLogger('@openupm/jobs/fetchBackerData');

type Backer = {
  githubUser?: string;
};

type BackersDoc = {
  items: Backer[];
};

export async function fetchBackerDataJob(
  force: boolean,
  backersDoc?: BackersDoc,
): Promise<void> {
  const doc = backersDoc || (await loadBackersDoc());
  for (const backer of doc.items || []) {
    if (backer.githubUser) {
      await cacheAvatarImageForGithubUser(backer.githubUser, force);
    }
  }
  logger.info({ count: (doc.items || []).length }, 'fetchBackerData completed');
}

async function loadBackersDoc(): Promise<BackersDoc> {
  const filePath = path.resolve(getLocalDataDir(), 'backers.yml');
  const content = await afs.readFile(filePath, 'utf8');
  return (yaml.load(content) || { items: [] }) as BackersDoc;
}
