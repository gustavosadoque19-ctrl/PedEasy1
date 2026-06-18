import { supabase } from '../supabaseClient.js';

export async function tenantGuard(req, res, next) {
  // O super-admin da plataforma (permissao === 'superadmin') opera sem
  // tenant_id e acessa /api/admin/*. É o único caso legítimo de tenant nulo.
  // Qualquer outra requisição sem tenant_id indica token legado/forjado e é
  // recusada — isto fecha o bypass que antes caía num DB compartilhado.
  if (!req.tenant_id) {
    if (req.user_permissao === 'superadmin') {
      return next();
    }
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
