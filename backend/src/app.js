import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './auth.js';
import { getAll, getById, create, update, remove, query } from './store.js';
import authRoutes from './routes/auth.js';
import nfeRoutes from './routes/nfe.js';
import funcionariosRoutes from './routes/funcionarios.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

import { mkdirSync, existsSync } from 'fs';
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

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

const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/nfe', nfeRoutes);

function crudRoutes(collection) {
  const router = express.Router();

  router.get('/', authMiddleware, async (req, res) => {
    let data = await getAll(collection);
    if (req.query.telefone && collection === 'pedidos') {
      data = data.filter((p) => p.cliente_telefone?.includes(req.query.telefone));
    }
    res.json(data);
  });

  router.get('/:id', authMiddleware, async (req, res) => {
    const item = await getById(collection, Number(req.params.id));
    if (!item) return res.status(404).json({ error: `${collection} não encontrado` });
    res.json(item);
  });

  router.post('/', authMiddleware, async (req, res) => {
    const item = await create(collection, req.body);
    res.status(201).json(item);
  });

  router.put('/:id', authMiddleware, async (req, res) => {
    const item = await update(collection, Number(req.params.id), req.body);
    if (!item) return res.status(404).json({ error: `${collection} não encontrado` });
    res.json(item);
  });

  router.delete('/:id', authMiddleware, async (req, res) => {
    const ok = await remove(collection, Number(req.params.id));
    if (!ok) return res.status(404).json({ error: `${collection} não encontrado` });
    res.status(204).send();
  });

  return router;
}

app.use('/api/produtos', crudRoutes('produtos'));

