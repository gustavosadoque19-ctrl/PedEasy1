import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from './supabaseClient.js';
import { authMiddleware } from './auth.js';
import { tenantGuard } from './middleware/tenantGuard.js';
import { requestLogger } from './middleware/requestLogger.js';
import { globalLimiter, tenantRateLimit } from './middleware/rateLimiter.js';
import { getAll, getById, create, update, remove, query } from './store.js';
import * as pagarme from './pagarme.js';
import authRoutes from './routes/auth.js';
import nfeRoutes from './routes/nfe.js';
import funcionariosRoutes from './routes/funcionarios.js';
import saasRoutes from './routes/saas.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

import { mkdirSync, existsSync } from 'fs';
try { if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true }); } catch {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) return cb(null, true);
    cb(new Error('Formato inválido. Use: jpg, jpeg, png, gif, webp'));
  },
});

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
// Suporta múltiplas origens separadas por vírgula
const corsOrigins = CORS_ORIGIN.split(',').map(s => s.trim());

const app = express();
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
}));
// verify captura o corpo bruto (raw body) para verificação HMAC do webhook
// da Pagar.me. Não afeta o parsing JSON das demais rotas (req.body continua populado).
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use(globalLimiter);
app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/saas', saasRoutes);
// /api/admin são rotas de plataforma: superadmin não tem tenant_id, então
// não usam tenantGuard (a proteção real é isSuperAdmin dentro de admin.js).
app.use('/api/admin', authMiddleware, tenantRateLimit, adminRoutes);
app.use('/api/nfe', authMiddleware, tenantGuard, tenantRateLimit, nfeRoutes);

function crudRoutes(collection) {
  const router = express.Router();

  router.use(authMiddleware, tenantGuard, tenantRateLimit);

  router.get('/', async (req, res) => {
    let data = await getAll(collection, req.tenant_id);
    if (req.query.telefone && collection === 'pedidos') {
      data = data.filter((p) => p.cliente_telefone?.includes(req.query.telefone));
    }
    res.json(data);
  });

  router.get('/:id', async (req, res) => {
    const item = await getById(collection, Number(req.params.id), req.tenant_id);
    if (!item) return res.status(404).json({ error: `${collection} não encontrado` });
    res.json(item);
  });

  router.post('/', async (req, res) => {
    const item = await create(collection, req.body, req.tenant_id);
    res.status(201).json(item);
  });

  router.put('/:id', async (req, res) => {
    const item = await update(collection, Number(req.params.id), req.body, req.tenant_id);
    if (!item) return res.status(404).json({ error: `${collection} não encontrado` });
    res.json(item);
  });

  router.delete('/:id', async (req, res) => {
    const ok = await remove(collection, Number(req.params.id), req.tenant_id);
    if (!ok) return res.status(404).json({ error: `${collection} não encontrado` });
    res.status(204).send();
  });

  return router;
}

app.use('/api/produtos', crudRoutes('produtos'));

app.get('/api/cardapio/produtos', async (req, res) => {
  const { slug } = req.query;
  if (!slug) {
    return res.status(400).json({ error: 'Informe o slug do estabelecimento via ?slug=<slug>' });
  }
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!tenant) return res.status(404).json({ error: 'Estabelecimento não encontrado' });
  const tenantId = tenant.id;
  const [todosProdutos, todosAdicionais, todasCategorias] = await Promise.all([
    getAll('produtos', tenantId),
    getAll('adicionais', tenantId),
    getAll('categorias-adicionais', tenantId),
  ]);
  const produtos = todosProdutos.filter((p) => p.ativo !== false);
  const adicionais = todosAdicionais.filter((a) => a.ativo !== false);
  const categorias = todasCategorias.filter((c) => c.ativo !== false);
  const data = produtos.map((p) => ({
    ...p,
    adicionais_disponiveis: (p.adicionais_ids || []).map((id) => {
      const a = adicionais.find((ad) => ad.id === id);
      if (!a) return null;
      const cat = categorias.find((c) => c.id === a.categoria_id);
      return { ...a, categoria_nome: cat ? cat.nome : '' };
    }).filter(Boolean),
  }));
  res.json(data);
});

