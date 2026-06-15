-- PedEasy - Migração Completa Supabase
-- Execute no SQL Editor do Supabase Dashboard

-- Cada registro armazena os dados em JSONB (padrão document store)
-- Compatível com a camada store.js do backend

-- ============================================
-- 1. CRIAÇÃO DAS TABELAS
-- ============================================

-- Aba: Produtos / Cardápio
CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aba: Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aba: Funcionários
CREATE TABLE IF NOT EXISTS funcionarios (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aba: Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aba: Estoque
CREATE TABLE IF NOT EXISTS estoque (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aba: Caixa
CREATE TABLE IF NOT EXISTS caixa (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aba: Cupons
CREATE TABLE IF NOT EXISTS cupons (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aba: Fidelidade - Clientes
CREATE TABLE IF NOT EXISTS fidelidade_clientes (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aba: Fidelidade - Configuração
CREATE TABLE IF NOT EXISTS fidelidade_config (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aba: NPS (Pesquisa de Satisfação)
CREATE TABLE IF NOT EXISTS nps (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aba: Carrinhos Abandonados
CREATE TABLE IF NOT EXISTS carrinhos (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aba: Adicionais - Categorias
CREATE TABLE IF NOT EXISTS categorias_adicionais (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aba: Adicionais
CREATE TABLE IF NOT EXISTS adicionais (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aba: Pagamentos Online
CREATE TABLE IF NOT EXISTS pagamentos (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aba: Integrações PDV
CREATE TABLE IF NOT EXISTS integracoes (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aba: Configurações Delivery
CREATE TABLE IF NOT EXISTS config_delivery (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aba: Relatórios (cache)
CREATE TABLE IF NOT EXISTS relatorios (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aba: NFe (Nota Fiscal Eletrônica) — FALTANDO na migration original
CREATE TABLE IF NOT EXISTS nfe (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ÍNDICES GIN PARA BUSCA EM JSONB
-- ============================================

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
CREATE INDEX IF NOT EXISTS idx_nfe_data ON nfe USING GIN (data);

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================

-- Habilita RLS em todas as tabelas
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'produtos', 'clientes', 'funcionarios', 'pedidos', 'estoque',
    'caixa', 'cupons', 'fidelidade_clientes', 'fidelidade_config',
    'nps', 'carrinhos', 'categorias_adicionais', 'adicionais',
    'pagamentos', 'integracoes', 'config_delivery', 'relatorios', 'nfe'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- Política liberal para desenvolvimento (anon pode tudo)
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'produtos', 'clientes', 'funcionarios', 'pedidos', 'estoque',
    'caixa', 'cupons', 'fidelidade_clientes', 'fidelidade_config',
    'nps', 'carrinhos', 'categorias_adicionais', 'adicionais',
    'pagamentos', 'integracoes', 'config_delivery', 'relatorios', 'nfe'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS allow_all ON %I', tbl);
    EXECUTE format(
      'CREATE POLICY allow_all ON %I FOR ALL USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END $$;
