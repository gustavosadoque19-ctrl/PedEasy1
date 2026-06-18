CREATE TABLE IF NOT EXISTS tenant_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL,
  plano TEXT DEFAULT 'free',
  status TEXT DEFAULT 'trial',
  config TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenant_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  cargo TEXT DEFAULT 'Administrador',
  permissao TEXT DEFAULT 'admin',
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS funcionarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  usuario TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  cargo TEXT,
  telefone TEXT,
  email TEXT,
  permissao TEXT DEFAULT 'operador',
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_venda REAL NOT NULL DEFAULT 0,
  preco_custo REAL DEFAULT 0,
  categoria TEXT,
  unidade TEXT DEFAULT 'un',
  estoque_atual REAL DEFAULT 0,
  estoque_minimo REAL DEFAULT 0,
  imagem TEXT,
  adicionais_ids TEXT DEFAULT '[]',
  max_adicionais INTEGER DEFAULT 0,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_nome TEXT,
  cliente_telefone TEXT,
  cliente_id INTEGER,
  tipo TEXT NOT NULL DEFAULT 'delivery',
  status TEXT NOT NULL DEFAULT 'aberto',
  itens TEXT DEFAULT '[]',
  valor_total REAL DEFAULT 0,
  desconto REAL DEFAULT 0,
  taxa_entrega REAL DEFAULT 0,
  forma_pagamento TEXT DEFAULT 'dinheiro',
  observacao TEXT,
  mesa TEXT,
  funcionario_id INTEGER DEFAULT 0,
  funcionario_nome TEXT,
  troco_para REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categorias_adicionais (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  ativo INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS adicionais (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  preco REAL DEFAULT 0,
  categoria_id INTEGER,
  ativo INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS caixa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  status TEXT DEFAULT 'fechado',
  saldo_inicial REAL DEFAULT 0,
  saldo_final REAL DEFAULT 0,
  movimentos TEXT DEFAULT '[]',
  data_abertura TEXT,
  data_fechamento TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS estoque (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id INTEGER,
  tipo TEXT NOT NULL,
  quantidade REAL NOT NULL,
  observacao TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'percentual',
  valor REAL NOT NULL,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fidelidade_clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER,
  pontos INTEGER DEFAULT 0,
  total_gasto REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fidelidade_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pontos_por_real REAL DEFAULT 1,
  pontos_minimo_resgate INTEGER DEFAULT 100,
  valor_resgate_por_ponto REAL DEFAULT 0.05,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS nps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_nome TEXT,
  nota INTEGER NOT NULL,
  comentario TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS carrinhos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_nome TEXT,
  cliente_telefone TEXT,
  itens TEXT DEFAULT '[]',
  whatsapp_enviado INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pagamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER,
  valor REAL NOT NULL,
  forma TEXT,
  status TEXT DEFAULT 'pendente',
  transacao_id TEXT,
  qr_code TEXT,
  cobranca TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS integracoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,
  config TEXT DEFAULT '{}',
  ultima_sync TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS config_delivery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  taxa_entrega REAL DEFAULT 0,
  tempo_estimado TEXT DEFAULT '30-50 min',
  horario_funcionamento TEXT,
  horarios TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS relatorios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,
  dados TEXT DEFAULT '{}',
  periodo_inicio TEXT,
  periodo_fim TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS nfe (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER,
  cliente_id INTEGER,
  numero_nf TEXT,
  chave_acesso TEXT,
  status TEXT DEFAULT 'pendente',
  valor REAL DEFAULT 0,
  xml TEXT,
  ref TEXT,
  protocolo TEXT,
  url_danfe TEXT,
  url_qrcode TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
