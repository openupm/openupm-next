import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export type RemoteTag = {
  commit: string;
  tag: string;
};

export const parseRemoteTagsOutput = function (stdout: string): RemoteTag[] {
  const remotes = stdout
    .split(/\r?\n/)
    .map((x) => {
      const [commit, rawTag] = x.split('\t').filter(Boolean);
      let tag = rawTag;
      if (tag) tag = tag.replace('refs/tags/', '');
      if (commit && tag) return { commit, tag };
      return null;
    })
    .filter((x): x is RemoteTag => x !== null);

  const results: RemoteTag[] = [];
  for (const item of remotes) {
    if (item.tag.endsWith('^{}')) {
      results.push({ commit: item.commit, tag: item.tag.replace('^{}', '') });
    } else if (!remotes.find((x) => x.tag === `${item.tag}^{}`)) {
      results.push(item);
    }
  }
  return results;
};

export const gitListRemoteTags = async function (
  gitUrl: string,
): Promise<RemoteTag[]> {
  const { stdout } = await execFileAsync('git', [
    'ls-remote',
    '--tags',
    '--sort=-version:refname',
    gitUrl,
  ]);
  return parseRemoteTagsOutput(stdout);
};
