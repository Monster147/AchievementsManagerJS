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

const locks = {};

async function withLock(file, fn) {
  const prev = locks[file] || Promise.resolve();
  let release;
  const current = new Promise(r => (release = r));
  locks[file] = prev.then(() => current);
  await prev; // espera a nossa vez
  try {
    return await fn();
  } finally {
    release();
  }
}

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
  return withLock(file, async () => {
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
  });
}

async function updateTable(table, mutator, defaultData = []) {
  ensureDirExists(DB_DIR);
  const file = getTableFile(table);
  return withLock(file, async () => {
    let data;
    try {
      data = JSON.parse(await fs.readFile(file, 'utf-8'));
    } catch {
      data = defaultData;
    }
    const out = await mutator(data);
    const newData = out && Object.prototype.hasOwnProperty.call(out, 'data') ? out.data : data;
    await fs.writeFile(file, JSON.stringify(newData, null, 2), 'utf-8');
    return out ? out.result : undefined;
  });
}

export { readTable, writeTable, updateTable };