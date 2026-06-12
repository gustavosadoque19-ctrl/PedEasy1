import api from './axios';
import { NFe, FocusConfig } from '../types';
import { createMockStore } from './mock-utils';

const store = createMockStore<NFe>('mock_nfe');

export const getNFeList = async () => {
  try {
    return await api.get<NFe[]>('/nfe');
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais (getNFeList)');
    return store.mockResponse(store.getLocalData());
  }
};

export const emitirNFe = async (pedido_id: number) => {
  try {
    return await api.post<NFe>('/nfe/emitir', { pedido_id });
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (emitirNFe)');
    const list = store.getLocalData();
    const nova: NFe = {
      id: store.nextId(list),
      pedido_id,
      numero_nf: String(1000 + list.length + 1),
      chave_acesso: Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join(''),
      status: 'autorizada',
      valor: 0,
      createdAt: new Date().toISOString(),
    };
    list.push(nova);
    store.saveLocalData(list);
    return store.mockResponse(nova);
  }
};

export const cancelarNFe = async (id: number, motivo: string) => {
  try {
    return await api.post<NFe>(`/nfe/cancelar/${id}`, { motivo });
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (cancelarNFe)');
    const list = store.getLocalData();
    const index = list.findIndex((n) => n.id === id);
    if (index === -1) throw new Error('NFe não encontrada');
    list[index].status = 'cancelada';
    store.saveLocalData(list);
    return store.mockResponse(list[index]);
  }
};

export const consultarNFe = async (id: number) => {
  try {
    return await api.post<NFe>(`/nfe/consultar/${id}`);
  } catch {
    console.warn('⚠️ API indisponível (consultarNFe)');
    throw new Error('API indisponível');
  }
};

export const getFocusConfig = async () => {
  try {
    return await api.get<FocusConfig>('/nfe/focus/config');
  } catch {
    return store.mockResponse({ token: null, ambiente: 'homologacao', cidade: '', uf: '' });
  }
};