app.get('/api/cardapio/:slug/produtos', async (req, res) => {
  const { slug } = req.params;
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!tenant) return res.status(404).json({ error: 'Estabelecimento não encontrado' });

  const [todosProdutos, todosAdicionais, todasCategorias] = await Promise.all([
    getAll('produtos', tenant.id),
    getAll('adicionais', tenant.id),
    getAll('categorias-adicionais', tenant.id),
  ]);
  const produtos = todosProdutos.filter((p) => p.ativo !== false);
  const adicionais = todosAdicionais.filter((a) => a.ativo !== false);
  const categorias = todasCategorias.filter((c) => c.ativo !== false);
  const data = produtos.map((p) => ({
    ...p,
    adicionais_disponiveis: (p.adicionais_ids || []).map((id) => {
      const a = adicionais.find((ad) => ad.id === id);
      if (!a) return null;
      const cat = categorias.find((c) => c.id === a.categoria_id);
      return { ...a, categoria_nome: cat ? cat.nome : '' };
    }).filter(Boolean),
  }));
  res.json(data);
});

app.use('/api/clientes', crudRoutes('clientes'));
app.use('/api/funcionarios', funcionariosRoutes);

const pedidosRouter = express.Router();
pedidosRouter.use(authMiddleware, tenantGuard, tenantRateLimit);

pedidosRouter.get('/', async (req, res) => {
  let data = await getAll('pedidos', req.tenant_id);
  if (req.query.telefone) {
    data = data.filter((p) => p.cliente_telefone?.includes(req.query.telefone));
  }
  res.json(data);
});

pedidosRouter.get('/abertos', async (req, res) => {
  const data = await query('pedidos', (p) => p.status !== 'fechado' && p.status !== 'cancelado', req.tenant_id);
  res.json(data);
});

pedidosRouter.get('/:id', async (req, res) => {
  const item = await getById('pedidos', Number(req.params.id), req.tenant_id);
  if (!item) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.json(item);
});

pedidosRouter.post('/', async (req, res) => {
  if (!req.body.tipo || !req.body.status) {
    return res.status(400).json({ error: 'Campos obrigatórios: tipo, status' });
  }
  const item = await create('pedidos', req.body, req.tenant_id);
  if (!item) return res.status(500).json({ error: 'Erro ao criar pedido' });
  res.status(201).json(item);
});

pedidosRouter.put('/:id', async (req, res) => {
  const item = await getById('pedidos', Number(req.params.id), req.tenant_id);
  if (!item) return res.status(404).json({ error: 'Pedido não encontrado' });

  const updated = await update('pedidos', Number(req.params.id), req.body, req.tenant_id);
  if (!updated) return res.status(500).json({ error: 'Erro ao atualizar pedido' });

  const newStatus = req.body.status;
  const oldStatus = item.status;
  if ((newStatus === 'entregue' || newStatus === 'fechado') && oldStatus !== newStatus) {
    const caixas = await query('caixa', (c) => c.status === 'aberto', req.tenant_id);
    if (caixas.length > 0) {
      const caixa = caixas[0];
      const mov = {
        caixa_id: caixa.id,
        tipo: 'entrada',
        categoria: updated.tipo === 'delivery' ? 'Venda Delivery' : updated.tipo === 'mesa' ? 'Venda Mesa' : 'Venda',
        valor: updated.valor_total || 0,
        descricao: `Pedido #${updated.id}${updated.mesa ? ` - Mesa ${updated.mesa}` : ''}`,
        forma_pagamento: updated.forma_pagamento || 'dinheiro',
        pedido_id: updated.id,
        createdAt: new Date().toISOString(),
      };
      await update('caixa', caixa.id, {
        movimentos: [...(caixa.movimentos || []), mov],
      }, req.tenant_id);
    }
  }

  res.json(updated);
});

pedidosRouter.delete('/:id', async (req, res) => {
  const ok = await remove('pedidos', Number(req.params.id), req.tenant_id);
  if (!ok) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.status(204).send();
});

app.use('/api/pedidos', pedidosRouter);

app.get('/api/estoque', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  res.json(await getAll('estoque', req.tenant_id));
});

app.post('/api/estoque', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  const item = await create('estoque', req.body, req.tenant_id);
  res.status(201).json(item);
});

