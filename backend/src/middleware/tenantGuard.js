import { supabase } from '../supabaseClient.js';

export async function tenantGuard(req, res, next) {
  // Qualquer requisição a rotas de dados de tenant precisa de tenant_id no token.
  // O super-admin da plataforma NÃO passa por aqui — as rotas /api/admin/* não
  // usam este middleware (protegidas por isSuperAdmin em admin.js).
  // Sem tenant_id o acesso é recusado, fechando o bypass que antes caía num
  // DB "default" compartilhado.
  if (!req.tenant_id) {
    return res.status(403).json({ error: 'Tenant não identificado no token.' });
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
