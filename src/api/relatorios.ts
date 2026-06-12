import api from './axios';
import { RelatorioVendas } from '../types';

export const getRelatorioVendas = (params: { data_inicio: string; data_fim: string }) =>
  api.get<RelatorioVendas>('/relatorios/vendas', { params });