app.get('/api/caixa/aberto', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  const caixas = await query('caixa', (c) => c.status === 'aberto', req.tenant_id);
  res.json(caixas[0] || null);
});

app.post('/api/caixa/abrir', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  const safeData = { saldo_inicial: req.body.saldo_inicial, observacao: req.body.observacao };
  const item = await create('caixa', { ...safeData, status: 'aberto', movimentos: [] }, req.tenant_id);
  res.status(201).json(item);
});

app.post('/api/caixa/fechar/:id', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  const caixa = await getById('caixa', Number(req.params.id), req.tenant_id);
  if (!caixa) return res.status(404).json({ error: 'Caixa não encontrado' });
  const totalEntradas = (caixa.movimentos || []).filter((m) => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0);
  const totalSaidas = (caixa.movimentos || []).filter((m) => m.tipo === 'saida').reduce((s, m) => s + m.valor, 0);
  const updated = await update('caixa', caixa.id, {
    status: 'fechado',
    data_fechamento: new Date().toISOString(),
    saldo_final: caixa.saldo_inicial + totalEntradas - totalSaidas,
  }, req.tenant_id);
  res.json(updated);
});

app.post('/api/caixa/movimento', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  const caixa = await getById('caixa', Number(req.body.caixa_id), req.tenant_id);
  if (!caixa) return res.status(404).json({ error: 'Caixa não encontrado' });
  const mov = { tipo: req.body.tipo, valor: req.body.valor, descricao: req.body.descricao, createdAt: new Date().toISOString() };
  const updated = await update('caixa', caixa.id, {
    movimentos: [...(caixa.movimentos || []), mov],
  }, req.tenant_id);
  res.status(201).json(mov);
});

app.get('/api/caixa/historico', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  res.json(await getAll('caixa', req.tenant_id));
});

app.post('/api/cardapio/pedidos', async (req, res) => {
  const { slug, cliente_nome, cliente_telefone, endereco_entrega, forma_pagamento, observacao, itens, taxa_entrega, troco_para } = req.body;
  if (!cliente_nome || !cliente_telefone || !itens?.length) {
    return res.status(400).json({ error: 'Nome, telefone e itens são obrigatórios' });
  }
  if (!slug) {
    return res.status(400).json({ error: 'Informe o slug do estabelecimento' });
  }
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!tenant) return res.status(404).json({ error: 'Estabelecimento não encontrado' });
  const tenantId = tenant.id;
  const valor_itens = itens.reduce((s, i) => s + (i.total || i.quantidade * i.preco_unitario), 0);
  const pedido = await create('pedidos', {
    cliente_nome, cliente_telefone, endereco_entrega, forma_pagamento, observacao,
    itens, taxa_entrega: taxa_entrega || 0, troco_para: troco_para || 0,
    tipo: 'delivery', status: 'aberto', funcionario_id: 0, funcionario_nome: 'Cardápio Digital',
    valor_total: valor_itens + (taxa_entrega || 0), desconto: 0,
  }, tenantId);
  res.status(201).json(pedido);
});

app.get('/api/config/delivery', async (req, res) => {
  const { slug } = req.query;
  if (!slug) {
    return res.status(400).json({ error: 'Informe o slug do estabelecimento via ?slug=<slug>' });
  }
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!tenant) return res.status(404).json({ error: 'Estabelecimento não encontrado' });
  const tenantId = tenant.id;
  const stored = await getAll('config_delivery', tenantId);
  const config = stored[0] || {};
  res.json({
    taxa_entrega: config.taxa_entrega ?? (parseFloat(process.env.TAXA_ENTREGA || '0') || 0),
    tempo_estimado: config.tempo_estimado || process.env.TEMPO_ESTIMADO || '30-50 min',
    horario_funcionamento: config.horario_funcionamento || process.env.HORARIO_FUNCIONAMENTO || 'Seg-Sex: 08h-18h, Sáb: 08h-13h',
    horarios: config.horarios || [
      { dia: 'Segunda', abertura: '08:00', fechamento: '18:00', fechado: false },
      { dia: 'Terça', abertura: '08:00', fechamento: '18:00', fechado: false },
      { dia: 'Quarta', abertura: '08:00', fechamento: '18:00', fechado: false },
      { dia: 'Quinta', abertura: '08:00', fechamento: '18:00', fechado: false },
      { dia: 'Sexta', abertura: '08:00', fechamento: '18:00', fechado: false },
      { dia: 'Sábado', abertura: '08:00', fechamento: '13:00', fechado: false },
      { dia: 'Domingo', abertura: '', fechamento: '', fechado: true },
    ],
  });
});

