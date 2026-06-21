import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../supabaseClient.js';
import { authMiddleware, generateTenantToken } from '../auth.js';
import { tenantGuard } from '../middleware/tenantGuard.js';
import { recaptchaMiddleware } from '../middleware/recaptcha.js';
import { webhookSignature } from '../middleware/webhookSignature.js';
import rateLimit from 'express-rate-limit';
import { getAll, getById, create, update, initTenantDb } from '../store.js';
import * as pagarme from '../pagarme.js';

const router = Router();

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de cadastro. Tente novamente em 15 minutos.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

const PLAN_IDS = {
  pro: process.env.PAGARME_PLAN_PRO,
  enterprise: process.env.PAGARME_PLAN_ENTERPRISE,
};

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

function formatUser(user) {
  return {
    id: user.id,
    tenant_id: user.tenant_id,
    nome: user.nome,
    email: user.email,
    cargo: user.cargo,
    permissao: user.permissao,
  };
}

function formatTenant(t) {
  return {
    id: t.id,
    nome: t.nome,
    slug: t.slug,
    plano: t.plano,
    status: t.status,
    pagarme_customer_id: t.pagarme_customer_id,
    pagarme_subscription_id: t.pagarme_subscription_id,
    trial_ends_at: t.trial_ends_at,
    config: t.config,
    createdAt: t.created_at,
  };
}

router.post('/signup', signupLimiter, recaptchaMiddleware, async (req, res) => {
  const { tenant_name, nome, email, senha } = req.body;
  if (!tenant_name || !nome || !email || !senha) {
    return res.status(400).json({ error: 'tenant_name, nome, email e senha são obrigatórios' });
  }
  if (senha.length < 8 || !/[A-Z]/.test(senha) || !/[0-9]/.test(senha)) {
    return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres, com pelo menos 1 letra maiúscula e 1 número' });
  }

  const { data: existing } = await supabase
    .from('tenant_users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existing) {
    return res.status(409).json({ error: 'Email já cadastrado' });
  }

  let slug = slugify(tenant_name);
  const { data: slugCheck } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (slugCheck) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const senhaHash = await bcrypt.hash(senha, 10);

  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .insert({
      nome: tenant_name,
      slug,
      plano: 'free',
      status: 'trial',
      trial_ends_at: trialEndsAt,
      config: {},
    })
    .select()
    .single();

  if (tenantErr || !tenant) {
    console.error('Erro ao criar tenant:', tenantErr);
    return res.status(500).json({ error: 'Erro ao criar estabelecimento' });
  }

  const { data: user, error: userErr } = await supabase
    .from('tenant_users')
    .insert({
      tenant_id: tenant.id,
      nome,
      email,
      senha: senhaHash,
      cargo: 'Administrador',
      permissao: 'admin',
      ativo: true,
    })
    .select()
    .single();

  if (userErr || !user) {
    await supabase.from('tenants').delete().eq('id', tenant.id);
    console.error('Erro ao criar usuário:', userErr);
    return res.status(500).json({ error: 'Erro ao criar usuário' });
  }

  initTenantDb(String(tenant.id));

  const token = generateTenantToken(user, tenant.id);
  res.status(201).json({
    token,
    user: formatUser(user),
    tenant: formatTenant(tenant),
  });
});

router.post('/login', loginLimiter, recaptchaMiddleware, async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha obrigatórios' });
  }

  const { data: user, error } = await supabase
    .from('tenant_users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error || !user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  if (!user.ativo) {
    return res.status(403).json({ error: 'Conta desativada. Contate o administrador.' });
  }

  const senhaValida = await bcrypt.compare(senha, user.senha);
  if (!senhaValida) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', user.tenant_id)
    .maybeSingle();

  if (!tenant) {
    return res.status(404).json({ error: 'Estabelecimento não encontrado' });
  }

  const token = generateTenantToken(user, tenant.id);
  res.json({
    token,
    user: formatUser(user),
    tenant: formatTenant(tenant),
  });
});

router.get('/planos', async (req, res) => {
  const { data } = await supabase.from('tenant_plan_limits').select('*').order('plano');
  const labels = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' };
  const prices = { free: 0, pro: 97, enterprise: 297 };
  res.json((data || []).map((p) => ({
    slug: p.plano,
    nome: labels[p.plano] || p.plano,
    preco: prices[p.plano] || 0,
    limites: p,
  })));
});

router.post('/subscriptions', authMiddleware, tenantGuard, async (req, res) => {
  const { plan_slug, card } = req.body;
  if (!plan_slug || !card) {
    return res.status(400).json({ error: 'plan_slug e card são obrigatórios' });
  }

  const planId = PLAN_IDS[plan_slug];
  if (!planId) {
    return res.status(400).json({ error: `Plano "${plan_slug}" não encontrado. Planos disponíveis: pro, enterprise` });
  }

  try {
    let customerId = req.tenant.pagarme_customer_id;

    if (!customerId) {
      const customer = await pagarme.criarCustomer({
        nome: req.tenant.nome,
        slug: req.tenant.slug,
        email: req.body.email || req.user.email || `${req.tenant.slug}@pedy.app`,
      });
      customerId = customer.id;
      await supabase.from('tenants').update({ pagarme_customer_id: customerId }).eq('id', req.tenant_id);
    }

    const subscription = await pagarme.criarAssinatura(customerId, planId, card, req.tenant_id);

    await supabase.from('tenants').update({
      plano: plan_slug,
      status: 'active',
      pagarme_subscription_id: subscription.id,
      updated_at: new Date().toISOString(),
    }).eq('id', req.tenant_id);

    const { data: updatedTenant } = await supabase.from('tenants').select('*').eq('id', req.tenant_id).maybeSingle();

    res.json({
      success: true,
      subscription_id: subscription.id,
      status: subscription.status,
      tenant: formatTenant(updatedTenant),
    });
  } catch (err) {
    console.error('Erro ao criar assinatura:', err);
    res.status(500).json({ error: err.message || 'Erro ao processar assinatura' });
  }
});

