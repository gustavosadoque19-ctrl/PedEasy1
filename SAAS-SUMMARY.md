# SaaS PedEasy — Relatório da Sessão

## Status

**Commit**: `14a8081` — no GitHub, frontend/backend locais funcionando.
**Vercel**: QUEBRADO — `FUNCTION_INVOCATION_FAILED` (500) em todos os endpoints.

## O Que Foi Implementado (5 Fases)

### Fase 1 — Multi-tenancy
- Tabelas SQL: `tenants`, `tenant_users`, `tenant_plan_limits`
- `store.js` filtra por `tenant_id` no JSONB
- `authMiddleware` extrai `tenant_id`, `user_id`, `permissao` do JWT
- `tenantGuard` (tenant ativo/trial), `planGuard` (features por plano)

### Fase 2 — Auth SaaS
- Signup: cria tenant (trial 7d) + usuário admin → JWT
- Login: email (SaaS) ou usuário (legado)
- `TenantContext.tsx`: `canUse`, `isTrial`, `trialDaysLeft`
- Onboarding: wizard 3 passos (Estabelecimento → Delivery → Finalizar)

### Fase 3 — Planos/Checkout/Admin
- Landing page com pricing (Free/Pro R$97/Enterprise R$297)
- `Planos.tsx`: cards + checkout cartão
- `Assinatura.tsx`: status, trial countdown, cancelar
- `Admin.tsx`: métricas (total/ativos/trial/suspensos), CRUD de tenants
- Rotas: `GET /api/saas/planos`, `POST /api/saas/subscriptions`, webhooks

### Fase 4 — Pagamentos In-App
- PIX real e cartão real via Pagar.me
- Webhook `transaction.paid` / `transaction.refunded`
- `Pagamentos.tsx`: QR code PIX + campos cartão

### Fase 5 — Infraestrutura
- `rateLimiter.js`: global + por tenant (express-rate-limit)
- `logger.js`: JSON estruturado com níveis
- `requestLogger.js`: logging com tenant context
- `index.js`: valida env vars obrigatórias no startup
- `trial.js`: cron jobs (08:00 alerta, 23:00 suspende) com node-cron

## Próximo Passo Urgente

**Configurar env vars na Vercel** (https://vercel.com/gustavosadoque19-ctrl/pedeasy1/settings/environment-variables):

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Anon key do Supabase |
| `JWT_SECRET` | Mesma do `.env` local |

Depois: ir em **Deployments**, clicar `...` > **Redeploy**.

## Pendências Futuras
1. Testes E2E do fluxo completo
2. Pagar.me no fechamento de pedidos (PIX/cartão no checkout)
3. Deploy em produção (domínio, SSL)
