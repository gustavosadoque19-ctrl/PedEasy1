import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const GLOBAL_DB_PATH = join(DATA_DIR, 'pedy-global.db');

const TEST_TENANT_ID = process.env.TEST_TENANT_ID || '1';

const ADMIN_HASH = '$2a$10$wVqxZeBJaW9wff.oV3EjCuwKdTtF9MGBfxfjupO50MmOTZygyuDH2';

const tenantsData = {
  '1': { nome: 'Restaurante Alfa', slug: 'restaurante-alfa', email: 'admin@alfa.com' },
  '2': { nome: 'Restaurante Beta', slug: 'restaurante-beta', email: 'admin@beta.com' },
  '3': { nome: 'Restaurante Gama', slug: 'restaurante-gama', email: 'admin@gama.com' },
};

function init() {
  const db = new Database(GLOBAL_DB_PATH);
  db.pragma('journal_mode = WAL');

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

  const info = tenantsData[TEST_TENANT_ID];
  if (!info) {
    console.log(`[init-global-db] Nenhum dado para tenant ${TEST_TENANT_ID}, OK.`);
    db.close();
    return;
  }

  const existing = db.prepare('SELECT id FROM tenants WHERE id = ?').get(parseInt(TEST_TENANT_ID));
  if (existing) {
    console.log(`[init-global-db] Tenant ${TEST_TENANT_ID} já existe no banco global`);
    db.close();
    return;
  }

  console.log(`[init-global-db] Criando tenant ${TEST_TENANT_ID} (${info.nome})...`);

  db.prepare(`INSERT INTO tenants (id, nome, slug, plano, status, trial_ends_at, config)
    VALUES (?, ?, ?, 'pro', 'active', datetime('now', '+30 days'), '{}')`)
    .run(parseInt(TEST_TENANT_ID), info.nome, info.slug);

  db.prepare(`INSERT INTO tenant_users (tenant_id, nome, email, senha, cargo, permissao, ativo)
    VALUES (?, 'Administrador', ?, ?, 'Administrador', 'admin', 1)`)
    .run(parseInt(TEST_TENANT_ID), info.email, ADMIN_HASH);

  // Plan limits
  const hasPlans = db.prepare('SELECT id FROM tenant_plan_limits LIMIT 1').get();
  if (!hasPlans) {
    db.prepare(`INSERT INTO tenant_plan_limits (plano, nfe, whatsapp_bot, relatorios_avancados, max_funcionarios, max_pedidos_mes, integrations)
      VALUES ('free', 0, 0, 0, 5, 0, 0)`).run();
    db.prepare(`INSERT INTO tenant_plan_limits (plano, nfe, whatsapp_bot, relatorios_avancados, max_funcionarios, max_pedidos_mes, integrations)
      VALUES ('pro', 1, 1, 1, 20, 0, 1)`).run();
    db.prepare(`INSERT INTO tenant_plan_limits (plano, nfe, whatsapp_bot, relatorios_avancados, max_funcionarios, max_pedidos_mes, integrations)
      VALUES ('enterprise', 1, 1, 1, 999, 0, 1)`).run();
  }

  db.close();
  console.log(`[init-global-db] Tenant ${TEST_TENANT_ID} inicializado com sucesso`);
}

init();
