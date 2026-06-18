import { Router } from 'express';
import { authMiddleware } from '../auth.js';
import { getAll, getById, create, update, remove } from '../store.js';
import * as focus from '../focus.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  const list = await getAll('nfe', req.tenant_id);
  res.json(list);
});

router.get('/:id', authMiddleware, async (req, res) => {
  const item = await getById('nfe', Number(req.params.id), req.tenant_id);
  if (!item) return res.status(404).json({ error: 'NFe não encontrada' });
  res.json(item);
});

router.post('/emitir', authMiddleware, async (req, res) => {
  try {
    const { pedido_id } = req.body;
    if (!pedido_id) return res.status(400).json({ error: 'pedido_id é obrigatório' });

    const pedido = await getById('pedidos', Number(pedido_id), req.tenant_id);
    if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });

    const cliente = pedido.cliente_id ? await getById('clientes', pedido.cliente_id, req.tenant_id) : null;

    const produtos = (pedido.itens || []).map((item, i) => ({
      numero_item: String(i + 1),
      codigo_produto: String(item.produto_id),
      descricao: item.produto_nome,
      codigo_ncm: item.ncm || '21069090',
      cfop: '5102',
      unidade_comercial: 'UN',
      unidade_tributavel: 'UN',
      quantidade_comercial: item.quantidade,
      quantidade_tributavel: item.quantidade,
      valor_unitario_comercial: item.preco_unitario,
      valor_unitario_tributavel: item.preco_unitario,
      valor_bruto: item.total,
      icms_origem: '0',
      icms_situacao_tributaria: '102',
    }));

    const formaPagamentoMap = {
      dinheiro: '01',
      credito: '03',
      debito: '04',
      pix: '10',
      vale_refeicao: '11',
      vale_alimentacao: '12',
      vale_combustivel: '13',
    };

    const dadosFocus = {
      pedido_id,
      cnpj_emitente: process.env.FOCUS_CNPJ || '',
      cliente: cliente ? {
        nome: cliente.nome,
        cpf_cnpj: cliente.documento || undefined,
        telefone: cliente.telefone,
        endereco: cliente.endereco ? {
          logradouro: cliente.endereco.split(',')[0]?.trim() || cliente.endereco,
          numero: '0',
          bairro: 'Centro',
          cidade: process.env.FOCUS_CIDADE || 'Sao Paulo',
          uf: process.env.FOCUS_UF || 'SP',
          cep: '00000000',
        } : undefined,
      } : { nome: 'Consumidor' },
      itens: produtos,
      formas_pagamento: [{
        forma_pagamento: formaPagamentoMap[pedido.forma_pagamento] || '99',
        valor_pagamento: pedido.valor_total,
      }],
    };

    const result = await focus.emitirNFCe(dadosFocus);

    const statusMap = {
      autorizado: 'autorizada',
      erro_autorizacao: 'rejeitada',
    };

    const nfe = await create('nfe', {
      pedido_id: Number(pedido_id),
      cliente_id: pedido.cliente_id || null,
      numero_nf: result.numero,
      chave_acesso: result.chave_nfe,
      status: statusMap[result.status] || 'pendente',
      valor: pedido.valor_total,
      xml: result.caminho_xml_nota_fiscal,
      ref: result.ref,
      protocolo: result.status_sefaz,
      url_danfe: result.caminho_danfe,
      url_qrcode: result.qrcode_url,
    }, req.tenant_id);

    res.json(nfe);
  } catch (err) {
    console.error('Erro ao emitir NFC-e:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Erro ao emitir NFC-e',
      detalhe: err.response?.data?.erros || err.response?.data?.mensagem || err.message,
    });
  }
});

router.post('/cancelar/:id', authMiddleware, async (req, res) => {
  try {
    const { motivo } = req.body;
    if (!motivo) return res.status(400).json({ error: 'Motivo do cancelamento é obrigatório' });

    const nfe = await getById('nfe', Number(req.params.id));
    if (!nfe) return res.status(404).json({ error: 'NFe não encontrada' });
    if (nfe.status !== 'autorizada') return res.status(400).json({ error: 'NFe não está autorizada' });

    const result = await focus.cancelarNFCe(nfe.ref, motivo);

    const updated = await update('nfe', nfe.id, { status: 'cancelada' }, req.tenant_id);
    res.json(updated);
  } catch (err) {
    console.error('Erro ao cancelar NFC-e:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Erro ao cancelar NFC-e',
      detalhe: err.response?.data?.erros || err.response?.data?.mensagem || err.message,
    });
  }
});

router.post('/consultar/:id', authMiddleware, async (req, res) => {
  try {
    const nfe = await getById('nfe', Number(req.params.id), req.tenant_id);
    if (!nfe) return res.status(404).json({ error: 'NFe não encontrada' });

    const result = await focus.consultarNFCe(nfe.ref);
    const statusMap = {
      autorizado: 'autorizada',
      cancelado: 'cancelada',
      erro_autorizacao: 'rejeitada',
    };
    const updated = await update('nfe', nfe.id, {
      status: statusMap[result.status] || 'pendente',
      protocolo: result.status_sefaz,
    }, req.tenant_id);

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
