#!/bin/bash
set -e

BASE_1="http://localhost:3001/api"
BASE_2="http://localhost:3002/api"
BASE_3="http://localhost:3003/api"

echo "============================================"
echo "  Teste de Isolamento Multi-Tenant (SQLite)"
echo "============================================"
echo ""

echo ">>> Health Check..."
for url in $BASE_1 $BASE_2 $BASE_3; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url/produtos" 2>/dev/null || echo "000")
  echo "  $url -> HTTP $code"
done
echo ""

echo "=== 1. Listando produtos de cada tenant ==="
echo ""
echo ">>> Tenant 1 (Alfa - Pizza):"
curl -s "$BASE_1/produtos" 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for p in data:
        print(f\"  [{p['id']}] {p['nome']} - R\${p['preco_venda']:.2f}\")
except: print('  (erro ao parsear)')
"
echo ""

echo ">>> Tenant 2 (Beta - Sushi):"
curl -s "$BASE_2/produtos" 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for p in data:
        print(f\"  [{p['id']}] {p['nome']} - R\${p['preco_venda']:.2f}\")
except: print('  (erro ao parsear)')
"
echo ""

echo ">>> Tenant 3 (Gama - Hambúrguer):"
curl -s "$BASE_3/produtos" 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for p in data:
        print(f\"  [{p['id']}] {p['nome']} - R\${p['preco_venda']:.2f}\")
except: print('  (erro ao parsear)')
"
echo ""

echo "=== 2. Verificando ISOLAMENTO ==="
echo ""

# Pega nomes dos produtos de cada tenant
PROD_1=$(curl -s "$BASE_1/produtos" 2>/dev/null | python3 -c "import sys,json; print('|'.join([p['nome'] for p in json.load(sys.stdin)]))" 2>/dev/null)
PROD_2=$(curl -s "$BASE_2/produtos" 2>/dev/null | python3 -c "import sys,json; print('|'.join([p['nome'] for p in json.load(sys.stdin)]))" 2>/dev/null)
PROD_3=$(curl -s "$BASE_3/produtos" 2>/dev/null | python3 -c "import sys,json; print('|'.join([p['nome'] for p in json.load(sys.stdin)]))" 2>/dev/null)

LEAK=0

# Tenant 1 não deve ver dados do Tenant 2
if echo "$PROD_1" | grep -q "Sushi"; then
  echo "❌ VAZAMENTO: Tenant 1 (Alfa) viu Sushi do Tenant 2!"
  LEAK=1
else
  echo "✅ Tenant 1 NÃO vê dados do Tenant 2"
fi

# Tenant 1 não deve ver dados do Tenant 3
if echo "$PROD_1" | grep -q "Hambúrguer"; then
  echo "❌ VAZAMENTO: Tenant 1 (Alfa) viu Hambúrguer do Tenant 3!"
  LEAK=1
else
  echo "✅ Tenant 1 NÃO vê dados do Tenant 3"
fi

# Tenant 2 não deve ver dados do Tenant 1
if echo "$PROD_2" | grep -q "Pizza"; then
  echo "❌ VAZAMENTO: Tenant 2 (Beta) viu Pizza do Tenant 1!"
  LEAK=1
else
  echo "✅ Tenant 2 NÃO vê dados do Tenant 1"
fi

# Tenant 2 não deve ver dados do Tenant 3
if echo "$PROD_2" | grep -q "Hambúrguer"; then
  echo "❌ VAZAMENTO: Tenant 2 (Beta) viu Hambúrguer do Tenant 3!"
  LEAK=1
else
  echo "✅ Tenant 2 NÃO vê dados do Tenant 3"
fi

# Tenant 3 não deve ver dados de ninguém
if echo "$PROD_3" | grep -q "Pizza\|Sushi"; then
  echo "❌ VAZAMENTO: Tenant 3 (Gama) viu dados de outro tenant!"
  LEAK=1
else
  echo "✅ Tenant 3 NÃO vê dados de outros tenants"
fi

echo ""
echo "=== 3. Teste de Criação Isolada ==="
echo ""

echo "Criando produto 'EXCLUSIVO Alfa' no Tenant 1..."
curl -s -X POST "$BASE_1/produtos" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Produto EXCLUSIVO do Alfa","preco_venda":99.90,"categoria":"Teste"}' > /dev/null 2>&1

echo "Criando produto 'EXCLUSIVO Beta' no Tenant 2..."
curl -s -X POST "$BASE_2/produtos" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Produto EXCLUSIVO do Beta","preco_venda":199.90,"categoria":"Teste"}' > /dev/null 2>&1

echo "Verificando que os produtos exclusivos não vazaram..."
PROD_1_AFTER=$(curl -s "$BASE_1/produtos" 2>/dev/null | python3 -c "import sys,json; print('|'.join([p['nome'] for p in json.load(sys.stdin)]))" 2>/dev/null)
PROD_2_AFTER=$(curl -s "$BASE_2/produtos" 2>/dev/null | python3 -c "import sys,json; print('|'.join([p['nome'] for p in json.load(sys.stdin)]))" 2>/dev/null)

if echo "$PROD_2_AFTER" | grep -q "EXCLUSIVO do Alfa"; then
  echo "❌ VAZAMENTO: Tenant 2 viu produto criado pelo Tenant 1!"
  LEAK=1
else
  echo "✅ Produto do Tenant 1 não vazou para Tenant 2"
fi

if echo "$PROD_1_AFTER" | grep -q "EXCLUSIVO do Beta"; then
  echo "❌ VAZAMENTO: Tenant 1 viu produto criado pelo Tenant 2!"
  LEAK=1
else
  echo "✅ Produto do Tenant 2 não vazou para Tenant 1"
fi

echo ""
echo "=== 4. Resumo ==="
if [ "$LEAK" -eq 0 ]; then
  echo "🎉 TODOS OS TESTES PASSARAM - Isolamento OK!"
else
  echo "❌ FALHA: Detectado vazamento de dados entre tenants!"
  exit 1
fi

echo ""
echo "=== Teste concluído ==="
