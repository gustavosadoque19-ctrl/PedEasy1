import { supabase } from './supabaseClient.js';

const TABLE_MAP = {
  'categorias-adicionais': 'categorias_adicionais',
  'fidelidade_clientes': 'fidelidade_clientes',
  'fidelidade_config': 'fidelidade_config',
  'config_delivery': 'config_delivery',
};

function tableName(collection) {
  return TABLE_MAP[collection] || collection;
}

function formatRow(row) {
  if (!row) return null;
  return { id: row.id, ...row.data, createdAt: row.created_at };
}

function formatRows(rows) {
  return rows.map(formatRow).filter(Boolean);
}

function buildQuery(collection, tenantId) {
  let query = supabase.from(tableName(collection)).select('*');
  if (tenantId) {
    query = query.filter('data->>tenant_id', 'eq', String(tenantId));
  }
  return query.order('id');
}

export async function getAll(collection, tenantId) {
  const query = buildQuery(collection, tenantId);
  const { data, error } = await query;
  if (error) {
    console.error(`getAll(${collection}):`, error);
    return [];
  }
  return formatRows(data || []);
}

export async function getById(collection, id, tenantId) {
  let query = supabase.from(tableName(collection)).select('*').eq('id', id);
  
  if (tenantId) {
    query = query.filter('data->>tenant_id', 'eq', String(tenantId));
  }
  
  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error(`getById(${collection}, ${id}):`, error);
    return null;
  }
  const row = formatRow(data);
  return row;
}

export async function create(collection, inputData, tenantId) {
  const table = tableName(collection);
  const { id, ...data } = inputData;
  if (tenantId && data.tenant_id === undefined) {
    data.tenant_id = String(tenantId);
  }
  const { data: row, error } = await supabase
    .from(table)
    .insert({ data })
    .select()
    .single();
  if (error) {
    console.error(`create(${collection}):`, error);
    return null;
  }
  return formatRow(row);
}

export async function update(collection, id, inputData, tenantId) {
  const table = tableName(collection);
  const { id: _, ...data } = inputData;
  let query = supabase
    .from(table)
    .update({ data, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (tenantId) {
    query = query.filter('data->>tenant_id', 'eq', String(tenantId));
  }
  
  const { data: row, error } = await query.select().single();
  if (error) {
    console.error(`update(${collection}, ${id}):`, error);
    return null;
  }
  return formatRow(row);
}

export async function remove(collection, id, tenantId) {
  const table = tableName(collection);
  let query = supabase.from(table).delete().eq('id', id);
  
  if (tenantId) {
    query = query.filter('data->>tenant_id', 'eq', String(tenantId));
  }
  
  const { error } = await query;
  if (error) {
    console.error(`remove(${collection}, ${id}):`, error);
    return false;
  }
  return true;
}

export async function query(collection, fn, tenantId) {
  const rows = await getAll(collection, tenantId);
  return rows.filter(fn);
}

export async function migrateDataFromJson() {
  const { readFileSync, existsSync } = await import('fs');
  const { join, dirname } = await import('path');
  const { fileURLToPath } = await import('url');
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const DATA_DIR = join(__dirname, '..', 'data');

  const collections = [
    'produtos', 'clientes', 'funcionarios', 'pedidos', 'estoque',
    'caixa', 'cupons', 'fidelidade_clientes', 'fidelidade_config',
    'nps', 'carrinhos', 'categorias-adicionais', 'adicionais',
    'pagamentos', 'integracoes', 'config_delivery', 'relatorios',
  ];

  for (const col of collections) {
    const filePath = join(DATA_DIR, `${col}.json`);
    if (!existsSync(filePath)) continue;
    try {
      const content = readFileSync(filePath, 'utf-8');
      const items = JSON.parse(content);
      if (!items.length) continue;
      const existing = await getAll(col);
      if (existing.length > 0) {
        console.log(`⏭️  ${col}: já existem ${existing.length} registros no Supabase, pulando`);
        continue;
      }
      for (const item of items) {
        await create(col, item);
      }
      console.log(`✅ ${col}: ${items.length} registros migrados`);
    } catch (err) {
      console.error(`❌ ${col}: erro ao migrar - ${err.message}`);
    }
  }
  console.log('🏁 Migração concluída');
}
