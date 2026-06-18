# Teste de Isolamento Multi-Tenant

## Teste Local (Node.js direto, sem Docker)

```bash
cd E:\projeto 1
node test/run-test-local.js
```

Testa: leitura, criação, atualização, deleção e auto-provisionamento.

## Teste com Docker

```bash
cd E:\projeto 1
docker compose -f docker-compose.test.yml build
docker compose -f docker-compose.test.yml up -d
```

Acessar:
- Tenant 1: http://localhost:3001/api/produtos
- Tenant 2: http://localhost:3002/api/produtos
- Tenant 3: http://localhost:3003/api/produtos

## Arquivos

| Arquivo | Função |
|---|---|
| `test/Dockerfile.test` | Dockerfile do backend de teste |
| `test/sqlite-store.js` | Store SQLite (substitui Supabase) |
| `test/supabase-client-mock.js` | Mock do Supabase client |
| `test/schema.sql` | Schema das tabelas SQLite |
| `test/init-global-db.mjs` | Inicializa banco global (tenants) |
| `test/seed.mjs` | Popula dados iniciais |
| `test/run-test-local.js` | Teste de isolamento local |
| `test/provision.mjs` | Simula auto-provisionamento |
| `test/test-isolation.sh` | Teste via curl (requer Docker) |
| `docker-compose.test.yml` | Orquestração Docker do teste |
