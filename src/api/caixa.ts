import api from './axios';
import { Caixa, CaixaMovimento } from '../types';
import { createMockStore } from './mock-utils';

const store = createMockStore<Caixa>('mock_caixas');

function nextMovId(caixa: Caixa): number {
  const movs = caixa.movimentos || [];
  return movs.length > 0 ? Math.max(...movs.map((m) => m.id ?? 0)) + 1 : 1;
}

export const getCaixaAberto = async () => {
  try {
    return await api.get<Caixa | null>('/caixa/aberto');
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais (getCaixaAberto)');
    const list = store.getLocalData();
    const aberto = list.find((c) => c.status === 'aberto') || null;
    return store.mockResponse(aberto);
  }
};

export const abrirCaixa = async (data: { funcionario_id: number; saldo_inicial: number }) => {
  try {
    return await api.post<Caixa>('/caixa/abrir', data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (abrirCaixa)');
    const list = store.getLocalData();
    const novo: Caixa = {
      id: store.nextId(list),
      funcionario_id: data.funcionario_id,
      data_abertura: new Date().toISOString(),
      saldo_inicial: data.saldo_inicial,
      status: 'aberto',
      movimentos: [],
    };
    list.push(novo);
    store.saveLocalData(list);
    return store.mockResponse(novo);
  }
};

export const fecharCaixa = async (id: number) => {
  try {
    return await api.post<Caixa>(`/caixa/fechar/${id}`);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (fecharCaixa)');
    const list = store.getLocalData();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Caixa não encontrado');
    const totalEntradas = (list[index].movimentos || [])
      .filter((m) => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0);
    const totalSaidas = (list[index].movimentos || [])
      .filter((m) => m.tipo === 'saida').reduce((s, m) => s + m.valor, 0);
    list[index] = {
      ...list[index],
      status: 'fechado',
      data_fechamento: new Date().toISOString(),
      saldo_final: list[index].saldo_inicial + totalEntradas - totalSaidas,
    };
    store.saveLocalData(list);
    return store.mockResponse(list[index]);
  }
};

export const addMovimento = async (data: Omit<CaixaMovimento, 'id' | 'createdAt'>) => {
  try {
    return await api.post<CaixaMovimento>('/caixa/movimento', data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (addMovimento)');
    const list = store.getLocalData();
    const index = list.findIndex((c) => c.id === data.caixa_id);
    if (index === -1) throw new Error('Caixa não encontrado');
    const novo: CaixaMovimento = {
      ...data,
      id: nextMovId(list[index]),
      createdAt: new Date().toISOString(),
    };
    list[index] = {
      ...list[index],
      movimentos: [...(list[index].movimentos || []), novo],
    };
    store.saveLocalData(list);
    return store.mockResponse(novo);
  }
};

export const getHistoricoCaixa = async () => {
  try {
    return await api.get<Caixa[]>('/caixa/historico');
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais (getHistoricoCaixa)');
    return store.mockResponse(store.getLocalData());
  }
};
