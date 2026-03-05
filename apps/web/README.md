# @openupm/web

The Node.js app for OpenUPM API web server.

## Auth Config

- Configure tokens via node-config files.
- Keep defaults as skeletons in `config/default.json5`.
- Mount runtime secrets as `config/local.json5` (gitignored), for example:
  - `github.tokens`: round-robin token array.
  - `azureDevops.token`: Azure DevOps PAT.
