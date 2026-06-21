import api from './axios';
import { Produto } from '../types';
import { createMockStore } from './mock-utils';

const store = createMockStore<Produto>('mock_produtos');

export const getProdutos = async () => {
  try {
    return await api.get<Produto[]>('/produtos');
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais (getProdutos)');
    return store.mockResponse(store.getLocalData());
  }
};

export const getProduto = async (id: number) => {
  try {
    return await api.get<Produto>(`/produtos/${id}`);
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais (getProduto)');
    const data = store.getLocalData();
    const item = data.find((p) => p.id === id);
    if (!item) throw new Error('Produto não encontrado');
    return store.mockResponse(item);
  }
};

export const createProduto = async (data: Omit<Produto, 'id' | 'createdAt'>) => {
  try {
    return await api.post<Produto>('/produtos', data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (createProduto)');
    const list = store.getLocalData();
    const newItem: Produto = { ...data, id: store.nextId(list), createdAt: new Date().toISOString() };
    list.push(newItem);
    store.saveLocalData(list);
    return store.mockResponse(newItem);
  }
};

export const updateProduto = async (id: number, data: Partial<Produto>) => {
  try {
    return await api.put<Produto>(`/produtos/${id}`, data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (updateProduto)');
    const list = store.getLocalData();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Produto não encontrado');
    list[index] = { ...list[index], ...data };
    store.saveLocalData(list);
    return store.mockResponse(list[index]);
  }
};

export const uploadProdutoImagem = async (id: number, file: File) => {
  try {
    const formData = new FormData();
    formData.append('imagem', file);
    return await api.post<Produto>(`/produtos/${id}/imagem`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  } catch {
    console.warn('⚠️ API indisponível, upload não disponível offline');
    throw new Error('Upload disponível apenas com servidor online');
  }
};

export const getImagemUrl = (filename?: string) => {
  if (!filename) return '';
  // Valida que o filename não contém path traversal
  if (filename.includes('..') || filename.includes('/')) return '';
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const baseUrl = apiUrl.replace(/\/api\/?$/, '') || '';
  // Só permite URLs relativas (mesmo origin) para segurança
  return `${baseUrl}/uploads/${filename}`;
};

export const deleteProduto = async (id: number) => {
  try {
    return await api.delete(`/produtos/${id}`);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente (deleteProduto)');
    const list = store.getLocalData();
    const filtered = list.filter((p) => p.id !== id);
    if (filtered.length === list.length) throw new Error('Produto não encontrado');
    store.saveLocalData(filtered);
    return store.mockResponse(null);
  }
};
