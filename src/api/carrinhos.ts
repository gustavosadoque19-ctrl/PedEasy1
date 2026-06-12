import api from './axios';
import { CarrinhoAbandonado } from '../types';
import { createMockStore } from './mock-utils';

const store = createMockStore<CarrinhoAbandonado>('mock_carrinhos');

export const getCarrinhosAbandonados = async () => {
  try {
    return await api.get<CarrinhoAbandonado[]>('/carrinhos');
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais (getCarrinhos)');
    return store.mockResponse(store.getLocalData());
  }
};

export const atualizarCarrinho = async (id: number, data: Partial<CarrinhoAbandonado>) => {
  try {
    return await api.put<CarrinhoAbandonado>(`/carrinhos/${id}`, data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (atualizarCarrinho)');
    const list = store.getLocalData();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Carrinho não encontrado');
    list[index] = { ...list[index], ...data };
    store.saveLocalData(list);
    return store.mockResponse(list[index]);
  }
};

export const enviarLembreteCarrinho = async (id: number) => {
  try {
    return await api.post(`/carrinhos/${id}/lembrete`);
  } catch {
    console.warn('⚠️ API indisponível');
    return store.mockResponse(null);
  }
};
