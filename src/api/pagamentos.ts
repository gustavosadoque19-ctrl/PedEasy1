import api from './axios';
import { PagamentoOnline } from '../types';
import { createMockStore } from './mock-utils';

const store = createMockStore<PagamentoOnline>('mock_pagamentos');

export const getPagamentos = async () => {
  try {
    return await api.get<PagamentoOnline[]>('/pagamentos');
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais (getPagamentos)');
    return store.mockResponse(store.getLocalData());
  }
};

export const criarCobrancaPix = async (pedidoId: number, valor: number) => {
  try {
    return await api.post<PagamentoOnline>('/pagamentos/pix', { pedido_id: pedidoId, valor });
  } catch {
    console.warn('⚠️ API indisponível, simulando cobrança PIX');
    const list = store.getLocalData();
    const newItem: PagamentoOnline = {
      id: store.nextId(list),
      pedido_id: pedidoId,
      valor,
      forma: 'pix',
      status: 'pendente',
      qr_code: '000201010212261060014br.gov.bcb.pix2588pix.example.com/payment/123456789',
      cobranca: 'pix.example.com/cobranca/123456789',
      createdAt: new Date().toISOString(),
    };
    list.push(newItem);
    store.saveLocalData(list);
    return store.mockResponse(newItem);
  }
};

export const criarCobrancaCartao = async (pedidoId: number, valor: number, parcelas: number) => {
  try {
    return await api.post<PagamentoOnline>('/pagamentos/cartao', { pedido_id: pedidoId, valor, parcelas });
  } catch {
    console.warn('⚠️ API indisponível, simulando cobrança cartão');
    const list = store.getLocalData();
    const newItem: PagamentoOnline = {
      id: store.nextId(list),
      pedido_id: pedidoId,
      valor,
      forma: parcelas > 1 ? 'cartao_credito' : 'cartao_debito',
      status: 'aprovado',
      transacao_id: `sim_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    list.push(newItem);
    store.saveLocalData(list);
    return store.mockResponse(newItem);
  }
};

export const consultarPagamento = async (id: number) => {
  try {
    return await api.get<PagamentoOnline>(`/pagamentos/${id}`);
  } catch {
    console.warn('⚠️ API indisponível, consultando localmente');
    const item = store.getLocalData().find((p) => p.id === id);
    if (!item) throw new Error('Pagamento não encontrado');
    return store.mockResponse(item);
  }
};
