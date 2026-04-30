import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import AdmZip from 'adm-zip';

const EXPORT_NAME_PREFIX = 'achievements-backup';

function normalizeEntry(entryName) {
  return entryName.replace(/\\/g, '/');
}

function isWithinPath(basePath, targetPath) {
  const relative = path.relative(basePath, targetPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function ensureZipEntryIsSafe(entryName) {
  const normalized = path.posix.normalize(normalizeEntry(entryName));

  if (normalized.startsWith('../') || normalized === '..' || path.posix.isAbsolute(normalized)) {
    throw new Error(`Unsafe zip entry: ${entryName}`);
  }

  if (!normalized.startsWith('db/') && !normalized.startsWith('assets/')) {
    throw new Error(`Unsupported entry in zip: ${entryName}`);
  }

  return normalized;
}

async function safeRemove(targetPath) {
  await fs.rm(targetPath, { recursive: true, force: true });
}

function getExportFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${EXPORT_NAME_PREFIX}-${timestamp}.zip`;
}

export async function createBackupZip(projectRoot) {
  const dbDir = path.join(projectRoot, 'db');
  const assetsDir = path.join(projectRoot, 'assets');

  await fs.access(dbDir);
  await fs.access(assetsDir);

  const zip = new AdmZip();
  zip.addLocalFolder(dbDir, 'db');
  zip.addLocalFolder(assetsDir, 'assets');

  const zipName = getExportFileName();
  const tempZipPath = path.join(os.tmpdir(), `${crypto.randomUUID()}-${zipName}`);
  zip.writeZip(tempZipPath);

  return {
    zipName,
    tempZipPath
  };
}

export async function importBackupZip(projectRoot, zipPath) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();

  const hasDb = entries.some((entry) => normalizeEntry(entry.entryName).startsWith('db/'));
  const hasAssets = entries.some((entry) => normalizeEntry(entry.entryName).startsWith('assets/'));

  if (!hasDb || !hasAssets) {
    throw new Error('Backup must include both db/ and assets/ folders.');
  }

  const stagingDir = path.join(os.tmpdir(), `backup-import-${crypto.randomUUID()}`);
  const stagedDbDir = path.join(stagingDir, 'db');
  const stagedAssetsDir = path.join(stagingDir, 'assets');

  await fs.mkdir(stagingDir, { recursive: true });

  try {
    for (const entry of entries) {
      const safeEntryName = ensureZipEntryIsSafe(entry.entryName);
      const outPath = path.join(stagingDir, safeEntryName);

      if (!isWithinPath(stagingDir, outPath)) {
        throw new Error(`Unsafe extraction path for entry: ${entry.entryName}`);
      }

      if (entry.isDirectory) {
        await fs.mkdir(outPath, { recursive: true });
        continue;
      }

      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, entry.getData());
    }

    const targetDbDir = path.join(projectRoot, 'db');
    const targetAssetsDir = path.join(projectRoot, 'assets');

    await safeRemove(targetDbDir);
    await safeRemove(targetAssetsDir);

    await fs.mkdir(targetDbDir, { recursive: true });
    await fs.mkdir(targetAssetsDir, { recursive: true });

    await fs.access(stagedDbDir);
    await fs.access(stagedAssetsDir);

    await fs.cp(stagedDbDir, targetDbDir, { recursive: true, force: true });
    await fs.cp(stagedAssetsDir, targetAssetsDir, { recursive: true, force: true });
  } finally {
    await safeRemove(stagingDir);
  }
}
