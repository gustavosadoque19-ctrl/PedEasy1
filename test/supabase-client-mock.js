import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const GLOBAL_DB_PATH = join(DATA_DIR, 'pedy-global.db');

function getGlobalDb() {
  const db = new Database(GLOBAL_DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

function ensureGlobalTables() {
  const db = getGlobalDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      plano TEXT DEFAULT 'free',
      status TEXT DEFAULT 'trial',
      trial_ends_at TEXT,
      pagarme_customer_id TEXT,
      pagarme_subscription_id TEXT,
      config TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tenant_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      cargo TEXT DEFAULT 'Administrador',
      permissao TEXT DEFAULT 'admin',
      ativo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tenant_plan_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plano TEXT UNIQUE NOT NULL,
      nfe INTEGER DEFAULT 0,
      whatsapp_bot INTEGER DEFAULT 0,
      relatorios_avancados INTEGER DEFAULT 0,
      max_funcionarios INTEGER DEFAULT 5,
      max_pedidos_mes INTEGER DEFAULT 0,
      integrations INTEGER DEFAULT 0
    );
  `);
  db.close();
}

ensureGlobalTables();

function parseRow(row) {
  if (!row) return null;
  const parsed = { ...row };
  if (typeof parsed.config === 'string') {
    try { parsed.config = JSON.parse(parsed.config); } catch { parsed.config = {}; }
  }
  return parsed;
}

class QueryBuilder {
  constructor(table, db) {
    this.table = table;
    this.db = db;
    this.filters = [];
    this.orderCol = null;
    this.orderDir = 'ASC';
    this.selected = '*';
    this.singleMode = false;
    this.headMode = false;
    this.insertData = null;
    this.updateData = null;
    this.deleteMode = false;
    this.insertReturn = null;
  }

  select(cols, opts) {
    if (typeof cols === 'string') this.selected = cols;
    if (Array.isArray(cols)) this.selected = cols.join(', ');
    if (opts?.head === true) this.headMode = true;
    if (opts?.count) this.headMode = true;
    return this;
  }

  eq(col, val) {
    this.filters.push({ col, op: '=', val });
    return this;
  }

  order(col, { ascending = true } = {}) {
    this.orderCol = col;
    this.orderDir = ascending ? 'ASC' : 'DESC';
    return this;
  }

  maybeSingle() {
    this.singleMode = true;
    return this;
  }

  single() {
    this.singleMode = true;
    return this;
  }

  insert(data) {
    this.insertData = data;
    return this;
  }

  update(data) {
    this.updateData = data;
    return this;
  }

  delete() {
    this.deleteMode = true;
    return this;
  }

  then(resolve, reject) {
    try {
      const result = this._execute();
      resolve(result);
    } catch (err) {
      reject(err);
    }
    return Promise.resolve(result);
  }

  _execute() {
    if (this.insertData) {
      return this._doInsert();
    }
    if (this.updateData) {
      return this._doUpdate();
    }
    if (this.deleteMode) {
      return this._doDelete();
    }
    return this._doSelect();
  }

  _buildWhere() {
    if (this.filters.length === 0) return { clause: '', params: [] };
    const parts = this.filters.map((f, i) => {
      const col = f.col.includes('->>') 
        ? `json_extract(${f.col.split('->>')[0]}, '$.${f.col.split('->>')[1]}')`
        : f.col;
      return `${col} ${f.op} ?`;
    });
    return { clause: 'WHERE ' + parts.join(' AND '), params: this.filters.map(f => f.val) };
  }

  _doSelect() {
    const { clause, params } = this._buildWhere();
    let sql = `SELECT ${this.selected} FROM ${this.table} ${clause}`;
    if (this.orderCol) sql += ` ORDER BY ${this.orderCol} ${this.orderDir}`;
    if (this.singleMode) sql += ' LIMIT 1';

    if (this.headMode) {
      const countSql = `SELECT COUNT(*) as count FROM ${this.table} ${clause}`;
      const row = this.db.prepare(countSql).get(...params);
      return { data: null, count: row.count, error: null };
    }

    if (this.singleMode) {
      const row = this.db.prepare(sql).get(...params);
      return { data: row ? parseRow(row) : null, error: null };
    }

    const rows = this.db.prepare(sql).all(...params);
    return { data: rows.map(parseRow), error: null };
  }

  _doInsert() {
    let data = this.insertData;
    if (!Array.isArray(data)) data = [data];

    const inserted = [];
    for (const item of data) {
      const cols = Object.keys(item);
      const vals = Object.values(item);
      const placeholders = vals.map(() => '?').join(', ');

      const result = this.db.prepare(
        `INSERT INTO ${this.table} (${cols.join(', ')}) VALUES (${placeholders})`
      ).run(...vals);

      if (this.singleMode || this.insertReturn) {
        const row = this.db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(result.lastInsertRowid);
        inserted.push(parseRow(row));
      } else {
        inserted.push({ id: result.lastInsertRowid });
      }
    }

    return { data: inserted.length === 1 ? inserted[0] : inserted, error: null };
  }

  _doUpdate() {
    const { clause, params } = this._buildWhere();
    const cols = Object.keys(this.updateData);
    const vals = Object.values(this.updateData);
    const setClause = cols.map(k => `${k} = ?`).join(', ');
    const sql = `UPDATE ${this.table} SET ${setClause} ${clause}`;

    this.db.prepare(sql).run(...vals, ...params);

    return { data: this.updateData, error: null };
  }

  _doDelete() {
    const { clause, params } = this._buildWhere();
    const sql = `DELETE FROM ${this.table} ${clause}`;
    this.db.prepare(sql).run(...params);
    return { data: null, error: null };
  }
}

export const supabase = {
  from: (table) => {
    const db = getGlobalDb();
    return new QueryBuilder(table, db);
  },
};
