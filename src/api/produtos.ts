import api from './axios';
import { Produto } from '../types';

export const getProdutos = async () => {
  return await api.get<Produto[]>('/produtos');
};

export const getProduto = async (id: number) => {
  return await api.get<Produto>(`/produtos/${id}`);
};

export const createProduto = async (data: Omit<Produto, 'id' | 'createdAt'>) => {
  return await api.post<Produto>('/produtos', data);
};

export const updateProduto = async (id: number, data: Partial<Produto>) => {
  return await api.put<Produto>(`/produtos/${id}`, data);
};

export const uploadProdutoImagem = async (id: number, file: File) => {
  const formData = new FormData();
  formData.append('imagem', file);
  return await api.post<Produto>(`/produtos/${id}/imagem`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getImagemUrl = (filename?: string) => {
  if (!filename) return '';
  if (filename.includes('..') || filename.includes('/')) return '';
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const baseUrl = apiUrl.replace(/\/api\/?$/, '') || '';
  return `${baseUrl}/uploads/${filename}`;
};

export const deleteProduto = async (id: number) => {
  await api.delete(`/produtos/${id}`);
};