router.post('/webhooks', webhookSignature, async (req, res) => {
  const event = req.body;

  console.log(`[Webhook] Recebido: ${event.type}`);

  try {
    switch (event.type) {
      case 'subscription.paid': {
        const subId = event.data?.id;
        if (subId) {
          const { data: tenant } = await supabase.from('tenants').select('*').eq('pagarme_subscription_id', subId).maybeSingle();
          if (tenant && tenant.status === 'suspended') {
            await supabase.from('tenants').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', tenant.id);
          }
        }
        break;
      }
      case 'subscription.canceled': {
        const subId = event.data?.id;
        if (subId) {
          await supabase.from('tenants').update({ status: 'canceled', plano: 'free', updated_at: new Date().toISOString() }).eq('pagarme_subscription_id', subId);
        }
        break;
      }
      case 'subscription.unpaid': {
        const subId = event.data?.id;
        if (subId) {
          const { data: tenant } = await supabase.from('tenants').select('*').eq('pagarme_subscription_id', subId).maybeSingle();
          if (tenant && tenant.status === 'active') {
            await supabase.from('tenants').update({ status: 'suspended', updated_at: new Date().toISOString() }).eq('id', tenant.id);
          }
        }
        break;
      }
      case 'transaction.paid': {
        const txId = event.data?.id;
        const metadata = event.data?.metadata || {};
        const tenantId = metadata.tenant_id;
        const pedidoId = metadata.pedido_id;
        if (tenantId) {
          const pagamentos = await getAll('pagamentos', Number(tenantId));
          const pagamento = pagamentos.find((p) => p.transacao_id === txId);
          if (pagamento) {
            await update('pagamentos', pagamento.id, { status: 'aprovado' }, Number(tenantId));
          }
        }
        break;
      }
      case 'transaction.refunded': {
        const txId = event.data?.id;
        const metadata = event.data?.metadata || {};
        const tenantId = metadata.tenant_id;
        if (txId && tenantId) {
          const pagamentos = await getAll('pagamentos', Number(tenantId));
          const pagamento = pagamentos.find((p) => p.transacao_id === txId);
          if (pagamento) {
            await update('pagamentos', pagamento.id, { status: 'cancelado' }, Number(tenantId));
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error('[Webhook] Erro ao processar evento:', err);
  }

  res.json({ received: true });
});

router.get('/assinatura', authMiddleware, tenantGuard, async (req, res) => {
  if (!req.tenant_id) {
    return res.json(null);
  }
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', req.tenant_id)
    .maybeSingle();
  if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });
  res.json(formatTenant(tenant));
});

router.delete('/subscriptions', authMiddleware, tenantGuard, async (req, res) => {
  const subId = req.tenant.pagarme_subscription_id;
  if (!subId) return res.status(400).json({ error: 'Nenhuma assinatura ativa' });

  try {
    await pagarme.cancelarAssinatura(subId);
    await supabase.from('tenants').update({
      plano: 'free',
      status: 'canceled',
      pagarme_subscription_id: null,
      updated_at: new Date().toISOString(),
    }).eq('id', req.tenant_id);

    res.json({ success: true, message: 'Assinatura cancelada' });
  } catch (err) {
    console.error('Erro ao cancelar assinatura:', err);
    res.status(500).json({ error: err.message || 'Erro ao cancelar assinatura' });
  }
});

router.get('/onboarding', authMiddleware, tenantGuard, async (req, res) => {
  if (!req.tenant_id) {
    return res.json({ completed: false, step: 0, data: null });
  }
  const { data: tenant } = await supabase
    .from('tenants')
    .select('config')
    .eq('id', req.tenant_id)
    .maybeSingle();
  if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });
  res.json(tenant.config?.onboarding || { completed: false, step: 0 });
});

router.post('/onboarding', authMiddleware, tenantGuard, async (req, res) => {
  const { step, data } = req.body;
  if (!req.tenant_id) {
    return res.json({ completed: true, step: 3, ...data });
  }
  const { data: tenant } = await supabase
    .from('tenants')
    .select('config')
    .eq('id', req.tenant_id)
    .maybeSingle();
  if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });

  const config = { ...(tenant.config || {}) };
  config.onboarding = { ...(config.onboarding || {}), step: step || 0, ...data };
  if (data?.completed) config.onboarding.completed = true;

  const { data: updated, error } = await supabase
    .from('tenants')
    .update({ config, updated_at: new Date().toISOString() })
    .eq('id', req.tenant_id)
    .select('config')
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  res.json(updated.config?.onboarding || { completed: false, step: 0 });
});

export default router;
