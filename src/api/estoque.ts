import api from './axios';
import { EstoqueMovimento } from '../types';

export const getMovimentos = () => api.get<EstoqueMovimento[]>('/estoque');
export const createMovimento = (data: Omit<EstoqueMovimento, 'id' | 'createdAt'>) => api.post<EstoqueMovimento>('/estoque', data);
