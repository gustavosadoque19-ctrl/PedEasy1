import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { authMiddleware } from '../auth.js';
import { tenantGuard } from '../middleware/tenantGuard.js';
import { initTenantDb } from '../store.js';
import bcrypt from 'bcryptjs';

const router = Router();

function isSuperAdmin(req, res, next) {
  if (req.user_permissao !== 'superadmin') {
    return res.status(403).json({ error: 'Acesso restrito a superadministradores' });
  }
  next();
}

router.get('/tenants', authMiddleware, tenantGuard, isSuperAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const enriched = await Promise.all((data || []).map(async (t) => {
    const { count: userCount } = await supabase
      .from('tenant_users')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', t.id);
    return {
      id: t.id,
      nome: t.nome,
      slug: t.slug,
      plano: t.plano,
      status: t.status,
      usuarios: userCount || 0,
      trial_ends_at: t.trial_ends_at,
      pagarme_subscription_id: t.pagarme_subscription_id,
      createdAt: t.created_at,
    };
  }));

  res.json(enriched);
});

router.get('/tenants/:id', authMiddleware, tenantGuard, isSuperAdmin, async (req, res) => {
  const { data: tenant } = await supabase.from('tenants').select('*').eq('id', req.params.id).maybeSingle();
  if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });

  const { data: users } = await supabase
    .from('tenant_users')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('id');

  res.json({ ...tenant, users: users || [], password: undefined });
});

router.put('/tenants/:id', authMiddleware, tenantGuard, isSuperAdmin, async (req, res) => {
  const allowed = ['plano', 'status', 'pagarme_subscription_id', 'pagarme_customer_id'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const { data, error } = await supabase
    .from('tenants')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/tenants', authMiddleware, tenantGuard, isSuperAdmin, async (req, res) => {
  const { nome, email, senha, plano = 'free', status = 'trial' } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'nome, email e senha são obrigatórios' });
  }

  const slug = nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();

  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .insert({
      nome,
      slug,
      plano,
      status,
      config: {},
      trial_ends_at: status === 'trial' ? new Date(Date.now() + 7 * 86400000).toISOString() : null,
    })
    .select()
    .maybeSingle();

  if (tenantErr) return res.status(500).json({ error: tenantErr.message });

  const senhaHash = await bcrypt.hash(senha, 10);
  const { data: user, error: userErr } = await supabase
    .from('tenant_users')
    .insert({
      tenant_id: tenant.id,
      nome: 'Administrador',
      email,
      senha: senhaHash,
      cargo: 'Admin',
      permissao: 'admin',
      ativo: true,
    })
    .select()
    .maybeSingle();

  if (userErr) {
    await supabase.from('tenants').delete().eq('id', tenant.id);
    return res.status(500).json({ error: userErr.message });
  }

  initTenantDb(String(tenant.id));

  res.status(201).json({ ...tenant, users: [{ ...user, senha: undefined }] });
});

router.get('/metricas', authMiddleware, tenantGuard, isSuperAdmin, async (req, res) => {
  const { data: allTenants } = await supabase.from('tenants').select('*');
  const all = allTenants || [];
  const ativos = all.filter((t) => t.status === 'active');
  const trial = all.filter((t) => t.status === 'trial');
  const suspensos = all.filter((t) => t.status === 'suspended');
  const planos = {};
  for (const t of all) {
    planos[t.plano] = (planos[t.plano] || 0) + 1;
  }

  res.json({
    total: all.length,
    ativos: ativos.length,
    trial: trial.length,
    suspensos: suspensos.length,
    planos,
  });
});

export default router;
