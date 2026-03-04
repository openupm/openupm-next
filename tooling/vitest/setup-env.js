import dotenvFlow from 'dotenv-flow';

// Missing package-local .env files are expected in many workspaces.
dotenvFlow.config({ silent: true });
