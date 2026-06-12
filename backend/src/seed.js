import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const senhaHash = bcrypt.hashSync('admin', 10);

const funcionarios = [
  {
    id: 1,
    nome: 'Administrador',
    usuario: 'admin',
    senha: senhaHash,
    cargo: 'Gerente',
    telefone: '',
    email: 'admin@pedy.com',
    permissao: 'admin',
    ativo: true,
    createdAt: new Date().toISOString(),
  },
];

writeFileSync(join(DATA_DIR, 'funcionarios.json'), JSON.stringify(funcionarios, null, 2));
writeFileSync(join(DATA_DIR, 'produtos.json'), JSON.stringify([
  { id: 1, nome: 'Pizza Margherita', descricao: 'Molho, mussarela, manjericão', preco_venda: 35.90, preco_custo: 15, categoria: 'Pizzas', unidade: 'un', estoque_atual: 10, estoque_minimo: 3, adicionais_ids: [1,2,3,4,5,6], max_adicionais: 3, ativo: true, createdAt: new Date().toISOString() },
  { id: 2, nome: 'Pizza Calabresa', descricao: 'Molho, mussarela, calabresa, cebola', preco_venda: 38.90, preco_custo: 16, categoria: 'Pizzas', unidade: 'un', estoque_atual: 8, estoque_minimo: 3, adicionais_ids: [1,2,3,4,5,6], max_adicionais: 3, ativo: true, createdAt: new Date().toISOString() },
  { id: 3, nome: 'X-Burguer', descricao: 'Hambúrguer, queijo, alface, tomate', preco_venda: 22.50, preco_custo: 9, categoria: 'Hambúrgueres', unidade: 'un', estoque_atual: 15, estoque_minimo: 5, adicionais_ids: [4,5], max_adicionais: 2, ativo: true, createdAt: new Date().toISOString() },
  { id: 4, nome: 'X-Salada', descricao: 'Hambúrguer, queijo, alface, tomate, maionese', preco_venda: 25.00, preco_custo: 10, categoria: 'Hambúrgueres', unidade: 'un', estoque_atual: 12, estoque_minimo: 5, adicionais_ids: [4,5], max_adicionais: 2, ativo: true, createdAt: new Date().toISOString() },
  { id: 5, nome: 'Coca-Cola 350ml', descricao: 'Refrigerante lata', preco_venda: 5.00, preco_custo: 2.50, categoria: 'Bebidas', unidade: 'un', estoque_atual: 50, estoque_minimo: 10, ativo: true, createdAt: new Date().toISOString() },
  { id: 6, nome: 'Suco de Laranja', descricao: 'Suco natural 500ml', preco_venda: 8.00, preco_custo: 3, categoria: 'Bebidas', unidade: 'un', estoque_atual: 20, estoque_minimo: 5, ativo: true, createdAt: new Date().toISOString() },
  { id: 7, nome: 'Batata Frita', descricao: 'Porção 300g', preco_venda: 15.00, preco_custo: 5, categoria: 'Porções', unidade: 'porcao', estoque_atual: 25, estoque_minimo: 5, ativo: true, createdAt: new Date().toISOString() },
  { id: 8, nome: 'Frango a Passarinho', descricao: 'Porção 500g', preco_venda: 28.00, preco_custo: 12, categoria: 'Porções', unidade: 'porcao', estoque_atual: 10, estoque_minimo: 3, ativo: true, createdAt: new Date().toISOString() },
], null, 2));
writeFileSync(join(DATA_DIR, 'clientes.json'), JSON.stringify([
  { id: 1, nome: 'João Silva', telefone: '(11) 99999-0001', email: 'joao@email.com', endereco: 'Rua A, 123', createdAt: new Date().toISOString() },
  { id: 2, nome: 'Maria Santos', telefone: '(11) 99999-0002', email: 'maria@email.com', endereco: 'Rua B, 456', createdAt: new Date().toISOString() },
  { id: 3, nome: 'Carlos Oliveira', telefone: '(11) 99999-0003', email: 'carlos@email.com', endereco: 'Rua C, 789', createdAt: new Date().toISOString() },
], null, 2));
writeFileSync(join(DATA_DIR, 'pedidos.json'), JSON.stringify([
  { id: 1, mesa: 5, status: 'preparando', valor_total: 35.90, itens: [{ produto_id: 1, produto_nome: 'Pizza Margherita', quantidade: 1, preco_unitario: 35.90 }], cliente_nome: 'João Silva', cliente_telefone: '(11) 99999-0001', forma_pagamento: 'dinheiro', observacao: '', criadoEm: new Date(Date.now() - 45 * 60000).toISOString(), updatedAt: new Date(Date.now() - 30 * 60000).toISOString(), createdAt: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: 2, mesa: 3, status: 'entregue', valor_total: 47.50, itens: [{ produto_id: 3, produto_nome: 'X-Burguer', quantidade: 1, preco_unitario: 22.50 }, { produto_id: 5, produto_nome: 'Coca-Cola 350ml', quantidade: 1, preco_unitario: 5.00 }], cliente_nome: 'Maria Santos', cliente_telefone: '(11) 99999-0002', forma_pagamento: 'credito', observacao: 'Sem cebola', criadoEm: new Date(Date.now() - 120 * 60000).toISOString(), updatedAt: new Date(Date.now() - 60 * 60000).toISOString(), createdAt: new Date(Date.now() - 120 * 60000).toISOString() },
], null, 2));
writeFileSync(join(DATA_DIR, 'nfe.json'), JSON.stringify([], null, 2));
writeFileSync(join(DATA_DIR, 'caixa.json'), JSON.stringify([], null, 2));
writeFileSync(join(DATA_DIR, 'estoque.json'), JSON.stringify([], null, 2));
writeFileSync(join(DATA_DIR, 'relatorios.json'), JSON.stringify([], null, 2));
writeFileSync(join(DATA_DIR, 'categorias-adicionais.json'), JSON.stringify([
  { id: 1, nome: 'Bordas', ativo: true, createdAt: new Date().toISOString() },
  { id: 2, nome: 'Complementos', ativo: true, createdAt: new Date().toISOString() },
  { id: 3, nome: 'Bebidas Extras', ativo: true, createdAt: new Date().toISOString() },
], null, 2));
writeFileSync(join(DATA_DIR, 'adicionais.json'), JSON.stringify([
  { id: 1, nome: 'Borda Recheada', preco: 5.00, categoria_id: 1, ativo: true, createdAt: new Date().toISOString() },
  { id: 2, nome: 'Borda de Catupiry', preco: 6.00, categoria_id: 1, ativo: true, createdAt: new Date().toISOString() },
  { id: 3, nome: 'Borda de Cheddar', preco: 6.00, categoria_id: 1, ativo: true, createdAt: new Date().toISOString() },
  { id: 4, nome: 'Extra Queijo', preco: 3.00, categoria_id: 2, ativo: true, createdAt: new Date().toISOString() },
  { id: 5, nome: 'Bacon Extra', preco: 4.00, categoria_id: 2, ativo: true, createdAt: new Date().toISOString() },
  { id: 6, nome: 'Calabresa Extra', preco: 3.50, categoria_id: 2, ativo: true, createdAt: new Date().toISOString() },
  { id: 7, nome: 'Refrigerante Lata', preco: 5.00, categoria_id: 3, ativo: true, createdAt: new Date().toISOString() },
  { id: 8, nome: 'Suco Natural', preco: 8.00, categoria_id: 3, ativo: true, createdAt: new Date().toISOString() },
], null, 2));

console.log('✅ Dados iniciais criados em backend/data/');
console.log('   Usuário: admin / Senha: admin');
