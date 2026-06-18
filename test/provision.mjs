import { initTenantDb, create } from './sqlite-store.js';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const ADMIN_HASH = '$2a$10$wVqxZeBJaW9wff.oV3EjCuwKdTtF9MGBfxfjupO50MmOTZygyuDH2';
const COMPOSE_PATH = 'docker-compose.test.yml';

const usedPorts = new Set();

function nextPort() {
  let port = 3100;
  while (usedPorts.has(port)) port++;
  usedPorts.add(port);
  return port;
}

async function provisionTenant(nome, slug, email) {
  const tenantId = slug.replace(/[^a-z0-9]/g, '-').replace(/^-+|-+$/g, '').slice(0, 20);

  console.log(`\n========================================`);
  console.log(`Provisionando: ${nome}`);
  console.log(`  Tenant ID : ${tenantId}`);
  console.log(`  Slug      : ${slug}`);
  console.log(`  Email     : ${email}`);

  const port = nextPort();

  // 1. Inicializa banco SQLite
  initTenantDb(tenantId);

  // 2. Popula dados iniciais
  await create('tenant_config', {
    tenant_id: tenantId,
    nome,
    slug,
    plano: 'trial',
    status: 'trial',
  }, tenantId);

  await create('tenant_users', {
    nome: 'Administrador',
    email,
    senha: ADMIN_HASH,
    cargo: 'Administrador',
    permissao: 'admin',
    ativo: 1,
  }, tenantId);

  await create('produtos', { nome: 'Produto Padrão', preco_venda: 10.00, categoria: 'Geral', ativo: 1 }, tenantId);
  await create('clientes', { nome: 'Cliente Inicial', telefone: '(00) 00000-0000' }, tenantId);

  console.log(`  ✅ Banco criado e populado`);

  // 3. Gera snippet docker-compose
  const snippet = `
  backend-${tenantId}:
    build:
      context: .
      dockerfile: test/Dockerfile.test
    ports:
      - "${port}:3000"
    environment:
      - NODE_ENV=test
      - TEST_TENANT_ID=${tenantId}
      - JWT_SECRET=secret-${tenantId}-$(Date.now())
      - SUPABASE_URL=https://test.supabase.co
      - SUPABASE_ANON_KEY=test-anon-key
      - SUPABASE_SERVICE_ROLE_KEY=test-service-key
      - CORS_ORIGIN=*
    volumes:
      - data-${tenantId}:/app/data
    restart: unless-stopped

volumes:
  data-${tenantId}:
`;

  // 4. Adiciona ao docker-compose
  let compose = readFileSync(COMPOSE_PATH, 'utf-8');

  // Check se já existe volume para esse tenant
  if (compose.includes(`data-${tenantId}:`)) {
    console.log(`  ⚠️  Tenant ${tenantId} já existe no docker-compose`);
  } else {
    compose += snippet;
    writeFileSync(COMPOSE_PATH, compose);
    console.log(`  ✅ Adicionado ao docker-compose.test.yml`);
  }

  console.log(`  🚀 Porta: ${port}`);
  console.log(`  Para subir: docker compose -f ${COMPOSE_PATH} up -d backend-${tenantId}`);
  console.log(`  Para testar: curl http://localhost:${port}/api/produtos`);

  return { tenantId, port };
}

// --- CLI ---
const args = process.argv.slice(2);

if (args.length >= 2) {
  const nome = args[0];
  const slug = args[1];
  const email = args[2] || `admin@${slug}.com`;
  provisionTenant(nome, slug, email).catch(err => {
    console.error('Erro:', err);
    process.exit(1);
  });
} else {
  console.log('Uso: node test/provision.mjs "Nome do Tenant" "slug-do-tenant" [email]');
  console.log('');
  console.log('Exemplo:');
  console.log('  node test/provision.mjs "Restaurante Delta" "restaurante-delta" admin@delta.com');
  console.log('');
  console.log('Ou execute provisionamento em lote:');
  console.log('  node test/provision.mjs batch');

  if (args[0] === 'batch') {
    const batch = [
      { nome: 'Restaurante Delta', slug: 'restaurante-delta', email: 'admin@delta.com' },
      { nome: 'Restaurante Épsilon', slug: 'restaurante-epsilon', email: 'admin@epsilon.com' },
      { nome: 'Restaurante Zeta', slug: 'restaurante-zeta', email: 'admin@zeta.com' },
    ];

    const results = await Promise.all(batch.map(t => provisionTenant(t.nome, t.slug, t.email)));
    console.log(`\n=== ${results.length} tenants provisionados com sucesso! ===`);
  }
}
