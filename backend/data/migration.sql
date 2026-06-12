-- PedEasy - Migração Supabase
-- Execute este SQL no SQL Editor do Supabase Dashboard

-- Tabela genérica: cada registro armazena os dados da collection em JSONB
-- Isso permite migração gradual sem reescrever toda a lógica de negócio

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funcionarios (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estoque (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS caixa (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cupons (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fidelidade_clientes (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fidelidade_config (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nps (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS carrinhos (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias_adicionais (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adicionais (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagamentos (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integracoes (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS config_delivery (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS relatorios (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca por campos dentro do JSONB
CREATE INDEX IF NOT EXISTS idx_produtos_data ON produtos USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_clientes_data ON clientes USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_funcionarios_data ON funcionarios USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_estoque_data ON estoque USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_caixa_data ON caixa USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_cupons_data ON cupons USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_fidelidade_clientes_data ON fidelidade_clientes USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_fidelidade_config_data ON fidelidade_config USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_nps_data ON nps USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_carrinhos_data ON carrinhos USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_categorias_adicionais_data ON categorias_adicionais USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_adicionais_data ON adicionais USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data ON pagamentos USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_integracoes_data ON integracoes USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_config_delivery_data ON config_delivery USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_relatorios_data ON relatorios USING GIN (data);
