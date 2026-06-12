import api from './axios';
import { NPSPesquisa } from '../types';
import { createMockStore } from './mock-utils';

const store = createMockStore<NPSPesquisa>('mock_nps');

export const getNPS = async () => {
  try {
    return await api.get<NPSPesquisa[]>('/nps');
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais (getNPS)');
    return store.mockResponse(store.getLocalData());
  }
};

export const createNPS = async (data: Omit<NPSPesquisa, 'id' | 'createdAt'>) => {
  try {
    return await api.post<NPSPesquisa>('/nps', data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (createNPS)');
    const list = store.getLocalData();
    const newItem: NPSPesquisa = { ...data, id: store.nextId(list), createdAt: new Date().toISOString() };
    list.push(newItem);
    store.saveLocalData(list);
    return store.mockResponse(newItem);
  }
};

export const getNPSResumo = async () => {
  try {
    return await api.get('/nps/resumo');
  } catch {
    console.warn('⚠️ API indisponível');
    const list = store.getLocalData();
    const total = list.length;
    const promotores = list.filter((n) => n.nota >= 9).length;
    const detratores = list.filter((n) => n.nota <= 6).length;
    const nps = total > 0 ? Math.round(((promotores - detratores) / total) * 100) : 0;
    return store.mockResponse({ total, media: list.reduce((s, n) => s + n.nota, 0) / (total || 1), nps, promotores, detratores, neutros: total - promotores - detratores });
  }
};
