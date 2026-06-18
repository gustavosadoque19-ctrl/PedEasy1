/**
 * Teste de Isolamento Multi-Tenant (local, sem Docker)
 *
 * Simula 3 tenants usando SQLite, testa:
 *   - Isolamento de CREATE
 *   - Isolamento de READ
 *   - Isolamento de UPDATE
 *   - Isolamento de DELETE
 *   - Simulação de auto-provisionamento
 */

import { initTenantDb, create, getAll, getById, update, remove, query } from './sqlite-store.js';
import { existsSync, unlinkSync, rmSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

const ADMIN_HASH = '$2a$10$wVqxZeBJaW9wff.oV3EjCuwKdTtF9MGBfxfjupO50MmOTZygyuDH2';

let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    errors.push(message);
    console.log(`  ❌ ${message}`);
  }
}

async function cleanDbFiles() {
  if (existsSync(DATA_DIR)) {
    const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.db'));
    for (const f of files) {
      unlinkSync(join(DATA_DIR, f));
    }
  }
}

async function seedTenant(id, nome, slug, email, produtos, clientes) {
  initTenantDb(id);

  await create('tenant_config', {
    tenant_id: id, nome, slug, plano: 'pro', status: 'active',
  }, id);

  await create('tenant_users', {
    nome: 'Administrador', email, senha: ADMIN_HASH,
    cargo: 'Administrador', permissao: 'admin', ativo: 1,
  }, id);

  for (const p of produtos) {
    await create('produtos', p, id);
  }
  for (const c of clientes) {
    await create('clientes', c, id);
  }
}

// =====================================================
console.log('============================================');
console.log('  TESTE DE ISOLAMENTO MULTI-TENANT (SQLite)');
console.log('============================================\n');

// Limpar dados anteriores
console.log('>>> Limpando dados de testes anteriores...');
await cleanDbFiles();
console.log('  OK\n');

// === FASE 1: SEED ===
console.log('=== FASE 1: Populando tenants ===\n');

await seedTenant('alfa', 'Restaurante Alfa', 'restaurante-alfa', 'admin@alfa.com', [
  { nome: 'Pizza Margherita', preco_venda: 35.90, categoria: 'Pizzas', ativo: 1 },
  { nome: 'Pizza Calabresa', preco_venda: 38.90, categoria: 'Pizzas', ativo: 1 },
], [
  { nome: 'João Silva', telefone: '(11) 99999-0001' },
]);
console.log('  🌱 Alfa: 2 produtos, 1 cliente\n');

await seedTenant('beta', 'Restaurante Beta', 'restaurante-beta', 'admin@beta.com', [
  { nome: 'Sushi Especial', preco_venda: 45.00, categoria: 'Japonesa', ativo: 1 },
  { nome: 'Tempurá', preco_venda: 32.00, categoria: 'Japonesa', ativo: 1 },
  { nome: 'Yakisoba', preco_venda: 28.00, categoria: 'Japonesa', ativo: 1 },
], [
  { nome: 'Maria Santos', telefone: '(11) 99999-0002' },
]);
console.log('  🌱 Beta: 3 produtos, 1 cliente\n');

await seedTenant('gama', 'Restaurante Gama', 'restaurante-gama', 'admin@gama.com', [
  { nome: 'Hambúrguer Artesanal', preco_venda: 28.00, categoria: 'Hambúrgueres', ativo: 1 },
  { nome: 'Batata Frita', preco_venda: 15.00, categoria: 'Porções', ativo: 1 },
  { nome: 'Milk Shake', preco_venda: 18.00, categoria: 'Bebidas', ativo: 1 },
  { nome: 'X-Salada', preco_venda: 25.00, categoria: 'Hambúrgueres', ativo: 1 },
  { nome: 'Onion Rings', preco_venda: 12.00, categoria: 'Porções', ativo: 1 },
], [
  { nome: 'Carlos Oliveira', telefone: '(11) 99999-0003' },
  { nome: 'Pedro Alves', telefone: '(11) 99999-0005' },
]);
console.log('  🌱 Gama: 5 produtos, 2 clientes\n');

// === FASE 2: TESTE DE ISOLAMENTO DE LEITURA ===
console.log('=== FASE 2: Isolamento de Leitura ===\n');

const prodAlfa = await getAll('produtos', 'alfa');
const prodBeta = await getAll('produtos', 'beta');
const prodGama = await getAll('produtos', 'gama');

