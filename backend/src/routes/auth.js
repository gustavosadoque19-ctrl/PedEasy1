import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { getAll, create, update } from '../store.js';
import { generateTenantToken, authMiddleware } from '../auth.js';
import { tenantGuard } from '../middleware/tenantGuard.js';
import { recaptchaMiddleware } from '../middleware/recaptcha.js';
import { supabase } from '../supabaseClient.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

const router = Router();

/**
 * Resolve o tenant_id a partir do slug informado no header `x-tenant-slug`
 * ou na query `?tenant=`. Retorna null se nenhum slug for fornecido.
 * Usado para que o login legado (por usuário) emita JWT com tenant_id,
 * fechando o bypass de isolamento multi-tenant.
 */
async function resolveTenantId(req) {
  const slug = req.headers['x-tenant-slug'] || req.query.tenant;
  if (!slug) return null;
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  return tenant ? tenant.id : null;
}

router.post('/login', loginLimiter, recaptchaMiddleware, async (req, res) => {
  // Login por email é tratado exclusivamente por /api/saas/login.
  // O antigo hack que delegava para saasRouter.handle era dead code quebrado
  // (sempre 500) e foi removido.
  const { usuario, senha, email } = req.body;

  if (email) {
    return res.status(400).json({
      error: 'Para login por email, use o endpoint /api/saas/login',
    });
  }

  if (!usuario || !senha) {
    return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
  }

  // Login legado exige contexto de tenant (header x-tenant-slug ou ?tenant=),
  // caso contrário recusa — não emite token sem tenant_id.
  const tenantId = await resolveTenantId(req);
  if (!tenantId) {
    return res.status(401).json({
      error: 'Tenant não identificado. Envie o slug via header x-tenant-slug ou query ?tenant=.',
    });
  }

  const funcionarios = await getAll('funcionarios', tenantId);
  const user = funcionarios.find((f) => f.usuario === usuario);

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  if (!user.ativo) {
    return res.status(403).json({ error: 'Conta aguardando aprovação do administrador' });
  }

  const senhaValida = await bcrypt.compare(senha, user.senha);
  if (!senhaValida) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Emite token COM tenant_id (mesmo formato do SaaS), fechando o bypass.
  const token = generateTenantToken(user, tenantId);
  res.json({
    token,
    user: {
      id: user.id,
      nome: user.nome,
      usuario: user.usuario,
      cargo: user.cargo,
      permissao: user.permissao,
      tenant_id: tenantId,
    },
  });
});

router.post('/register', loginLimiter, recaptchaMiddleware, async (req, res) => {
  const { nome, usuario, senha, cargo, telefone, email } = req.body;
  if (!nome || !usuario || !senha) {
    return res.status(400).json({ error: 'Nome, usuário e senha obrigatórios' });
  }

  if (senha.length < 8 || !/[A-Z]/.test(senha) || !/[0-9]/.test(senha)) {
    return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres, com pelo menos 1 letra maiúscula e 1 número' });
  }

  // Auto-cadastro legado também exige contexto de tenant.
  const tenantId = await resolveTenantId(req);
  if (!tenantId) {
    return res.status(401).json({
      error: 'Tenant não identificado. Envie o slug via header x-tenant-slug ou query ?tenant=.',
    });
  }

  const funcionarios = await getAll('funcionarios', tenantId);
  if (funcionarios.find((f) => f.usuario === usuario)) {
    return res.status(409).json({ error: 'Usuário já existe' });
  }

  const senhaHash = await bcrypt.hash(senha, 12);
  await create('funcionarios', {
    nome, usuario, senha: senhaHash,
    cargo: cargo || 'Atendente',
    telefone: telefone || '',
    email: email || '',
    permissao: 'funcionario',
    ativo: false,
  }, tenantId);

  res.status(201).json({ message: 'Cadastro realizado! Aguarde aprovação do administrador.' });
});

router.get('/pendentes', authMiddleware, tenantGuard, async (req, res) => {
  if (req.user.permissao !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores' });
  }
  const funcionarios = await getAll('funcionarios', req.tenant_id);
  const pendentes = funcionarios.filter((f) => !f.ativo);
  res.json(pendentes);
});

router.put('/aprovar/:id', authMiddleware, tenantGuard, async (req, res) => {
  if (req.user.permissao !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores' });
  }
  const updated = await update('funcionarios', Number(req.params.id), { ativo: true }, req.tenant_id);
  if (!updated) return res.status(404).json({ error: 'Funcionário não encontrado' });
  res.json(updated);
});

export default router;
