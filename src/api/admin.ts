import api from './axios';
import { Tenant } from '../types/saas';

export interface Metricas {
  total: number;
  ativos: number;
  trial: number;
  suspensos: number;
  planos: Record<string, number>;
}

export interface AdminTenant extends Tenant {
  usuarios: number;
}

export interface TenantDetail extends Tenant {
  users: import('../types/saas').TenantUser[];
}

export const getMetricas = async () => {
  const res = await api.get<Metricas>('/admin/metricas');
  return res.data;
};

export const getTenants = async () => {
  const res = await api.get<AdminTenant[]>('/admin/tenants');
  return res.data;
};

export const getTenantDetail = async (id: number) => {
  const res = await api.get<TenantDetail>(`/admin/tenants/${id}`);
  return res.data;
};

export const updateTenant = async (id: number, data: Partial<Pick<Tenant, 'plano' | 'status' | 'pagarme_subscription_id' | 'pagarme_customer_id'>>) => {
  const res = await api.put<Tenant>(`/admin/tenants/${id}`, data);
  return res.data;
};

export const createTenant = async (data: { nome: string; email: string; senha: string; plano: string }) => {
  const res = await api.post<Tenant>('/admin/tenants', data);
  return res.data;
};
