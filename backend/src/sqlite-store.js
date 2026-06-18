import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const SCHEMA_PATH = join(__dirname, '..', 'schema.sql');

const TEST_TENANT_ID = process.env.TEST_TENANT_ID;

function getDb(tenantId) {
  const tid = tenantId || TEST_TENANT_ID || 'default';
  const dbPath = join(DATA_DIR, `tenant-${tid}.db`);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function initTenantDb(tenantId) {
  const db = getDb(tenantId);
  if (existsSync(SCHEMA_PATH)) {
    const schema = readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
  }
  db.close();
}

const JSON_COLS = new Set([
  'itens', 'movimentos', 'adicionais_ids', 'horarios', 'config', 'dados',
]);

const TABLE_MAP = {
  'categorias-adicionais': 'categorias_adicionais',
  'fidelidade_clientes': 'fidelidade_clientes',
  'fidelidade_config': 'fidelidade_config',
  'config_delivery': 'config_delivery',
};

function tableName(collection) {
  return TABLE_MAP[collection] || collection;
}

function colNames(db, table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
}

function filterCols(db, table, data) {
  const valid = colNames(db, table);
  const out = {};
  for (const key of Object.keys(data)) {
    if (valid.includes(key)) out[key] = data[key];
  }
  return out;
}

function parseRow(row) {
  if (!row) return null;
  const parsed = { ...row };
  for (const col of Object.keys(parsed)) {
    if (JSON_COLS.has(col) && typeof parsed[col] === 'string') {
      try { parsed[col] = JSON.parse(parsed[col]); } catch {}
    }
  }
  return parsed;
}

function parseRows(rows) {
  return rows.map(parseRow);
}

export async function getAll(collection, tenantId) {
  const db = getDb(tenantId);
  const rows = parseRows(db.prepare(`SELECT * FROM ${tableName(collection)} ORDER BY id`).all());
  db.close();
  return rows;
}

export async function getById(collection, id, tenantId) {
  const db = getDb(tenantId);
  const row = parseRow(db.prepare(`SELECT * FROM ${tableName(collection)} WHERE id = ?`).get(id));
  db.close();
  return row;
}

export async function create(collection, inputData, tenantId) {
  const db = getDb(tenantId);
  const table = tableName(collection);
  const data = filterCols(db, table, { ...inputData });
  if (data.id) delete data.id;

  for (const col of Object.keys(data)) {
    if (JSON_COLS.has(col) && typeof data[col] !== 'string') {
      data[col] = JSON.stringify(data[col]);
    }
  }

  const cols = Object.keys(data);
  const vals = Object.values(data);
  const placeholders = vals.map(() => '?').join(', ');

  const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`);
  const result = stmt.run(...vals);

  const row = parseRow(db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(result.lastInsertRowid));
  db.close();
  return row;
}

export async function update(collection, id, inputData, tenantId) {
  const db = getDb(tenantId);
  const table = tableName(collection);
  const data = filterCols(db, table, { ...inputData, updated_at: new Date().toISOString() });
  if (data.id) delete data.id;

  for (const col of Object.keys(data)) {
    if (JSON_COLS.has(col) && typeof data[col] !== 'string') {
      data[col] = JSON.stringify(data[col]);
    }
  }

  const setClause = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const vals = [...Object.values(data), id];

  db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(...vals);
  const row = parseRow(db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id));
  db.close();
  return row;
}

export async function remove(collection, id, tenantId) {
  const db = getDb(tenantId);
  const table = tableName(collection);
  const result = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  db.close();
  return result.changes > 0;
}

export async function query(collection, fn, tenantId) {
  const rows = await getAll(collection, tenantId);
  return rows.filter(fn);
}

export async function migrateDataFromJson() {
}