app.put('/api/config/delivery', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  const stored = await getAll('config_delivery', req.tenant_id);
  const body = req.body;
  if (body.horarios) {
    const abertos = body.horarios.filter((h) => !h.fechado);
    const partes = abertos.map((h) => {
      const diaAbrev = h.dia.substring(0, 3);
      return `${diaAbrev}: ${h.abertura}h-${h.fechamento}h`;
    });
    body.horario_funcionamento = partes.join(', ');
  }
  if (stored.length > 0) {
    const updated = await update('config_delivery', stored[0].id, body, req.tenant_id);
    res.json(updated);
  } else {
    const item = await create('config_delivery', body, req.tenant_id);
    res.json(item);
  }
});

app.get('/api/relatorios/vendas', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  const todosPedidos = await getAll('pedidos', req.tenant_id);
  const pedidos = todosPedidos.filter((p) => p.status === 'fechado' || p.status === 'entregue');
  const total_vendas = pedidos.reduce((s, p) => s + p.valor_total, 0);
  const total_descontos = pedidos.reduce((s, p) => s + (p.desconto || 0), 0);
  const total_recebido = total_vendas - total_descontos;
  const quantidade_pedidos = pedidos.length;
  const ticket_medio = quantidade_pedidos > 0 ? total_recebido / quantidade_pedidos : 0;

  const pagamentoMap = {};
  for (const p of pedidos) {
    const fp = p.forma_pagamento || 'dinheiro';
    pagamentoMap[fp] = (pagamentoMap[fp] || 0) + (p.valor_total - (p.desconto || 0));
  }
  const vendas_por_forma_pagamento = Object.entries(pagamentoMap).map(([forma, total]) => ({ forma, total }));

  const produtoCount = {};
  for (const p of pedidos) {
    for (const item of (p.itens || [])) {
      const nome = item.produto_nome || `Produto #${item.produto_id}`;
      if (!produtoCount[nome]) produtoCount[nome] = { quantidade: 0, total: 0 };
      produtoCount[nome].quantidade += item.quantidade || 0;
      produtoCount[nome].total += item.total || 0;
    }
  }
  const produtos_mais_vendidos = Object.entries(produtoCount)
    .map(([produto, dados]) => ({ produto, ...dados }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10);

  res.json({ periodo: 'Geral', total_vendas, total_recebido, total_descontos, quantidade_pedidos, ticket_medio, vendas_por_forma_pagamento, produtos_mais_vendidos });
});

app.use('/api/cupons', crudRoutes('cupons'));
app.use('/api/fidelidade/clientes', crudRoutes('fidelidade_clientes'));
app.use('/api/nps', crudRoutes('nps'));
app.use('/api/carrinhos', crudRoutes('carrinhos'));
app.use('/api/adicionais/categorias', crudRoutes('categorias-adicionais'));
app.use('/api/adicionais', crudRoutes('adicionais'));

app.use('/api/pagamentos', crudRoutes('pagamentos'));
app.use('/api/integracoes', crudRoutes('integracoes'));

app.get('/api/fidelidade/config', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  const configs = await getAll('fidelidade_config', req.tenant_id);
  res.json(configs[0] || { pontos_por_real: 1, pontos_minimo_resgate: 100, valor_resgate_por_ponto: 0.05, ativo: true });
});

app.put('/api/fidelidade/config', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  const configs = await getAll('fidelidade_config', req.tenant_id);
  if (configs.length > 0) {
    const updated = await update('fidelidade_config', configs[0].id, req.body, req.tenant_id);
    res.json(updated);
  } else {
    const item = await create('fidelidade_config', req.body, req.tenant_id);
    res.json(item);
  }
});