app.get('/api/cardapio/produtos', async (req, res) => {
  const todosProdutos = await getAll('produtos');
  const todosAdicionais = await getAll('adicionais');
  const todasCategorias = await getAll('categorias-adicionais');
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

pedidosRouter.get('/', authMiddleware, async (req, res) => {
  let data = await getAll('pedidos');
  if (req.query.telefone) {
    data = data.filter((p) => p.cliente_telefone?.includes(req.query.telefone));
  }
  res.json(data);
});

pedidosRouter.get('/abertos', authMiddleware, async (req, res) => {
  const data = await query('pedidos', (p) => p.status !== 'fechado' && p.status !== 'cancelado');
  res.json(data);
});

pedidosRouter.get('/:id', authMiddleware, async (req, res) => {
  const item = await getById('pedidos', Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.json(item);
});

pedidosRouter.post('/', authMiddleware, async (req, res) => {
  const item = await create('pedidos', req.body);
  res.status(201).json(item);
});

pedidosRouter.put('/:id', authMiddleware, async (req, res) => {
  const item = await getById('pedidos', Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Pedido não encontrado' });

  const updated = await update('pedidos', Number(req.params.id), req.body);

  const newStatus = req.body.status;
  const oldStatus = item.status;
  if ((newStatus === 'entregue' || newStatus === 'fechado') && oldStatus !== newStatus) {
    const caixas = await query('caixa', (c) => c.status === 'aberto');
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
      });
    }
  }

  res.json(updated);
});

pedidosRouter.delete('/:id', authMiddleware, async (req, res) => {
  const ok = await remove('pedidos', Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.status(204).send();
});

app.use('/api/pedidos', pedidosRouter);

app.get('/api/estoque', authMiddleware, async (req, res) => {
  res.json(await getAll('estoque'));
});

app.post('/api/estoque', authMiddleware, async (req, res) => {
  const item = await create('estoque', req.body);
  res.status(201).json(item);
});

app.get('/api/caixa/aberto', authMiddleware, async (req, res) => {
  const caixas = await query('caixa', (c) => c.status === 'aberto');
  res.json(caixas[0] || null);
});

app.post('/api/caixa/abrir', authMiddleware, async (req, res) => {
  const item = await create('caixa', { ...req.body, status: 'aberto', movimentos: [] });
  res.status(201).json(item);
});

app.post('/api/caixa/fechar/:id', authMiddleware, async (req, res) => {
  const caixa = await getById('caixa', Number(req.params.id));
  if (!caixa) return res.status(404).json({ error: 'Caixa não encontrado' });
  const totalEntradas = (caixa.movimentos || []).filter((m) => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0);
  const totalSaidas = (caixa.movimentos || []).filter((m) => m.tipo === 'saida').reduce((s, m) => s + m.valor, 0);
  const updated = await update('caixa', caixa.id, {
    status: 'fechado',
    data_fechamento: new Date().toISOString(),
    saldo_final: caixa.saldo_inicial + totalEntradas - totalSaidas,
  });
  res.json(updated);
});

app.post('/api/caixa/movimento', authMiddleware, async (req, res) => {
  const caixa = await getById('caixa', Number(req.body.caixa_id));
  if (!caixa) return res.status(404).json({ error: 'Caixa não encontrado' });
  const mov = { ...req.body, createdAt: new Date().toISOString() };
  const updated = await update('caixa', caixa.id, {
    movimentos: [...(caixa.movimentos || []), mov],
  });
  res.status(201).json(mov);
});

app.get('/api/caixa/historico', authMiddleware, async (req, res) => {
  res.json(await getAll('caixa'));
});

app.post('/api/cardapio/pedidos', async (req, res) => {
  const { cliente_nome, cliente_telefone, endereco_entrega, forma_pagamento, observacao, itens, taxa_entrega, troco_para } = req.body;
  if (!cliente_nome || !cliente_telefone || !itens?.length) {
    return res.status(400).json({ error: 'Nome, telefone e itens são obrigatórios' });
  }
  const valor_itens = itens.reduce((s, i) => s + (i.total || i.quantidade * i.preco_unitario), 0);
  const pedido = await create('pedidos', {
    cliente_nome, cliente_telefone, endereco_entrega, forma_pagamento, observacao,
    itens, taxa_entrega: taxa_entrega || 0, troco_para: troco_para || 0,
    tipo: 'delivery', status: 'aberto', funcionario_id: 0, funcionario_nome: 'Cardápio Digital',
    valor_total: valor_itens + (taxa_entrega || 0), desconto: 0,
  });
  res.status(201).json(pedido);
});

app.get('/api/config/delivery', async (req, res) => {
  const stored = await getAll('config_delivery');
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

app.put('/api/config/delivery', async (req, res) => {
  const stored = await getAll('config_delivery');
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
    const updated = await update('config_delivery', stored[0].id, body);
    res.json(updated);
  } else {
    const item = await create('config_delivery', body);
    res.json(item);
  }
});

app.get('/api/relatorios/vendas', authMiddleware, async (req, res) => {
  const todosPedidos = await getAll('pedidos');
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

app.get('/api/fidelidade/config', authMiddleware, async (req, res) => {
  const configs = await getAll('fidelidade_config');
  res.json(configs[0] || { pontos_por_real: 1, pontos_minimo_resgate: 100, valor_resgate_por_ponto: 0.05, ativo: true });
});

app.put('/api/fidelidade/config', authMiddleware, async (req, res) => {
  const configs = await getAll('fidelidade_config');
  if (configs.length > 0) {
    const updated = await update('fidelidade_config', configs[0].id, req.body);
    res.json(updated);
  } else {
    const item = await create('fidelidade_config', req.body);
    res.json(item);
  }
});

app.get('/api/nps/resumo', authMiddleware, async (req, res) => {
  const pesquisas = await getAll('nps');
  const total = pesquisas.length;
  const promotores = pesquisas.filter((n) => n.nota >= 9).length;
  const detratores = pesquisas.filter((n) => n.nota <= 6).length;
  const neutros = total - promotores - detratores;
  const nps = total > 0 ? Math.round(((promotores - detratores) / total) * 100) : 0;
  const media = total > 0 ? pesquisas.reduce((s, n) => s + n.nota, 0) / total : 0;
  res.json({ total, media, nps, promotores, detratores, neutros });
});

app.post('/api/fidelidade/pontos', authMiddleware, async (req, res) => {
  const { cliente_id, pontos } = req.body;
  const clientes = await getAll('fidelidade_clientes');
  let record = clientes.find((c) => c.cliente_id === cliente_id);
  if (record) {
    record = await update('fidelidade_clientes', record.id, { pontos: (record.pontos || 0) + pontos });
  } else {
    record = await create('fidelidade_clientes', { cliente_id, pontos, total_gasto: 0 });
  }
  res.json(record);
});

app.post('/api/fidelidade/resgatar', authMiddleware, async (req, res) => {
  const { cliente_id, pontos } = req.body;
  const clientes = await getAll('fidelidade_clientes');
  const record = clientes.find((c) => c.cliente_id === cliente_id);
  if (!record) return res.status(404).json({ error: 'Cliente não encontrado' });
  if ((record.pontos || 0) < pontos) return res.status(400).json({ error: 'Pontos insuficientes' });
  const updated = await update('fidelidade_clientes', record.id, { pontos: (record.pontos || 0) - pontos });
  res.json(updated);
});

app.post('/api/carrinhos/:id/lembrete', authMiddleware, async (req, res) => {
  const carrinho = await getById('carrinhos', Number(req.params.id));
  if (!carrinho) return res.status(404).json({ error: 'Carrinho não encontrado' });
  await update('carrinhos', carrinho.id, { whatsapp_enviado: true });
  res.json({ success: true, message: 'Lembrete enviado' });
});

app.post('/api/pagamentos/pix', authMiddleware, async (req, res) => {
  const { pedido_id, valor } = req.body;
  const item = await create('pagamentos', { pedido_id, valor, forma: 'pix', status: 'pendente', qr_code: `pix-qr-${Date.now()}`, cobranca: `cob-${Date.now()}` });
  res.status(201).json(item);
});

app.post('/api/pagamentos/cartao', authMiddleware, async (req, res) => {
  const { pedido_id, valor, parcelas } = req.body;
  const forma = parcelas > 1 ? 'cartao_credito' : 'cartao_debito';
  const item = await create('pagamentos', { pedido_id, valor, forma, status: 'aprovado', transacao_id: `txn-${Date.now()}` });
  res.status(201).json(item);
});

app.post('/api/integracoes/:id/sync', authMiddleware, async (req, res) => {
  const integracao = await getById('integracoes', Number(req.params.id));
  if (!integracao) return res.status(404).json({ error: 'Integração não encontrada' });
  await update('integracoes', integracao.id, { ultima_sync: new Date().toISOString() });
  res.json({ success: true, message: 'Sincronizado com sucesso' });
});

app.get('/api/relatorios', authMiddleware, async (req, res) => {
  res.json(await getAll('relatorios'));
});

app.use('/uploads', express.static(UPLOADS_DIR));

app.post('/api/produtos/:id/imagem', authMiddleware, (req, res) => {
  upload.single('imagem')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Arquivo muito grande. Máximo: 5MB' });
      }
      return res.status(400).json({ error: err.message || 'Erro ao fazer upload' });
    }
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    const produto = await getById('produtos', Number(req.params.id));
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    const updated = await update('produtos', produto.id, { imagem: req.file.filename });
    res.json(updated);
  });
});

export default app;
