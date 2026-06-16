import { supabase } from '../supabaseClient.js';

export async function tenantGuard(req, res, next) {
  if (!req.tenant_id) {
    return next();
  }
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', req.tenant_id)
    .maybeSingle();
  if (error || !tenant) {
    return res.status(404).json({ error: 'Estabelecimento não encontrado' });
  }
  if (tenant.status === 'suspended') {
    return res.status(403).json({ error: 'Conta suspensa. Renove sua assinatura.' });
  }
  if (tenant.status === 'trial' && new Date(tenant.trial_ends_at) < new Date()) {
    return res.status(403).json({ error: 'Período de teste expirado. Escolha um plano.' });
  }
  req.tenant = tenant;
  next();
}
