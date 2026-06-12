import { Router } from 'express';
import { authMiddleware } from '../auth.js';
import { getAll, getById, create, update, remove, query } from '../store.js';
import * as focus from '../focus.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  const list = getAll('nfe');
  res.json(list);
});

router.get('/:id', authMiddleware, (req, res) => {
  const item = getById('nfe', Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'NFe não encontrada' });
  res.json(item);
});

router.post('/emitir', authMiddleware, async (req, res) => {
  try {
    const { pedido_id } = req.body;
    if (!pedido_id) return res.status(400).json({ error: 'pedido_id é obrigatório' });

    const pedido = getById('pedidos', Number(pedido_id));
    if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });

    const cliente = pedido.cliente_id ? getById('clientes', pedido.cliente_id) : null;

    const produtos = (pedido.itens || []).map((item) => ({
      nome: item.produto_nome,
      ncm: item.ncm || '21069090',
      cfop: '5102',
      cst: '060',
      quantidade: item.quantidade,
      valor_unitario: item.preco_unitario,
      valor_total: item.total,
      unidade: 'UN',
    }));

    const dadosFocus = {
      pedido_id,
      cliente: cliente ? {
        nome: cliente.nome,
        cpf_cnpj: cliente.documento || undefined,
        telefone: cliente.telefone,
        email: cliente.email,
        endereco: cliente.endereco ? {
          logradouro: cliente.endereco,
          bairro: 'Centro',
          cidade: process.env.FOCUS_CIDADE || 'Sao Paulo',
          uf: process.env.FOCUS_UF || 'SP',
          cep: '00000000',
        } : undefined,
      } : { nome: 'Consumidor' },
      itens: produtos,
      formas_pagamento: [{
        meio_pagamento: pedido.forma_pagamento === 'dinheiro' ? '01' : pedido.forma_pagamento === 'credito' ? '03' : '04',
        valor: pedido.valor_total,
      }],
    };

    const result = await focus.emitirNFCe(dadosFocus);

    const nfe = create('nfe', {
      pedido_id: Number(pedido_id),
      cliente_id: pedido.cliente_id || null,
      numero_nf: result.numero,
      chave_acesso: result.chave_acesso,
      status: result.status === 'autorizada' ? 'autorizada' : result.status === 'rejeitada' ? 'rejeitada' : 'pendente',
      valor: pedido.valor_total,
      xml: result.xml,
      ref: result.ref,
      protocolo: result.protocolo,
      url_danfe: result.url_danfe,
      url_qrcode: result.url_qrcode,
    });

    res.json(nfe);
  } catch (err) {
    console.error('Erro ao emitir NFC-e:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Erro ao emitir NFC-e',
      detalhe: err.response?.data?.erros || err.message,
    });
  }
});

router.post('/cancelar/:id', authMiddleware, async (req, res) => {
  try {
    const { motivo } = req.body;
    if (!motivo) return res.status(400).json({ error: 'Motivo do cancelamento é obrigatório' });

    const nfe = getById('nfe', Number(req.params.id));
    if (!nfe) return res.status(404).json({ error: 'NFe não encontrada' });
    if (nfe.status !== 'autorizada') return res.status(400).json({ error: 'NFe não está autorizada' });

    const result = await focus.cancelarNFCe(nfe.ref, motivo);

    const updated = update('nfe', nfe.id, { status: 'cancelada' });
    res.json(updated);
  } catch (err) {
    console.error('Erro ao cancelar NFC-e:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Erro ao cancelar NFC-e',
      detalhe: err.response?.data?.erros || err.message,
    });
  }
});

router.post('/consultar/:id', authMiddleware, async (req, res) => {
  try {
    const nfe = getById('nfe', Number(req.params.id));
    if (!nfe) return res.status(404).json({ error: 'NFe não encontrada' });

    const result = await focus.consultarNFCe(nfe.ref);
    const updated = update('nfe', nfe.id, {
      status: result.status === 'autorizada' ? 'autorizada' : result.status === 'cancelada' ? 'cancelada' : 'rejeitada',
      protocolo: result.protocolo,
    });

    res.json(updated);
  } catch (err) {
    console.error('Erro ao consultar NFC-e:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erro ao consultar NFC-e' });
  }
});

router.get('/focus/config', authMiddleware, (req, res) => {
  res.json({
    token: process.env.FOCUS_TOKEN ? '********' : null,
    ambiente: process.env.FOCUS_TOKEN?.startsWith('test') ? 'homologacao' : 'producao',
    cidade: process.env.FOCUS_CIDADE || 'Sao Paulo',
    uf: process.env.FOCUS_UF || 'SP',
  });
});

export default router;