// Cada tenant só vê seus próprios produtos
for (const p of prodAlfa) {
  assert(!p.nome.includes('Sushi'), `Alfa não deve ver sushi (viu: ${p.nome})`);
  assert(!p.nome.includes('Hambúrguer'), `Alfa não deve ver hambúrguer (viu: ${p.nome})`);
}
assert(prodAlfa.length === 2, `Alfa deve ter 2 produtos (tem ${prodAlfa.length})`);
console.log(`     Alfa vê: ${prodAlfa.map(p => p.nome).join(', ')}\n`);

for (const p of prodBeta) {
  assert(!p.nome.includes('Pizza'), `Beta não deve ver pizza (viu: ${p.nome})`);
  assert(!p.nome.includes('Hambúrguer'), `Beta não deve ver hambúrguer (viu: ${p.nome})`);
}
assert(prodBeta.length === 3, `Beta deve ter 3 produtos (tem ${prodBeta.length})`);
console.log(`     Beta vê: ${prodBeta.map(p => p.nome).join(', ')}\n`);

for (const p of prodGama) {
  assert(!p.nome.includes('Pizza'), `Gama não deve ver pizza (viu: ${p.nome})`);
  assert(!p.nome.includes('Sushi'), `Gama não deve ver sushi (viu: ${p.nome})`);
}
assert(prodGama.length === 5, `Gama deve ter 5 produtos (tem ${prodGama.length})`);
console.log(`     Gama vê: ${prodGama.map(p => p.nome).join(', ')}\n`);

// === FASE 3: TESTE DE ISOLAMENTO DE CRIAÇÃO ===
console.log('=== FASE 3: Isolamento de Criação ===\n');

// Criar produto com mesmo nome em tenants diferentes
const novoAlfa = await create('produtos', { nome: 'Produto Único Alfa', preco_venda: 50 }, 'alfa');
assert(novoAlfa?.id > 0, `Alfa: produto criado com id ${novoAlfa?.id}`);

const novoBeta = await create('produtos', { nome: 'Produto Único Beta', preco_venda: 60 }, 'beta');
assert(novoBeta?.id > 0, `Beta: produto criado com id ${novoBeta?.id}`);

// Verificar que cada um só vê o seu
const alfaAfter = await getAll('produtos', 'alfa');
const betaAfter = await getAll('produtos', 'beta');

assert(alfaAfter.some(p => p.nome === 'Produto Único Alfa'), 'Alfa deve ver seu novo produto');
assert(!alfaAfter.some(p => p.nome === 'Produto Único Beta'), 'Alfa NÃO deve ver produto do Beta');
assert(alfaAfter.length === 3, `Alfa deve ter 3 produtos (tem ${alfaAfter.length})`);

assert(betaAfter.some(p => p.nome === 'Produto Único Beta'), 'Beta deve ver seu novo produto');
assert(!betaAfter.some(p => p.nome === 'Produto Único Alfa'), 'Beta NÃO deve ver produto do Alfa');
assert(betaAfter.length === 4, `Beta deve ter 4 produtos (tem ${betaAfter.length})`);

console.log('');

// === FASE 4: TESTE DE ISOLAMENTO DE ATUALIZAÇÃO ===
console.log('=== FASE 4: Isolamento de Atualização ===\n');

const firstAlfaProd = alfaAfter[0];
const updated = await update('produtos', firstAlfaProd.id, { preco_venda: 999.99 }, 'alfa');
assert(updated.preco_venda === 999.99, `Alfa: produto ${firstAlfaProd.id} atualizado para R$999,99`);

// Beta não deve ter sido afetado
const betaProdCheck = await getById('produtos', 1, 'beta');
assert(betaProdCheck === null || betaProdCheck.preco_venda !== 999.99,
  `Beta: produto id=1 não deve ter preço alterado (R$${betaProdCheck?.preco_venda})`);

// Verificar que o ID 1 no Alfa não é o mesmo que ID 1 no Beta
const alfaProd1 = await getById('produtos', 1, 'alfa');
const betaProd1 = await getById('produtos', 1, 'beta');
assert(alfaProd1 !== null, 'Alfa tem produto com id=1');
// Beta pode ou não ter id=1, depende da sequência de inserção
// O importante é que os dados não se misturam
console.log('');

// === FASE 5: TESTE DE ISOLAMENTO DE DELETE ===
console.log('=== FASE 5: Isolamento de Deleção ===\n');

