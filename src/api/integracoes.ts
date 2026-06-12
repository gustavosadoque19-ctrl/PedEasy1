import api from './axios';
import { IntegracaoPDV } from '../types';
import { createMockStore } from './mock-utils';

const store = createMockStore<IntegracaoPDV>('mock_integracoes');

export const getIntegracoes = async () => {
  try {
    return await api.get<IntegracaoPDV[]>('/integracoes');
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais (getIntegracoes)');
    return store.mockResponse(store.getLocalData());
  }
};

export const createIntegracao = async (data: Omit<IntegracaoPDV, 'id' | 'createdAt'>) => {
  try {
    return await api.post<IntegracaoPDV>('/integracoes', data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (createIntegracao)');
    const list = store.getLocalData();
    const newItem: IntegracaoPDV = { ...data, id: store.nextId(list), createdAt: new Date().toISOString() };
    list.push(newItem);
    store.saveLocalData(list);
    return store.mockResponse(newItem);
  }
};

export const updateIntegracao = async (id: number, data: Partial<IntegracaoPDV>) => {
  try {
    return await api.put<IntegracaoPDV>(`/integracoes/${id}`, data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (updateIntegracao)');
    const list = store.getLocalData();
    const index = list.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Integração não encontrada');
    list[index] = { ...list[index], ...data };
    store.saveLocalData(list);
    return store.mockResponse(list[index]);
  }
};

export const deleteIntegracao = async (id: number) => {
  try {
    return await api.delete(`/integracoes/${id}`);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (deleteIntegracao)');
    const list = store.getLocalData();
    const filtered = list.filter((i) => i.id !== id);
    if (filtered.length === list.length) throw new Error('Integração não encontrada');
    store.saveLocalData(filtered);
    return store.mockResponse(null);
  }
};

export const sincronizarIntegracao = async (id: number) => {
  try {
    return await api.post(`/integracoes/${id}/sync`);
  } catch {
    console.warn('⚠️ API indisponível, simulando sincronização');
    return store.mockResponse({ success: true });
  }
};
