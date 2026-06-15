import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Tenant, PlanLimit, PlanoInfo } from '../types/saas';
import { getAssinatura, getPlanos } from '../api/saas';
import { useAuth } from './AuthContext';

interface TenantContextType {
  tenant: Tenant | null;
  planos: PlanoInfo[];
  limites: PlanLimit | null;
  loading: boolean;
  isTrial: boolean;
  trialDaysLeft: number;
  canUse: (feature: keyof PlanLimit) => boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({} as TenantContextType);

export const useTenant = () => useContext(TenantContext);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [planos, setPlanos] = useState<PlanoInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setTenant(null);
      setLoading(false);
      return;
    }
    try {
      const [tenantData, planosData] = await Promise.all([
        getAssinatura(),
        getPlanos(),
      ]);
      setTenant(tenantData);
      setPlanos(planosData);
    } catch {
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  const plano = tenant?.plano || 'free';
  const limites = planos.find((p) => p.slug === plano)?.limites || null;

  const isTrial = tenant?.status === 'trial';
  const trialDaysLeft = tenant?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0;

  const canUse = (feature: keyof PlanLimit): boolean => {
    if (!limites) return false;
    const val = limites[feature];
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val > 0;
    return false;
  };

  return (
    <TenantContext.Provider value={{ tenant, planos, limites, loading, isTrial, trialDaysLeft, canUse, refreshTenant: load }}>
      {children}
    </TenantContext.Provider>
  );
};
