import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';

import { openTrendsSqliteStore } from '../../src/trends/sqliteStore.js';

let tmpDir = '';

afterEach(() => {
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  tmpDir = '';
});

describe('trends sqlite store', () => {
  it('upserts and reads package daily downloads', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openupm-trends-'));
    const store = openTrendsSqliteStore(path.join(tmpDir, 'trends.sqlite'));
    try {
      expect(
        store.getPackageNamesWithoutDownloads([
          'com.example.pkg',
          'com.example.empty',
        ]),
      ).toEqual(['com.example.pkg', 'com.example.empty']);
      store.upsertPackageDownloads('com.example.pkg', [
        { day: '2026-01-01', downloads: 3 },
        { day: '2026-01-02', downloads: 5 },
      ]);
      store.upsertPackageDownloads('com.example.pkg', [
        { day: '2026-01-02', downloads: 9 },
      ]);
      expect(
        store.getPackageNamesWithoutDownloads([
          'com.example.pkg',
          'com.example.empty',
        ]),
      ).toEqual(['com.example.empty']);

      expect(store.getPackageDownloadRanges(['com.example.pkg'])).toEqual([
        {
          package: 'com.example.pkg',
          downloads: [
            { day: '2026-01-01', downloads: 3 },
            { day: '2026-01-02', downloads: 9 },
          ],
        },
      ]);
    } finally {
      store.close();
    }
  });
});
