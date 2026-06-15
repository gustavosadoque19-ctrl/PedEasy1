export interface Tenant {
  id: number;
  nome: string;
  slug: string;
  plano: 'free' | 'pro' | 'enterprise';
  status: 'trial' | 'active' | 'canceled' | 'suspended';
  pagarme_customer_id?: string;
  pagarme_subscription_id?: string;
  trial_ends_at?: string;
  config: Record<string, any>;
  createdAt?: string;
}

export interface TenantUser {
  id: number;
  tenant_id: number;
  nome: string;
  email: string;
  cargo: string;
  permissao: 'admin' | 'operador';
  ativo: boolean;
  createdAt?: string;
}

export interface TenantLoginResponse {
  token: string;
  user: TenantUser;
  tenant: Tenant;
}

export interface PlanLimit {
  plano: string;
  max_pedidos_mes: number;
  max_funcionarios: number;
  max_mesas: number;
  nfe_inclusas_mes: number;
  whatsapp_bot: boolean;
  relatorios_avancados: boolean;
  suporte_tipo: string;
}

export interface PlanoInfo {
  slug: string;
  nome: string;
  preco: number;
  limites: PlanLimit;
}
