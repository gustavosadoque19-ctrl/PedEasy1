# Plano: Transformar PedEasy em SaaS com Pagar.me

## Decisões
- **Isolamento**: `tenant_id` no JSONB (estrutura atual adaptada)
- **Escopo**: Completo (multi-tenancy + billing + pagamentos in-app + admin)
- **Dados**: Começar do zero (sem migração)
- **Assinaturas**: API do Pagar.me direto

---

## Fase 1 — Fundação Multi-Tenant

### 1.1 Tabelas novas

```sql
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plano VARCHAR(20) NOT NULL DEFAULT 'free',
  status VARCHAR(20) NOT NULL DEFAULT 'trial',
  pagarme_customer_id VARCHAR(100),
  pagarme_subscription_id VARCHAR(100),
  trial_ends_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenant_users (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  cargo VARCHAR(100) DEFAULT 'operador',
  permissao VARCHAR(20) NOT NULL DEFAULT 'operador',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenant_plan_limits (
  plano VARCHAR(20) PRIMARY KEY,
  max_pedidos_mes INTEGER DEFAULT 100,
  max_funcionarios INTEGER DEFAULT 2,
  max_mesas INTEGER DEFAULT 10,
  nfe_inclusas_mes INTEGER DEFAULT 0,
  whatsapp_bot BOOLEAN DEFAULT false,
  relatorios_avancados BOOLEAN DEFAULT false,
  suporte_tipo VARCHAR(20) DEFAULT 'comunidade'
);
```

### 1.2 store.js — Adaptação Multi-Tenant

Toda CRUD filtra por `data->>'tenant_id'`. `create` injeta `tenant_id` automaticamente.

### 1.3 Middleware tenantGuard

Extrai JWT, busca tenant, verifica se está ativo, injeta `req.tenant_id`.

### 1.4 Auth

- Signup: cria tenant (trial) + tenant_user admin → JWT com `tenant_id`
- Login: busca `tenant_users` por email, bcrypt.compare → JWT com `tenant_id`

---

## Fase 2 — Cadastro e Onboarding

### 2.1 Landing page
### 2.2 Fluxo de signup
### 2.3 Onboarding wizard
### 2.4 Login adaptado

---

## Fase 3 — Planos e Assinaturas via Pagar.me

### 3.1 `backend/src/pagarme.js`
### 3.2 Planos definidos no backend
### 3.3 `POST /api/saas/subscriptions`
### 3.4 `POST /api/saas/webhooks`
### 3.5 Middleware `planGuard`
### 3.6 Página `/planos`
### 3.7 Cancelamento

---

## Fase 4 — Pagamentos In-App com Pagar.me

### 4.1 PIX real
### 4.2 Cartão real
### 4.3 Webhook `transaction.paid`
### 4.4 Webhook `transaction.refunded`
### 4.5 Pagamentos.tsx reformulado
### 4.6 QR code PIX na finalização

---

## Fase 5 — Infraestrutura SaaS

### 5.1 Rate limiting por tenant
### 5.2 Logs estruturados
### 5.3 Deploy atualizado

---

## Fase 6 — Painel Admin

### 6.1 `/admin` com listagem de tenants
### 6.2 Métricas MRR, churn, novos
### 6.3 Ações: ativar/suspender, upgrade/downgrade

---

## Arquitetura Final

```
                        ┌──────────────┐
                        │  Landing     │
                        │  / + /signup │
                        └──────┬───────┘
                               │
  ┌──────────────┐    ┌───────▼───────┐    ┌────────────────┐
  │  Admin App   │    │  Main App     │    │  Pagar.me API  │
  │  /admin      │    │  (same SPA)   │    │  v5 /core      │
  └──────────────┘    └───────┬───────┘    └───────┬────────┘
                               │                   │
                        ┌──────▼──────┐            │
                        │  Express    │◄───────────┘
                        │  + store.js │
                        │  + pagarme  │
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │  Supabase   │
                        │  (JSONB)    │
                        │  + tenants  │
                        └─────────────┘
```

## Planos de Preço

| Recurso | Free | Pro (R$97) | Enterprise (R$297) |
|---------|------|------------|-------------------|
| Pedidos/mês | 100 | Ilimitado | Ilimitado |
| Funcionários | 2 | 10 | Ilimitado |
| Mesas | 10 | Ilimitado | Ilimitado |
| NFe | ❌ | ✅ 100/mês | ✅ Ilimitado |
| WhatsApp Bot | ❌ | ✅ | ✅ |
| Relatórios | ❌ | Básico | Avançado |
| Suporte | Comunidade | Email | Prioridade |

## Checklist de Arquivos

### Backend novos
```
backend/src/pagarme.js
backend/src/routes/saas.js
backend/src/routes/admin.js
backend/src/middleware/tenantGuard.js
backend/src/middleware/planGuard.js
backend/src/jobs/trial.js
```

### Backend modificados
```
backend/src/app.js
backend/src/auth.js
backend/src/store.js
backend/src/routes/auth.js
```

### Frontend novos
```
src/pages/Landing/Landing.tsx
src/pages/Signup/Signup.tsx
src/pages/Planos/Planos.tsx
src/pages/Admin/AdminDashboard.tsx
src/pages/Admin/AdminTenantDetail.tsx
src/pages/Saas/Assinatura.tsx
src/api/saas.ts
src/api/admin.ts
src/contexts/TenantContext.tsx
src/types/saas.ts
```

### Frontend modificados
```
src/App.tsx
src/contexts/AuthContext.tsx
src/layouts/MainLayout.tsx
src/layouts/Sidebar.tsx
src/pages/Login/Login.tsx
src/pages/Pagamentos/Pagamentos.tsx
src/api/pagamentos.ts
src/api/cardapio.ts
src/api/axios.ts
```