app.get('/api/nps/resumo', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  const pesquisas = await getAll('nps', req.tenant_id);
  const total = pesquisas.length;
  const promotores = pesquisas.filter((n) => n.nota >= 9).length;
  const detratores = pesquisas.filter((n) => n.nota <= 6).length;
  const neutros = total - promotores - detratores;
  const nps = total > 0 ? Math.round(((promotores - detratores) / total) * 100) : 0;
  const media = total > 0 ? pesquisas.reduce((s, n) => s + n.nota, 0) / total : 0;
  res.json({ total, media, nps, promotores, detratores, neutros });
});

app.post('/api/fidelidade/pontos', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  const { cliente_id, pontos } = req.body;
  const clientes = await getAll('fidelidade_clientes', req.tenant_id);
  let record = clientes.find((c) => c.cliente_id === cliente_id);
  if (record) {
    record = await update('fidelidade_clientes', record.id, { pontos: (record.pontos || 0) + pontos }, req.tenant_id);
  } else {
    record = await create('fidelidade_clientes', { cliente_id, pontos, total_gasto: 0 }, req.tenant_id);
  }
  res.json(record);
});

app.post('/api/fidelidade/resgatar', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  const { cliente_id, pontos } = req.body;
  const clientes = await getAll('fidelidade_clientes', req.tenant_id);
  const record = clientes.find((c) => c.cliente_id === cliente_id);
  if (!record) return res.status(404).json({ error: 'Cliente não encontrado' });
  if ((record.pontos || 0) < pontos) return res.status(400).json({ error: 'Pontos insuficientes' });
  const updated = await update('fidelidade_clientes', record.id, { pontos: (record.pontos || 0) - pontos }, req.tenant_id);
  res.json(updated);
});

app.post('/api/carrinhos/:id/lembrete', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  const carrinho = await getById('carrinhos', Number(req.params.id), req.tenant_id);
  if (!carrinho) return res.status(404).json({ error: 'Carrinho não encontrado' });
  await update('carrinhos', carrinho.id, { whatsapp_enviado: true }, req.tenant_id);
  res.json({ success: true, message: 'Lembrete enviado' });
});

app.post('/api/pagamentos/pix', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  const { pedido_id, valor } = req.body;
  if (!pedido_id || !valor) return res.status(400).json({ error: 'pedido_id e valor são obrigatórios' });

  try {
    let customerId = req.tenant.pagarme_customer_id;
    if (!customerId) {
      const customer = await pagarme.criarCustomer({
        id: req.tenant_id,
        nome: req.tenant.nome,
        slug: req.tenant.slug,
        email: req.user?.email || `${req.tenant.slug}@pedy.app`,
      });
      customerId = customer.id;
      await supabase.from('tenants').update({ pagarme_customer_id: customerId }).eq('id', req.tenant_id);
    }

    const order = await pagarme.criarOrdemPagamento({
      customerId,
      tenantId: req.tenant_id,
      pedidoId: pedido_id,
      items: [{ amount: Math.round(valor * 100), description: `Pedido #${pedido_id}`, quantity: 1, code: `ped-${pedido_id}` }],
      payments: [{ payment_method: 'pix', pix: { expires_in: 3600 } }],
    });

    const charge = order.charges?.[0];
    const tx = charge?.last_transaction;
    const qrCode = tx?.pix_qr_code || tx?.qr_code || null;
    const qrCodeUrl = tx?.pix_qr_code_url || tx?.qr_code_url || null;
    const txId = tx?.id || charge?.id;

    const item = await create('pagamentos', {
      pedido_id, valor, forma: 'pix', status: 'pendente',
      transacao_id: txId, qr_code: qrCode, cobranca: qrCodeUrl,
    }, req.tenant_id);

    res.status(201).json(item);
  } catch (err) {
    console.error('Erro Pagar.me PIX:', err);
    res.status(500).json({ error: 'Erro ao criar cobrança PIX' });
  }
});

