#!/usr/bin/env node
import {
  formatDataValidationIssue,
  validateDataDirectory,
} from '../validation/data-validator.js';

const dataDir = process.argv[2] || process.env.OPENUPM_DATA_PATH || 'data';
const result = await validateDataDirectory(dataDir);

if (!result.valid) {
  for (const issue of result.issues) {
    console.error(formatDataValidationIssue(issue));
  }
  process.exit(1);
}

console.log(`OpenUPM data validation passed for ${dataDir}`);
