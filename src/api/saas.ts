import api from './axios';
import { Tenant, TenantUser, PlanoInfo } from '../types/saas';

export interface SignupData {
  tenant_name: string;
  nome: string;
  email: string;
  senha: string;
  recaptcha_token: string;
}

export interface SignupResult {
  token: string;
  user: TenantUser;
  tenant: Tenant;
}

export interface LoginData {
  email: string;
  senha: string;
  recaptcha_token: string;
}

export interface LoginResult {
  token: string;
  user: TenantUser;
  tenant: Tenant;
}

export const signup = async (data: SignupData) => {
  const res = await api.post<SignupResult>('/saas/signup', data);
  return res.data;
};

export const loginSaas = async (data: LoginData) => {
  const res = await api.post<LoginResult>('/saas/login', data);
  return res.data;
};

export const getPlanos = async () => {
  const res = await api.get<PlanoInfo[]>('/saas/planos');
  return res.data;
};

export const getAssinatura = async () => {
  const res = await api.get<Tenant>('/saas/assinatura');
  return res.data;
};
