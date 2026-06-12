import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function getCount(table) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) return -1;
  return count;
}

async function seed() {
  const senhaHash = bcrypt.hashSync('admin', 10);

  const count = await getCount('funcionarios');
  if (count > 0) {
    console.log('✅ Dados já existem no Supabase. Pulando seed.');
    return;
  }

  console.log('📦 Inserindo dados iniciais...');

  const { error: e1 } = await supabase.from('funcionarios').insert({
    data: {
      nome: 'Administrador', usuario: 'admin', senha: senhaHash,
      cargo: 'Gerente', telefone: '', email: 'admin@pedy.com',
      permissao: 'admin', ativo: true,
    },
  });
  if (e1) throw e1;

  await supabase.from('produtos').insert([
    { data: { nome: 'Pizza Margherita', descricao: 'Molho, mussarela, manjericão', preco_venda: 35.90, preco_custo: 15, categoria: 'Pizzas', unidade: 'un', estoque_atual: 10, estoque_minimo: 3, adicionais_ids: [1,2,3,4,5,6], max_adicionais: 3, ativo: true } },
    { data: { nome: 'Pizza Calabresa', descricao: 'Molho, mussarela, calabresa, cebola', preco_venda: 38.90, preco_custo: 16, categoria: 'Pizzas', unidade: 'un', estoque_atual: 8, estoque_minimo: 3, adicionais_ids: [1,2,3,4,5,6], max_adicionais: 3, ativo: true } },
    { data: { nome: 'X-Burguer', descricao: 'Hambúrguer, queijo, alface, tomate', preco_venda: 22.50, preco_custo: 9, categoria: 'Hambúrgueres', unidade: 'un', estoque_atual: 15, estoque_minimo: 5, adicionais_ids: [4,5], max_adicionais: 2, ativo: true } },
    { data: { nome: 'X-Salada', descricao: 'Hambúrguer, queijo, alface, tomate, maionese', preco_venda: 25.00, preco_custo: 10, categoria: 'Hambúrgueres', unidade: 'un', estoque_atual: 12, estoque_minimo: 5, adicionais_ids: [4,5], max_adicionais: 2, ativo: true } },
    { data: { nome: 'Coca-Cola 350ml', descricao: 'Refrigerante lata', preco_venda: 5.00, preco_custo: 2.50, categoria: 'Bebidas', unidade: 'un', estoque_atual: 50, estoque_minimo: 10, ativo: true } },
    { data: { nome: 'Suco de Laranja', descricao: 'Suco natural 500ml', preco_venda: 8.00, preco_custo: 3, categoria: 'Bebidas', unidade: 'un', estoque_atual: 20, estoque_minimo: 5, ativo: true } },
    { data: { nome: 'Batata Frita', descricao: 'Porção 300g', preco_venda: 15.00, preco_custo: 5, categoria: 'Porções', unidade: 'porcao', estoque_atual: 25, estoque_minimo: 5, ativo: true } },
    { data: { nome: 'Frango a Passarinho', descricao: 'Porção 500g', preco_venda: 28.00, preco_custo: 12, categoria: 'Porções', unidade: 'porcao', estoque_atual: 10, estoque_minimo: 3, ativo: true } },
  ]);

  await supabase.from('clientes').insert([
    { data: { nome: 'João Silva', telefone: '(11) 99999-0001', email: 'joao@email.com', endereco: 'Rua A, 123' } },
    { data: { nome: 'Maria Santos', telefone: '(11) 99999-0002', email: 'maria@email.com', endereco: 'Rua B, 456' } },
    { data: { nome: 'Carlos Oliveira', telefone: '(11) 99999-0003', email: 'carlos@email.com', endereco: 'Rua C, 789' } },
  ]);

  await supabase.from('categorias_adicionais').insert([
    { data: { nome: 'Bordas', ativo: true } },
    { data: { nome: 'Complementos', ativo: true } },
    { data: { nome: 'Bebidas Extras', ativo: true } },
  ]);

  await supabase.from('adicionais').insert([
    { data: { nome: 'Borda Recheada', preco: 5.00, categoria_id: 1, ativo: true } },
    { data: { nome: 'Borda de Catupiry', preco: 6.00, categoria_id: 1, ativo: true } },
    { data: { nome: 'Borda de Cheddar', preco: 6.00, categoria_id: 1, ativo: true } },
    { data: { nome: 'Extra Queijo', preco: 3.00, categoria_id: 2, ativo: true } },
    { data: { nome: 'Bacon Extra', preco: 4.00, categoria_id: 2, ativo: true } },
    { data: { nome: 'Calabresa Extra', preco: 3.50, categoria_id: 2, ativo: true } },
    { data: { nome: 'Refrigerante Lata', preco: 5.00, categoria_id: 3, ativo: true } },
    { data: { nome: 'Suco Natural', preco: 8.00, categoria_id: 3, ativo: true } },
  ]);

  console.log('✅ Dados iniciais inseridos no Supabase!');
  console.log('   Usuário: admin / Senha: admin');
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
