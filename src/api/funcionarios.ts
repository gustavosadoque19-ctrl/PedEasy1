import api from './axios';
import { Funcionario } from '../types';

export const getFuncionarios = () => api.get<Funcionario[]>('/funcionarios');
export const getFuncionario = (id: number) => api.get<Funcionario>(`/funcionarios/${id}`);
export const createFuncionario = (data: Omit<Funcionario, 'id' | 'createdAt'>) => api.post<Funcionario>('/funcionarios', data);
export const updateFuncionario = (id: number, data: Partial<Funcionario>) => api.put<Funcionario>(`/funcionarios/${id}`, data);
export const deleteFuncionario = (id: number) => api.delete(`/funcionarios/${id}`);
