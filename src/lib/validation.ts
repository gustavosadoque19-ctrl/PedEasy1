import { z } from 'zod';

export const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200, 'Máximo 200 caracteres'),
  descricao: z.string().max(500, 'Máximo 500 caracteres').optional().default(''),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  preco_venda: z.string().min(1, 'Preço de venda é obrigatório').refine((v) => parseFloat(v) > 0, 'Preço deve ser maior que zero'),
  preco_custo: z.string().optional().default(''),
  unidade: z.string().optional().default('un'),
  ncm: z.string().max(8, 'Máximo 8 caracteres').optional().default(''),
  estoque_atual: z.string().optional().default(''),
  estoque_minimo: z.string().optional().default(''),
  ativo: z.boolean(),
  adicionais_ids: z.array(z.number()).optional().default([]),
  max_adicionais: z.number().optional().default(0),
});

export type ProdutoFormData = z.infer<typeof produtoSchema>;

export const clienteSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200, 'Máximo 200 caracteres'),
  documento: z.string().max(20, 'Máximo 20 caracteres').optional().default(''),
  telefone: z.string().max(20, 'Máximo 20 caracteres').optional().default(''),
  email: z.string().email('Email inválido').optional().or(z.literal('')).default(''),
  endereco: z.string().max(300, 'Máximo 300 caracteres').optional().default(''),
  observacao: z.string().max(500, 'Máximo 500 caracteres').optional().default(''),
  ativo: z.boolean(),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;

export const funcionarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200, 'Máximo 200 caracteres'),
  usuario: z.string().min(1, 'Usuário é obrigatório').max(50, 'Máximo 50 caracteres'),
  senha: z.string().optional().default(''),
  cargo: z.string().max(100, 'Máximo 100 caracteres').optional().default(''),
  telefone: z.string().max(20, 'Máximo 20 caracteres').optional().default(''),
  email: z.string().email('Email inválido').optional().or(z.literal('')).default(''),
  permissao: z.string().optional().default('operador'),
  ativo: z.boolean(),
});

export type FuncionarioFormData = z.infer<typeof funcionarioSchema>;

export const pedidoItemSchema = z.object({
  produto_id: z.number().min(1, 'Selecione um produto'),
  produto_nome: z.string().optional().default(''),
  quantidade: z.number().min(0.01, 'Quantidade deve ser maior que zero'),
  preco_unitario: z.number().min(0, 'Preço não pode ser negativo'),
  total: z.number().optional().default(0),
  observacao: z.string().optional().default(''),
  ncm: z.string().optional().default(''),
});

export const pedidoSchema = z.object({
  cliente_id: z.number().optional(),
  funcionario_id: z.number(),
  tipo: z.enum(['mesa', 'comanda', 'delivery', 'balcao']),
  mesa: z.string().optional().default(''),
  status: z.string().optional().default('aberto'),
  forma_pagamento: z.string().min(1, 'Forma de pagamento é obrigatória'),
  valor_total: z.number().optional().default(0),
  desconto: z.number().min(0, 'Desconto não pode ser negativo').optional().default(0),
  observacao: z.string().max(500, 'Máximo 500 caracteres').optional().default(''),
  itens: z.array(pedidoItemSchema).min(1, 'Adicione pelo menos um item'),
});

export type PedidoFormData = z.infer<typeof pedidoSchema>;
