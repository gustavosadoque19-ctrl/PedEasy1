import api from './axios';
import { FidelidadeConfig, FidelidadeCliente } from '../types';
import { createMockStore } from './mock-utils';

const store = createMockStore<FidelidadeCliente>('mock_fidelidade');

export const getFidelidadeConfig = async () => {
  try {
    return await api.get<FidelidadeConfig>('/fidelidade/config');
  } catch {
    console.warn('⚠️ API indisponível, usando config padrão (getFidelidadeConfig)');
    return store.mockResponse({ pontos_por_real: 1, pontos_minimo_resgate: 100, valor_resgate_por_ponto: 0.05, ativo: true });
  }
};

export const saveFidelidadeConfig = async (data: FidelidadeConfig) => {
  try {
    return await api.put<FidelidadeConfig>('/fidelidade/config', data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (saveFidelidadeConfig)');
    localStorage.setItem('mock_fidelidade_config', JSON.stringify(data));
    return store.mockResponse(data);
  }
};

export const getFidelidadeClientes = async () => {
  try {
    return await api.get<FidelidadeCliente[]>('/fidelidade/clientes');
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais (getFidelidadeClientes)');
    return store.mockResponse(store.getLocalData());
  }
};

export const adicionarPontos = async (clienteId: number, pontos: number) => {
  try {
    return await api.post<FidelidadeCliente>('/fidelidade/pontos', { cliente_id: clienteId, pontos });
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (adicionarPontos)');
    return store.mockResponse(null);
  }
};

export const resgatarPontos = async (clienteId: number, pontos: number) => {
  try {
    return await api.post<FidelidadeCliente>('/fidelidade/resgatar', { cliente_id: clienteId, pontos });
  } catch {
    console.warn('⚠️ API indisponível');
    return store.mockResponse(null);
  }
};
