import api from './axios';
import { Cupom } from '../types';
import { createMockStore } from './mock-utils';

const store = createMockStore<Cupom>('mock_cupons');

export const getCupons = async () => {
  try {
    return await api.get<Cupom[]>('/cupons');
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais (getCupons)');
    return store.mockResponse(store.getLocalData());
  }
};

export const createCupom = async (data: Omit<Cupom, 'id' | 'createdAt'>) => {
  try {
    return await api.post<Cupom>('/cupons', data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (createCupom)');
    const list = store.getLocalData();
    const newItem: Cupom = { ...data, id: store.nextId(list), createdAt: new Date().toISOString() };
    list.push(newItem);
    store.saveLocalData(list);
    return store.mockResponse(newItem);
  }
};

export const updateCupom = async (id: number, data: Partial<Cupom>) => {
  try {
    return await api.put<Cupom>(`/cupons/${id}`, data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (updateCupom)');
    const list = store.getLocalData();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Cupom não encontrado');
    list[index] = { ...list[index], ...data };
    store.saveLocalData(list);
    return store.mockResponse(list[index]);
  }
};

export const deleteCupom = async (id: number) => {
  try {
    return await api.delete(`/cupons/${id}`);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (deleteCupom)');
    const list = store.getLocalData();
    const filtered = list.filter((c) => c.id !== id);
    if (filtered.length === list.length) throw new Error('Cupom não encontrado');
    store.saveLocalData(filtered);
    return store.mockResponse(null);
  }
};
