import { supabase } from '../supabaseClient.js';

const LIMITS_CACHE = new Map();

async function getLimits(plano) {
  if (LIMITS_CACHE.has(plano)) return LIMITS_CACHE.get(plano);
  const { data } = await supabase
    .from('tenant_plan_limits')
    .select('*')
    .eq('plano', plano)
    .maybeSingle();
  LIMITS_CACHE.set(plano, data || {});
  setTimeout(() => LIMITS_CACHE.delete(plano), 60000);
  return data || {};
}

export function planGuard(feature) {
  return async (req, res, next) => {
    if (!req.tenant) {
      return res.status(401).json({ error: 'Tenant não identificado' });
    }
    const limits = await getLimits(req.tenant.plano);
    if (!limits[feature]) {
      return res.status(403).json({
        error: `Seu plano (${req.tenant.plano}) não inclui "${feature}". Faça upgrade para acessar.`,
        upgrade: true,
        plano_necessario: feature === 'nfe' ? 'pro' : 'pro',
      });
    }
    next();
  };
}
