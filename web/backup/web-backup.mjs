import multer from 'multer';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { createBackupZip, importBackupZip } from '../../common/backup-utils.mjs';

export default function init(projectRoot) {
  const upload = multer({
    dest: path.join(os.tmpdir(), 'achievements-manager-upload'),
    limits: {
      fileSize: 1024 * 1024 * 1024
    }
  });

  async function removeTempFile(filePath) {
    if (!filePath) return;
    await fs.rm(filePath, { force: true });
  }

  async function sendBackupDownload(res) {
    const backup = await createBackupZip(projectRoot);
    res.download(backup.tempZipPath, backup.zipName, async () => {
      await removeTempFile(backup.tempZipPath);
    });
  }

  function runUpload(req, res) {
    return new Promise((resolve, reject) => {
      upload.single('backupZip')(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }

  async function exportApi(req, res) {
    try {
      await sendBackupDownload(res);
    } catch (e) {
      console.error('Error exporting backup:', e);
      res.status(500).json({
        error: 'Could not export backup zip.'
      });
    }
  }

  async function importApi(req, res) {
    try {
      await runUpload(req, res);
    } catch (e) {
      return res.status(400).json({
        error: e.message || 'Invalid upload.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'Missing backupZip file.'
      });
    }

    try {
      await importBackupZip(projectRoot, req.file.path);
      return res.status(200).json({
        status: 'Backup imported successfully.'
      });
    } catch (e) {
      console.error('Error importing backup:', e);
      return res.status(400).json({
        error: e.message || 'Could not import backup zip.'
      });
    } finally {
      await removeTempFile(req.file.path);
    }
  }

  async function exportSite(req, res) {
    try {
      await sendBackupDownload(res);
    } catch (e) {
      console.error('Error exporting backup:', e);
      res.redirect('/site/config?backupError=Could%20not%20export%20backup%20zip.');
    }
  }

  async function importSite(req, res) {
    try {
      await runUpload(req, res);
    } catch (e) {
      return res.redirect(`/site/config?backupError=${encodeURIComponent(e.message || 'Invalid upload.')}`);
    }

    if (!req.file) {
      return res.redirect('/site/config?backupError=Please%20select%20a%20zip%20file.');
    }

    try {
      await importBackupZip(projectRoot, req.file.path);
      return res.redirect('/site/config?backupStatus=Backup%20imported%20successfully.');
    } catch (e) {
      console.error('Error importing backup:', e);
      return res.redirect(`/site/config?backupError=${encodeURIComponent(e.message || 'Could not import backup zip.')}`);
    } finally {
      await removeTempFile(req.file.path);
    }
  }

  return {
    exportApi,
    importApi,
    exportSite,
    importSite
  };
}