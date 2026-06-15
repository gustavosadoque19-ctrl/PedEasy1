import api from './axios';
import { Funcionario } from '../types';

export type FuncionarioSemSenha = Omit<Funcionario, 'senha'>;
export type FuncionarioInput = Omit<Funcionario, 'id' | 'createdAt'>;

export const getFuncionarios = () => api.get<FuncionarioSemSenha[]>('/funcionarios');
export const getFuncionario = (id: number) => api.get<FuncionarioSemSenha>(`/funcionarios/${id}`);
export const createFuncionario = (data: FuncionarioInput) => api.post<FuncionarioSemSenha>('/funcionarios', data);
export const updateFuncionario = (id: number, data: Partial<FuncionarioInput>) => api.put<FuncionarioSemSenha>(`/funcionarios/${id}`, data);
export const deleteFuncionario = (id: number) => api.delete(`/funcionarios/${id}`);
export const getPendentes = () => api.get<FuncionarioSemSenha[]>('/auth/pendentes');
export const aprovarFuncionario = (id: number) => api.put<FuncionarioSemSenha>(`/auth/aprovar/${id}`);
