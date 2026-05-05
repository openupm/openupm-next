import dotenvFlow from 'dotenv-flow';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

// Missing package-local .env files are expected in many workspaces.
dotenvFlow.config({ path: repoRoot, silent: true });

const localEnvFile = path.join(repoRoot, '.env.local');
if (fs.existsSync(localEnvFile)) {
  dotenvFlow.load(localEnvFile, { silent: true });
}
