import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IS_EMBEDDED = __dirname.endsWith('src') || __dirname.endsWith('src\\');

const DATA_DIR = IS_EMBEDDED
  ? join(__dirname, '..', 'data')
  : join(__dirname, '..', 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const SCHEMA_PATH = IS_EMBEDDED
  ? join(__dirname, '..', '..', 'schema.sql')
  : join(__dirname, 'schema.sql');
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

const TABLE_MAP = {
  'categorias-adicionais': 'categorias_adicionais',
  'fidelidade_clientes': 'fidelidade_clientes',
  'fidelidade_config': 'fidelidade_config',
  'config_delivery': 'config_delivery',
};

function tableName(collection) {
  return TABLE_MAP[collection] || collection;
}

function filterValidColumns(db, table, data) {
  const colInfo = db.prepare(`PRAGMA table_info(${table})`).all();
  const validColumns = colInfo.map(c => c.name);
  const filtered = {};
  for (const key of Object.keys(data)) {
    if (validColumns.includes(key)) {
      filtered[key] = data[key];
    }
  }
  return filtered;
}

export async function getAll(collection, tenantId) {
  const db = getDb(tenantId);
  const rows = db.prepare(`SELECT * FROM ${tableName(collection)} ORDER BY id`).all();
  db.close();
  return rows;
}

export async function getById(collection, id, tenantId) {
  const db = getDb(tenantId);
  const row = db.prepare(`SELECT * FROM ${tableName(collection)} WHERE id = ?`).get(id);
  db.close();
  return row || null;
}

export async function create(collection, inputData, tenantId) {
  const db = getDb(tenantId);
  const table = tableName(collection);
  const data = filterValidColumns(db, table, { ...inputData });
  if (data.id) delete data.id;

  const cols = Object.keys(data);
  const vals = Object.values(data);
  const placeholders = vals.map(() => '?').join(', ');

  const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`);
  const result = stmt.run(...vals);

  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(result.lastInsertRowid);
  db.close();
  return row;
}

export async function update(collection, id, inputData, tenantId) {
  const db = getDb(tenantId);
  const table = tableName(collection);
  const data = filterValidColumns(db, table, { ...inputData, updated_at: new Date().toISOString() });
  if (data.id) delete data.id;

  const setClause = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const vals = [...Object.values(data), id];

  db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(...vals);
  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  db.close();
  return row || null;
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
