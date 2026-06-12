import api from './axios';
import { Pedido } from '../types';
import { createMockStore } from './mock-utils';

const store = createMockStore<Pedido>('mock_pedidos');

export const getPedidos = async () => {
  try {
    return await api.get<Pedido[]>('/pedidos');
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais (getPedidos)');
    return store.mockResponse(store.getLocalData());
  }
};

export const getPedido = async (id: number) => {
  try {
    return await api.get<Pedido>(`/pedidos/${id}`);
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais (getPedido)');
    const data = store.getLocalData();
    const item = data.find((p) => p.id === id);
    if (!item) throw new Error('Pedido não encontrado');
    return store.mockResponse(item);
  }
};

export const createPedido = async (data: Omit<Pedido, 'id' | 'createdAt'>) => {
  try {
    return await api.post<Pedido>('/pedidos', data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (createPedido)');
    const list = store.getLocalData();
    const newItem: Pedido = { ...data, id: store.nextId(list), createdAt: new Date().toISOString() };
    list.push(newItem);
    store.saveLocalData(list);
    return store.mockResponse(newItem);
  }
};

export const updatePedido = async (id: number, data: Partial<Pedido>) => {
  try {
    return await api.put<Pedido>(`/pedidos/${id}`, data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (updatePedido)');
    const list = store.getLocalData();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Pedido não encontrado');
    list[index] = { ...list[index], ...data };
    store.saveLocalData(list);
    return store.mockResponse(list[index]);
  }
};

export const deletePedido = async (id: number) => {
  try {
    return await api.delete(`/pedidos/${id}`);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (deletePedido)');
    const list = store.getLocalData();
    const filtered = list.filter((p) => p.id !== id);
    if (filtered.length === list.length) throw new Error('Pedido não encontrado');
    store.saveLocalData(filtered);
    return store.mockResponse(null);
  }
};

export const getPedidosAbertos = async () => {
  try {
    return await api.get<Pedido[]>('/pedidos/abertos');
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais (getPedidosAbertos)');
    return store.mockResponse(store.getLocalData().filter((p) => p.status !== 'fechado' && p.status !== 'cancelado'));
  }
};
