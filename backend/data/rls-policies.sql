-- Execute no SQL Editor do Supabase Dashboard
-- Cria políticas para permitir que a chave anônima (anon) faça tudo em cada tabela

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'produtos', 'clientes', 'funcionarios', 'pedidos', 'estoque',
    'caixa', 'cupons', 'fidelidade_clientes', 'fidelidade_config',
    'nps', 'carrinhos', 'categorias_adicionais', 'adicionais',
    'pagamentos', 'integracoes', 'config_delivery', 'relatorios'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS allow_all ON %I', tbl);
    EXECUTE format(
      'CREATE POLICY allow_all ON %I FOR ALL USING (true) WITH CHECK (true)',
      tbl
    );
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;
