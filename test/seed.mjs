import { initTenantDb, create } from './sqlite-store.js';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

const ADMIN_HASH = '$2a$10$wVqxZeBJaW9wff.oV3EjCuwKdTtF9MGBfxfjupO50MmOTZygyuDH2';

const tenants = [
  {
    id: '1',
    nome: 'Restaurante Alfa',
    slug: 'restaurante-alfa',
    email: 'admin@alfa.com',
    produtos: [
      { nome: 'Pizza Margherita', preco_venda: 35.90, categoria: 'Pizzas', ativo: 1 },
      { nome: 'Pizza Calabresa', preco_venda: 38.90, categoria: 'Pizzas', ativo: 1 },
      { nome: 'Coca-Cola 350ml', preco_venda: 5.00, categoria: 'Bebidas', ativo: 1 },
      { nome: 'Suco de Laranja', preco_venda: 8.00, categoria: 'Bebidas', ativo: 1 },
    ],
    clientes: [
      { nome: 'João Silva', telefone: '(11) 99999-0001' },
      { nome: 'Ana Costa', telefone: '(11) 99999-0004' },
    ],
  },
  {
    id: '2',
    slug: 'restaurante-beta',
    nome: 'Restaurante Beta',
    email: 'admin@beta.com',
    produtos: [
      { nome: 'Sushi Especial', preco_venda: 45.00, categoria: 'Japonesa', ativo: 1 },
      { nome: 'Tempurá', preco_venda: 32.00, categoria: 'Japonesa', ativo: 1 },
      { nome: 'Yakisoba', preco_venda: 28.00, categoria: 'Japonesa', ativo: 1 },
    ],
    clientes: [
      { nome: 'Maria Santos', telefone: '(11) 99999-0002' },
    ],
  },
  {
    id: '3',
    slug: 'restaurante-gama',
    nome: 'Restaurante Gama',
    email: 'admin@gama.com',
    produtos: [
      { nome: 'Hambúrguer Artesanal', preco_venda: 28.00, categoria: 'Hambúrgueres', ativo: 1 },
      { nome: 'Batata Frita', preco_venda: 15.00, categoria: 'Porções', ativo: 1 },
      { nome: 'Milk Shake', preco_venda: 18.00, categoria: 'Bebidas', ativo: 1 },
      { nome: 'X-Salada', preco_venda: 25.00, categoria: 'Hambúrgueres', ativo: 1 },
      { nome: 'Onion Rings', preco_venda: 12.00, categoria: 'Porções', ativo: 1 },
    ],
    clientes: [
      { nome: 'Carlos Oliveira', telefone: '(11) 99999-0003' },
      { nome: 'Pedro Alves', telefone: '(11) 99999-0005' },
      { nome: 'Lucia Mendes', telefone: '(11) 99999-0006' },
    ],
  },
];

async function seed() {
  console.log('=== Seed Multi-Tenant SQLite ===\n');

  for (const t of tenants) {
    const dbPath = join(DATA_DIR, `tenant-${t.id}.db`);
    if (existsSync(dbPath)) {
      console.log(`⏭️  Tenant ${t.id} (${t.nome}): banco já existe, pulando`);
      continue;
    }

    console.log(`🌱 Populando tenant ${t.id}: ${t.nome}...`);
    initTenantDb(t.id);

    await create('tenant_config', {
      tenant_id: t.id,
      nome: t.nome,
      slug: t.slug,
      plano: 'pro',
      status: 'active',
    }, t.id);

    await create('tenant_users', {
      nome: 'Administrador',
      email: t.email,
      senha: ADMIN_HASH,
      cargo: 'Administrador',
      permissao: 'admin',
      ativo: 1,
    }, t.id);

    for (const produto of t.produtos) {
      await create('produtos', produto, t.id);
    }

    for (const cliente of t.clientes) {
      await create('clientes', cliente, t.id);
    }

    console.log(`  ✅ ${t.nome}: ${t.produtos.length} produtos, ${t.clientes.length} clientes`);
  }

  console.log('\n✅ Seed concluído!');
  console.log('   Credenciais de login: admin@alfa.com / admin');
  console.log(`   Dados em: ${DATA_DIR}`);
}

seed().catch(err => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
