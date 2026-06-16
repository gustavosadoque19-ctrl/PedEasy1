import api from './axios';
import { Produto, PedidoItem } from '../types';

interface MockResponse<T> {
  data: T;
}

export async function getProdutosCardapio(slug?: string) {
  try {
    const params = slug ? { slug } : {};
    return await api.get<Produto[]>('/cardapio/produtos', { params });
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais');
    const stored = localStorage.getItem('mock_produtos');
    const data = stored ? JSON.parse(stored) : [];
    return { data: data.filter((p: Produto) => p.ativo !== false) } as MockResponse<Produto[]>;
  }
}

export async function criarPedidoDelivery(data: {
  slug?: string;
  cliente_nome: string;
  cliente_telefone: string;
  endereco_entrega: string;
  forma_pagamento: string;
  observacao: string;
  itens: PedidoItem[];
  taxa_entrega?: number;
  troco_para?: number;
}) {
  try {
    return await api.post('/cardapio/pedidos', data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente');
    const list = JSON.parse(localStorage.getItem('mock_pedidos') || '[]');
    const id = list.length > 0 ? Math.max(...list.map((p: { id?: number }) => p.id ?? 0)) + 1 : 1;
    const valor_itens = data.itens.reduce((s, i) => s + (i.total || i.quantidade * i.preco_unitario), 0);
    const pedido = {
      id,
      ...data,
      tipo: 'delivery',
      status: 'aberto',
      funcionario_id: 0,
      funcionario_nome: 'Cardápio Digital',
      valor_total: valor_itens + (data.taxa_entrega || 0),
      desconto: 0,
      createdAt: new Date().toISOString(),
    };
    list.push(pedido);
    localStorage.setItem('mock_pedidos', JSON.stringify(list));
    return { data: pedido } as MockResponse<typeof pedido>;
  }
}

export async function getDeliveryConfig(slug?: string) {
  try {
    const params = slug ? { slug } : {};
    return await api.get('/config/delivery', { params });
  } catch {
    return { data: { taxa_entrega: 0, tempo_estimado: '30-50 min', horario_funcionamento: '', horarios: [] } } as MockResponse<{
      taxa_entrega: number;
      tempo_estimado: string;
      horario_funcionamento: string;
      horarios: { dia: string; abertura: string; fechamento: string; fechado: boolean }[];
    }>;
  }
}

export async function saveDeliveryConfig(data: {
  taxa_entrega?: number;
  tempo_estimado?: string;
  horarios?: { dia: string; abertura: string; fechamento: string; fechado: boolean }[];
}) {
  return await api.put('/config/delivery', data);
}
