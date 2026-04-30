import fs from 'fs/promises';
import path from 'path';

const DB_DIR = path.resolve('db');

async function ensureDirExists(dir) {
  try { await fs.mkdir(dir, { recursive: true }); } catch {}
}

ensureDirExists(DB_DIR);

function getTableFile(table) {
  ensureDirExists(DB_DIR);
  return path.join(DB_DIR, `${table}.json`);
}

const writeLocks = {};

async function readTable(table, defaultData = []) {
  ensureDirExists(DB_DIR);
  const file = getTableFile(table);
  try {
    const content = await fs.readFile(file, 'utf-8');
    return JSON.parse(content);
  } catch {
    return defaultData;
  }
}

async function writeTable(table, data) {
  ensureDirExists(DB_DIR);
  const file = getTableFile(table);

  if (!writeLocks[file]) writeLocks[file] = Promise.resolve();
  const prev = writeLocks[file];
  let resolve;
  writeLocks[file] = new Promise(r => resolve = r);

  try {
    await prev;
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing', file, err);
    throw err;
  } finally {
    resolve();
  }
}

export { readTable, writeTable };