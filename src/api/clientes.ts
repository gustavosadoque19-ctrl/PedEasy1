import api from './axios';
import { Cliente } from '../types';
import { createMockStore } from './mock-utils';

const store = createMockStore<Cliente>('mock_clientes');

export const getClientes = async () => {
  try {
    return await api.get<Cliente[]>('/clientes');
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais (getClientes)');
    return store.mockResponse(store.getLocalData());
  }
};

export const getCliente = async (id: number) => {
  try {
    return await api.get<Cliente>(`/clientes/${id}`);
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais (getCliente)');
    const data = store.getLocalData();
    const item = data.find((c) => c.id === id);
    if (!item) throw new Error('Cliente não encontrado');
    return store.mockResponse(item);
  }
};

export const createCliente = async (data: Omit<Cliente, 'id' | 'createdAt'>) => {
  try {
    return await api.post<Cliente>('/clientes', data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (createCliente)');
    const list = store.getLocalData();
    const newItem: Cliente = { ...data, id: store.nextId(list), createdAt: new Date().toISOString() };
    list.push(newItem);
    store.saveLocalData(list);
    return store.mockResponse(newItem);
  }
};

export const updateCliente = async (id: number, data: Partial<Cliente>) => {
  try {
    return await api.put<Cliente>(`/clientes/${id}`, data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (updateCliente)');
    const list = store.getLocalData();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Cliente não encontrado');
    list[index] = { ...list[index], ...data };
    store.saveLocalData(list);
    return store.mockResponse(list[index]);
  }
};

export const deleteCliente = async (id: number) => {
  try {
    return await api.delete(`/clientes/${id}`);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (deleteCliente)');
    const list = store.getLocalData();
    const filtered = list.filter((c) => c.id !== id);
    if (filtered.length === list.length) throw new Error('Cliente não encontrado');
    store.saveLocalData(filtered);
    return store.mockResponse(null);
  }
};