// Deletar primeiro produto do Gama
const gamaProds = await getAll('produtos', 'gama');
const deletedId = gamaProds[0].id;
await remove('produtos', deletedId, 'gama');

const gamaAfterDelete = await getAll('produtos', 'gama');
assert(gamaAfterDelete.length === 4, `Gama deve ter 4 produtos após deleção (tem ${gamaAfterDelete.length})`);

// Alfa e Beta não devem ser afetados
const alfaCount = (await getAll('produtos', 'alfa')).length;
const betaCount = (await getAll('produtos', 'beta')).length;
assert(alfaCount === 3, `Alfa não foi afetado pela deleção do Gama (tem ${alfaCount})`);
assert(betaCount === 4, `Beta não foi afetado pela deleção do Gama (tem ${betaCount})`);

console.log('');

// === FASE 6: TESTE DE ISOLAMENTO DE CLIENTES ===
console.log('=== FASE 6: Isolamento de Clientes ===\n');

const clientesAlfa = await getAll('clientes', 'alfa');
const clientesBeta = await getAll('clientes', 'beta');
const clientesGama = await getAll('clientes', 'gama');

assert(clientesAlfa.length === 1, `Alfa tem 1 cliente (tem ${clientesAlfa.length})`);
assert(clientesAlfa[0].nome === 'João Silva', 'Alfa: cliente é João Silva');

assert(clientesBeta.length === 1, `Beta tem 1 cliente (tem ${clientesBeta.length})`);
assert(clientesBeta[0].nome === 'Maria Santos', 'Beta: cliente é Maria Santos');

assert(clientesGama.length === 2, `Gama tem 2 clientes (tem ${clientesGama.length})`);

// Verificar que não há cruzamento
const todosClientes = [...clientesAlfa, ...clientesBeta, ...clientesGama];
const nomes = todosClientes.map(c => c.nome);
assert(new Set(nomes).size === nomes.length, 'Nenhum cliente duplicado entre tenants');

console.log('');

// === FASE 7: SIMULAÇÃO DE AUTO-PROVISIONAMENTO ===
console.log('=== FASE 7: Simulação de Auto-Provisionamento ===\n');

console.log('>>> Provisionando novo tenant "Restaurante Delta"...');
initTenantDb('delta');
await create('tenant_config', {
  tenant_id: 'delta', nome: 'Restaurante Delta', slug: 'restaurante-delta',
  plano: 'trial', status: 'trial',
}, 'delta');
await create('tenant_users', {
  nome: 'Admin Delta', email: 'admin@delta.com', senha: ADMIN_HASH,
  cargo: 'Administrador', permissao: 'admin', ativo: 1,
}, 'delta');
await create('produtos', { nome: 'Combo Inicial Delta', preco_venda: 29.90 }, 'delta');
console.log('  ✅ Delta provisionado com 1 produto\n');

// Verificar que Delta não interfere nos outros
const prodAlfaAfterProvision = await getAll('produtos', 'alfa');
assert(prodAlfaAfterProvision.length === 3,
  `Alfa não foi afetado pelo provisionamento do Delta (tem ${prodAlfaAfterProvision.length})`);

// Verificar dados do Delta
const prodDelta = await getAll('produtos', 'delta');
assert(prodDelta.length === 1, `Delta tem 1 produto (tem ${prodDelta.length})`);
assert(prodDelta[0].nome === 'Combo Inicial Delta', 'Delta: produto é "Combo Inicial Delta"');

const configDelta = await getAll('tenant_config', 'delta');
assert(configDelta.length === 1, 'Delta tem config');
assert(configDelta[0].status === 'trial', 'Delta está em trial');

console.log('');

// === RESULTADO ===
console.log('============================================');
console.log('  RESULTADO FINAL');
console.log('============================================\n');
console.log(`  Total de testes : ${passed + failed}`);
console.log(`  Passaram        : ${passed}`);
console.log(`  Falharam        : ${failed}`);

if (failed > 0) {
  console.log('\n  Erros:');
  for (const err of errors) {
    console.log(`    - ${err}`);
  }
}

const databases = readdirSync(DATA_DIR).filter(f => f.endsWith('.db'));
console.log(`\n  Arquivos SQLite criados: ${databases.join(', ')}`);

console.log(`\n  ${failed === 0 ? '🎉 TODOS OS TESTES PASSARAM!' : '❌ HOUVE FALHAS!'}`);
console.log('');

process.exit(failed > 0 ? 1 : 0);
