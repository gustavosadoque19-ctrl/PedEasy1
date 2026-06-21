import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { initTenantDb, create } from './sqlite-store.js';
import { supabase } from './global-store.js';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const GLOBAL_DB = join(DATA_DIR, 'pedy-global.db');

async function seed() {
  if (existsSync(GLOBAL_DB)) {
    const { data: tenants } = await supabase.from('tenants').select('id');
    if (tenants && tenants.length > 0) {
      console.log('✅ Dados já existem no banco global. Pulando seed.');
      return;
    }
  }

  // Gera senha aleatória de 12 caracteres
  const seedPass = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
  const senhaHash = bcrypt.hashSync(seedPass, 12);

  console.log('📦 Inserindo dados iniciais...');

  const { data: tenant, error: e1 } = await supabase
    .from('tenants')
    .insert({ nome: 'Estabelecimento Padrão', slug: 'estabelecimento-padrao', plano: 'pro', status: 'active', config: '{}' })
    .select()
    .single();

  if (e1) { console.error('Erro ao criar tenant:', e1); return; }
  console.log(`  ✅ Tenant criado: id=${tenant.id}`);

  const TENANT_ID = String(tenant.id);

  const { error: e2 } = await supabase
    .from('tenant_users')
    .insert({ tenant_id: tenant.id, nome: 'Administrador', email: 'admin@pedy.com', senha: senhaHash, cargo: 'Gerente', permissao: 'admin', ativo: 1 });

  if (e2) { console.error('Erro ao criar usuário:', e2); return; }
  console.log(`  ✅ Usuário admin criado (admin@pedy.com / ${seedPass})`);

  initTenantDb(TENANT_ID);

  await create('funcionarios', { nome: 'Administrador', usuario: 'admin', senha: senhaHash, cargo: 'Gerente', telefone: '', email: 'admin@pedy.com', permissao: 'admin', ativo: 1 }, TENANT_ID);

  await create('produtos', { nome: 'Pizza Margherita', descricao: 'Molho, mussarela, manjericão', preco_venda: 35.90, preco_custo: 15, categoria: 'Pizzas', unidade: 'un', estoque_atual: 10, estoque_minimo: 3, ativo: 1 }, TENANT_ID);
  await create('produtos', { nome: 'Pizza Calabresa', descricao: 'Molho, mussarela, calabresa, cebola', preco_venda: 38.90, preco_custo: 16, categoria: 'Pizzas', unidade: 'un', estoque_atual: 8, estoque_minimo: 3, ativo: 1 }, TENANT_ID);
  await create('produtos', { nome: 'X-Burguer', descricao: 'Hambúrguer, queijo, alface, tomate', preco_venda: 22.50, preco_custo: 9, categoria: 'Hambúrgueres', unidade: 'un', estoque_atual: 15, estoque_minimo: 5, ativo: 1 }, TENANT_ID);
  await create('produtos', { nome: 'Coca-Cola 350ml', descricao: 'Refrigerante lata', preco_venda: 5.00, preco_custo: 2.50, categoria: 'Bebidas', unidade: 'un', estoque_atual: 50, estoque_minimo: 10, ativo: 1 }, TENANT_ID);
  await create('produtos', { nome: 'Suco de Laranja', descricao: 'Suco natural 500ml', preco_venda: 8.00, preco_custo: 3, categoria: 'Bebidas', unidade: 'un', estoque_atual: 20, estoque_minimo: 5, ativo: 1 }, TENANT_ID);

  await create('clientes', { nome: 'João Silva', telefone: '(11) 99999-0001', email: 'joao@email.com' }, TENANT_ID);
  await create('clientes', { nome: 'Maria Santos', telefone: '(11) 99999-0002', email: 'maria@email.com' }, TENANT_ID);
  await create('clientes', { nome: 'Carlos Oliveira', telefone: '(11) 99999-0003', email: 'carlos@email.com' }, TENANT_ID);

  console.log('✅ Dados iniciais inseridos!');
  console.log('   Email: admin@pedy.com / Senha: ' + seedPass);
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
