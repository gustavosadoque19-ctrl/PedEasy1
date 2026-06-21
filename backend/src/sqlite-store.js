import { supabase } from './global-store.js';

const TABLE_MAP = {
  'categorias-adicionais': 'categorias_adicionais',
};

function tableName(collection) {
  return TABLE_MAP[collection] || collection;
}

function mergeData(row) {
  if (!row) return null;
  const { data, created_at, updated_at, ...rest } = row;
  return {
    id: row.id,
    ...(data || {}),
    created_at: created_at || data?.created_at,
    updated_at: updated_at || data?.updated_at,
  };
}

export async function getAll(collection, tenantId) {
  const table = tableName(collection);
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('data->>tenant_id', String(tenantId))
    .order('id', { ascending: true });
  if (error) throw error;
  return (data || []).map(mergeData);
}

export async function getById(collection, id, tenantId) {
  const table = tableName(collection);
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .eq('data->>tenant_id', String(tenantId))
    .maybeSingle();
  if (error) throw error;
  return mergeData(data);
}

export async function create(collection, inputData, tenantId) {
  const table = tableName(collection);
  const now = new Date().toISOString();
  const payload = { ...inputData };
  delete payload.id;
  const { data, error } = await supabase
    .from(table)
    .insert({ data: { ...payload, tenant_id: String(tenantId), created_at: now, updated_at: now } })
    .select()
    .single();
  if (error) throw error;
  return mergeData(data);
}

export async function update(collection, id, inputData, tenantId) {
  const table = tableName(collection);
  const { data: current, error: getError } = await supabase
    .from(table)
    .select('data')
    .eq('id', id)
    .eq('data->>tenant_id', String(tenantId))
    .single();
  if (getError) {
    if (getError.code === 'PGRST116') return null;
    throw getError;
  }
  const now = new Date().toISOString();
  const payload = { ...inputData };
  delete payload.id;
  const mergedData = { ...(current.data || {}), ...payload, updated_at: now };
  const { data, error } = await supabase
    .from(table)
    .update({ data: mergedData })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mergeData(data);
}

export async function remove(collection, id, tenantId) {
  const table = tableName(collection);
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('data->>tenant_id', String(tenantId))
    .select();
  if (error) throw error;
  return (data || []).length > 0;
}

export async function query(collection, fn, tenantId) {
  const rows = await getAll(collection, tenantId);
  return rows.filter(fn);
}

export function initTenantDb(_tenantId) {
  // No-op: Supabase tables já existem globalmente
}

export async function migrateDataFromJson() {
  // No-op: dados já estão no Supabase
}
