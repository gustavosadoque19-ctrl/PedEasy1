import api from './axios';
import { PagamentoOnline } from '../types';

interface CardData {
  number: string;
  holder_name: string;
  exp_month: string;
  exp_year: string;
  cvv: string;
}

export const getPagamentos = async () => {
  return await api.get<PagamentoOnline[]>('/pagamentos');
};

export const criarCobrancaPix = async (pedidoId: number, valor: number) => {
  return await api.post<PagamentoOnline>('/pagamentos/pix', { pedido_id: pedidoId, valor });
};

export const criarCobrancaCartao = async (pedidoId: number, valor: number, parcelas: number, card: CardData) => {
  return await api.post<PagamentoOnline>('/pagamentos/cartao', { pedido_id: pedidoId, valor, parcelas, card });
};

export const consultarPagamento = async (id: number) => {
  return await api.get<PagamentoOnline>(`/pagamentos/${id}`);
};

export const consultarStatusPix = async (transacaoId: string) => {
  return await api.get<{ status: string; qr_code?: string; cobranca?: string }>(`/pagamentos/pix/status/${transacaoId}`);
};
