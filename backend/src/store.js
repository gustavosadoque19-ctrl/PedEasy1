import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function filePath(collection) {
  return join(DATA_DIR, `${collection}.json`);
}

function read(collection) {
  const path = filePath(collection);
  if (!existsSync(path)) return [];
  try {
    let content = readFileSync(path, 'utf-8');
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function write(collection, data) {
  writeFileSync(filePath(collection), JSON.stringify(data, null, 2), 'utf-8');
}

export function getAll(collection) {
  return read(collection);
}

export function getById(collection, id) {
  return read(collection).find((item) => item.id === id) || null;
}

export function create(collection, data) {
  const list = read(collection);
  const id = list.length > 0 ? Math.max(...list.map((i) => i.id ?? 0)) + 1 : 1;
  const item = { id, ...data, createdAt: new Date().toISOString() };
  list.push(item);
  write(collection, list);
  return item;
}

export function update(collection, id, data) {
  const list = read(collection);
  const index = list.findIndex((i) => i.id === id);
  if (index === -1) return null;
  list[index] = { ...list[index], ...data };
  write(collection, list);
  return list[index];
}

export function remove(collection, id) {
  const list = read(collection);
  const filtered = list.filter((i) => i.id !== id);
  if (filtered.length === list.length) return false;
  write(collection, filtered);
  return true;
}

export function query(collection, fn) {
  return read(collection).filter(fn);
}
