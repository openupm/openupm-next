import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { DailyDownload } from '@openupm/types';

import { PackageDownloadRange } from './aggregation.js';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');

export interface TrendsSqliteStore {
  close: () => void;
  getPackageNamesWithoutDownloads: (packageNames: string[]) => string[];
  upsertPackageDownloads: (
    packageName: string,
    downloads: DailyDownload[],
  ) => void;
  getPackageDownloadRanges: (packageNames: string[]) => PackageDownloadRange[];
}

export function openTrendsSqliteStore(dbPath: string): TrendsSqliteStore {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS package_downloads (
      package_name TEXT NOT NULL,
      day TEXT NOT NULL,
      downloads INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (package_name, day)
    );
    CREATE INDEX IF NOT EXISTS idx_package_downloads_day
      ON package_downloads(day);
  `);

  const upsertPackageDownload = db.prepare(`
    INSERT INTO package_downloads(package_name, day, downloads, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(package_name, day) DO UPDATE SET
      downloads = excluded.downloads,
      updated_at = excluded.updated_at
  `);

  const selectPackageDownloads = db.prepare(`
    SELECT day, downloads
    FROM package_downloads
    WHERE package_name = ?
    ORDER BY day ASC
  `);
  const selectPackageDownloadCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM package_downloads
    WHERE package_name = ?
  `);

  return {
    close: () => db.close(),
    getPackageNamesWithoutDownloads: (packageNames: string[]): string[] =>
      packageNames.filter((packageName) => {
        const row = selectPackageDownloadCount.get(packageName) as {
          count: number;
        };
        return row.count === 0;
      }),
    upsertPackageDownloads: (
      packageName: string,
      downloads: DailyDownload[],
    ): void => {
      const now = Date.now();
      db.exec('BEGIN');
      try {
        for (const entry of downloads) {
          upsertPackageDownload.run(
            packageName,
            entry.day,
            Math.trunc(entry.downloads),
            now,
          );
        }
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },
    getPackageDownloadRanges: (
      packageNames: string[],
    ): PackageDownloadRange[] =>
      packageNames.map((packageName) => ({
        package: packageName,
        downloads: selectPackageDownloads.all(packageName).map((entry) => {
          const row = entry as { day: string; downloads: number };
          return { day: row.day, downloads: row.downloads };
        }),
      })),
  };
}
