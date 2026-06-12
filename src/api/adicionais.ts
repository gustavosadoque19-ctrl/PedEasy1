import api from './axios';
import { Adicional, CategoriaAdicional } from '../types';

interface MockResponse<T> {
  data: T;
}

export const getCategoriasAdicionais = async () => {
  try {
    return await api.get<CategoriaAdicional[]>('/adicionais/categorias');
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais');
    const stored = localStorage.getItem('mock_categorias_adicionais');
    return { data: stored ? JSON.parse(stored) : [] } as MockResponse<CategoriaAdicional[]>;
  }
};

export const createCategoriaAdicional = async (data: Omit<CategoriaAdicional, 'id' | 'createdAt'>) => {
  try {
    return await api.post<CategoriaAdicional>('/adicionais/categorias', data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente');
    const list = JSON.parse(localStorage.getItem('mock_categorias_adicionais') || '[]');
    const id = list.length > 0 ? Math.max(...list.map((c: CategoriaAdicional) => c.id ?? 0)) + 1 : 1;
    const item = { ...data, id, createdAt: new Date().toISOString() };
    list.push(item);
    localStorage.setItem('mock_categorias_adicionais', JSON.stringify(list));
    return { data: item } as MockResponse<CategoriaAdicional>;
  }
};

export const updateCategoriaAdicional = async (id: number, data: Partial<CategoriaAdicional>) => {
  try {
    return await api.put<CategoriaAdicional>(`/adicionais/categorias/${id}`, data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente');
    const list = JSON.parse(localStorage.getItem('mock_categorias_adicionais') || '[]');
    const idx = list.findIndex((c: CategoriaAdicional) => c.id === id);
    if (idx === -1) throw new Error('Categoria não encontrada');
    list[idx] = { ...list[idx], ...data };
    localStorage.setItem('mock_categorias_adicionais', JSON.stringify(list));
    return { data: list[idx] } as MockResponse<CategoriaAdicional>;
  }
};

export const deleteCategoriaAdicional = async (id: number) => {
  try {
    return await api.delete(`/adicionais/categorias/${id}`);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente');
    const list = JSON.parse(localStorage.getItem('mock_categorias_adicionais') || '[]');
    const filtered = list.filter((c: CategoriaAdicional) => c.id !== id);
    localStorage.setItem('mock_categorias_adicionais', JSON.stringify(filtered));
    return { data: null } as MockResponse<null>;
  }
};

export const getAdicionais = async () => {
  try {
    return await api.get<Adicional[]>('/adicionais');
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais');
    const stored = localStorage.getItem('mock_adicionais');
    return { data: stored ? JSON.parse(stored) : [] } as MockResponse<Adicional[]>;
  }
};

export const getAdicional = async (id: number) => {
  try {
    return await api.get<Adicional>(`/adicionais/${id}`);
  } catch {
    console.warn('⚠️ API indisponível, usando dados locais');
    const list = JSON.parse(localStorage.getItem('mock_adicionais') || '[]');
    const item = list.find((a: Adicional) => a.id === id);
    if (!item) throw new Error('Adicional não encontrado');
    return { data: item } as MockResponse<Adicional>;
  }
};

export const createAdicional = async (data: Omit<Adicional, 'id' | 'createdAt'>) => {
  try {
    return await api.post<Adicional>('/adicionais', data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente');
    const list = JSON.parse(localStorage.getItem('mock_adicionais') || '[]');
    const id = list.length > 0 ? Math.max(...list.map((a: Adicional) => a.id ?? 0)) + 1 : 1;
    const item = { ...data, id, createdAt: new Date().toISOString() };
    list.push(item);
    localStorage.setItem('mock_adicionais', JSON.stringify(list));
    return { data: item } as MockResponse<Adicional>;
  }
};

export const updateAdicional = async (id: number, data: Partial<Adicional>) => {
  try {
    return await api.put<Adicional>(`/adicionais/${id}`, data);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente');
    const list = JSON.parse(localStorage.getItem('mock_adicionais') || '[]');
    const idx = list.findIndex((a: Adicional) => a.id === id);
    if (idx === -1) throw new Error('Adicional não encontrado');
    list[idx] = { ...list[idx], ...data };
    localStorage.setItem('mock_adicionais', JSON.stringify(list));
    return { data: list[idx] } as MockResponse<Adicional>;
  }
};

export const deleteAdicional = async (id: number) => {
  try {
    return await api.delete(`/adicionais/${id}`);
  } catch {
    console.warn('⚠️ API indisponível, salvando localmente');
    const list = JSON.parse(localStorage.getItem('mock_adicionais') || '[]');
    const filtered = list.filter((a: Adicional) => a.id !== id);
    localStorage.setItem('mock_adicionais', JSON.stringify(filtered));
    return { data: null } as MockResponse<null>;
  }
};