app.post('/api/pagamentos/cartao', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  const { pedido_id, valor, parcelas = 1, card } = req.body;
  if (!pedido_id || !valor || !card) return res.status(400).json({ error: 'pedido_id, valor e card são obrigatórios' });
  
  if (!card.number || !card.holder_name || !card.exp_month || !card.exp_year || !card.cvv) {
    return res.status(400).json({ error: 'Dados do cartão incompletos. Campos obrigatórios: número, titular, mês de validade, ano de validade, CVV' });
  }

  try {
    let customerId = req.tenant.pagarme_customer_id;
    if (!customerId) {
      const customer = await pagarme.criarCustomer({
        id: req.tenant_id,
        nome: req.tenant.nome,
        slug: req.tenant.slug,
        email: req.user?.email || `${req.tenant.slug}@pedy.app`,
      });
      customerId = customer.id;
      await supabase.from('tenants').update({ pagarme_customer_id: customerId }).eq('id', req.tenant_id);
    }

    const order = await pagarme.criarOrdemPagamento({
      customerId,
      tenantId: req.tenant_id,
      pedidoId: pedido_id,
      items: [{ amount: Math.round(valor * 100), description: `Pedido #${pedido_id}`, quantity: 1, code: `ped-${pedido_id}` }],
      payments: [{
        payment_method: 'credit_card',
        credit_card: {
          card: {
            number: card.number.replace(/\s/g, ''),
            holder_name: card.holder_name,
            exp_month: parseInt(card.exp_month, 10),
            exp_year: parseInt(card.exp_year, 10),
            cvv: card.cvv,
          },
          installments: Math.max(1, parseInt(parcelas, 10)),
        },
      }],
    });

    const charge = order.charges?.[0];
    const tx = charge?.last_transaction;
    const status = charge?.status === 'paid' ? 'aprovado' : charge?.status === 'failed' ? 'recusado' : 'pendente';
    const txId = tx?.id || charge?.id;
    const forma = parseInt(parcelas, 10) > 1 ? 'cartao_credito' : 'cartao_debito';

    const item = await create('pagamentos', {
      pedido_id, valor, forma, status, transacao_id: txId,
    }, req.tenant_id);

    res.status(201).json(item);
  } catch (err) {
    console.error('Erro Pagar.me Cartão:', err);
    res.status(500).json({ error: 'Erro ao processar pagamento com cartão' });
  }
});

app.get('/api/pagamentos/pix/status/:transacaoId', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  try {
    const pagamentos = await getAll('pagamentos', req.tenant_id);
    const pagamento = pagamentos.find((p) => p.transacao_id === req.params.transacaoId);
    if (!pagamento) return res.status(404).json({ error: 'Pagamento não encontrado' });
    res.json({ status: pagamento.status, qr_code: pagamento.qr_code, cobranca: pagamento.cobranca });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar pagamento' });
  }
});

app.post('/api/integracoes/:id/sync', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  const integracao = await getById('integracoes', Number(req.params.id), req.tenant_id);
  if (!integracao) return res.status(404).json({ error: 'Integração não encontrada' });
  await update('integracoes', integracao.id, { ultima_sync: new Date().toISOString() }, req.tenant_id);
  res.json({ success: true, message: 'Sincronizado com sucesso' });
});

app.get('/api/relatorios', authMiddleware, tenantGuard, tenantRateLimit, async (req, res) => {
  res.json(await getAll('relatorios', req.tenant_id));
});

app.use('/uploads', express.static(UPLOADS_DIR));

app.post('/api/produtos/:id/imagem', authMiddleware, tenantGuard, tenantRateLimit, (req, res) => {
  upload.single('imagem')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulerError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Arquivo muito grande. Máximo: 5MB' });
      }
      return res.status(400).json({ error: err.message || 'Erro ao fazer upload' });
    }
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    const produto = await getById('produtos', Number(req.params.id), req.tenant_id);
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    const updated = await update('produtos', produto.id, { imagem: req.file.filename }, req.tenant_id);
    res.json(updated);
  });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && 'body' in err)) {
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição' });
  }
  // tenant_id ausente: a defesa em profundidade do sqlite-store.js lançou —
  // retorna 403 claro em vez de 500 (ex: super-admin em rota tenant-scoped).
  if (err && err.message && err.message.startsWith('tenant_id ausente')) {
    return res.status(403).json({ error: 'Operação requer contexto de tenant.' });
  }
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

export default app;
