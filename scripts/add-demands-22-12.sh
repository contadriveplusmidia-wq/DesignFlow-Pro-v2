#!/bin/bash

API_URL="http://localhost:3001/api"

# IDs dos usuários
DAVI_ID="user-1765206551278"
GUILHERME_ID="user-1765206376836"
PAULO_ID="user-1765206398336"

# IDs dos tipos de arte
ARTE_UNICA="1"
FEED_STORYS="2"
BANNER_SITE="4"
TABELA_MEDIDAS="5"

# Pontos por variação
VARIATION_POINTS=3

# Função para criar timestamp (22/12/2025 HH:MM)
create_timestamp() {
    local hour=$1
    local minute=$2
    # 22/12/2025 às HH:MM em timestamp (milissegundos)
    # Usando date do macOS
    date -j -f "%Y-%m-%d %H:%M" "2025-12-22 $hour:$minute" "+%s000" 2>/dev/null || \
    python3 -c "from datetime import datetime; print(int(datetime(2025, 12, 22, $hour, $minute).timestamp() * 1000))"
}

# Função para criar demanda
create_demand() {
    local user_id=$1
    local user_name=$2
    local timestamp=$3
    local items_json=$4
    local execution_code=$5
    
    local total_quantity=$(echo "$items_json" | python3 -c "import sys, json; items=json.load(sys.stdin); print(sum(i['quantity'] for i in items))")
    local total_points=$(echo "$items_json" | python3 -c "import sys, json; items=json.load(sys.stdin); print(sum(i['totalPoints'] for i in items))")
    
    local demand_json=$(cat <<EOF
{
  "userId": "$user_id",
  "userName": "$user_name",
  "items": $items_json,
  "totalQuantity": $total_quantity,
  "totalPoints": $total_points,
  "timestamp": $timestamp,
  "executionCode": "$execution_code"
}
EOF
)
    
    response=$(curl -s -X POST "$API_URL/demands" \
        -H "Content-Type: application/json" \
        -d "$demand_json")
    
    if echo "$response" | grep -q '"id"'; then
        echo "✅ $user_name - $execution_code - $total_points pts"
    else
        echo "❌ Erro ao criar demanda para $user_name ($execution_code): $response"
    fi
}

echo "=== CRIANDO DEMANDAS DE PAULO ==="

# Paulo S4 - 22/12, 19:52 - 3x Banner Site, 90 pts
create_demand "$PAULO_ID" "Paulo" "$(create_timestamp 19 52)" \
'[{"artTypeId":"'$BANNER_SITE'","artTypeLabel":"Banner Site","pointsPerUnit":30,"quantity":3,"variationQuantity":0,"variationPoints":0,"totalPoints":90}]' \
"S4"

# Paulo S3 - 22/12, 19:14 - 1x Tabela de medidas, 28 pts
create_demand "$PAULO_ID" "Paulo" "$(create_timestamp 19 14)" \
'[{"artTypeId":"'$TABELA_MEDIDAS'","artTypeLabel":"Tabela de medidas ","pointsPerUnit":28,"quantity":1,"variationQuantity":0,"variationPoints":0,"totalPoints":28}]' \
"S3"

# Paulo S2 - 22/12, 19:09 - 2x Banner Site, 60 pts
create_demand "$PAULO_ID" "Paulo" "$(create_timestamp 19 09)" \
'[{"artTypeId":"'$BANNER_SITE'","artTypeLabel":"Banner Site","pointsPerUnit":30,"quantity":2,"variationQuantity":0,"variationPoints":0,"totalPoints":60}]' \
"S2"

# Paulo S1 - 22/12, 18:13 - 3x Banner Site (+2 var), 96 pts
create_demand "$PAULO_ID" "Paulo" "$(create_timestamp 18 13)" \
'[{"artTypeId":"'$BANNER_SITE'","artTypeLabel":"Banner Site","pointsPerUnit":30,"quantity":3,"variationQuantity":2,"variationPoints":6,"totalPoints":96}]' \
"S1"

echo ""
echo "=== CRIANDO DEMANDAS DE GUILHERME ==="

# Guilherme S6 - 22/12, 17:41 - 1x Feed + Storys, 25 pts
create_demand "$GUILHERME_ID" "Guilherme" "$(create_timestamp 17 41)" \
'[{"artTypeId":"'$FEED_STORYS'","artTypeLabel":"Feed + Storys","pointsPerUnit":25,"quantity":1,"variationQuantity":0,"variationPoints":0,"totalPoints":25}]' \
"S6"

# Guilherme S5, S4, S3, S2, S1 - 22/12, 15:00 - 1x Feed + Storys cada
for session in S5 S4 S3 S2 S1; do
    create_demand "$GUILHERME_ID" "Guilherme" "$(create_timestamp 15 00)" \
'[{"artTypeId":"'$FEED_STORYS'","artTypeLabel":"Feed + Storys","pointsPerUnit":25,"quantity":1,"variationQuantity":0,"variationPoints":0,"totalPoints":25}]' \
"$session"
done

echo ""
echo "=== CRIANDO DEMANDAS DE DAVI ==="

# Davi S4 - 22/12, 18:51 - 1x Feed + Storys, 25 pts
create_demand "$DAVI_ID" "Davi" "$(create_timestamp 18 51)" \
'[{"artTypeId":"'$FEED_STORYS'","artTypeLabel":"Feed + Storys","pointsPerUnit":25,"quantity":1,"variationQuantity":0,"variationPoints":0,"totalPoints":25}]' \
"S4"

# Davi S3 - 22/12, 18:51 - 1x Tabela de medidas, 28 pts
create_demand "$DAVI_ID" "Davi" "$(create_timestamp 18 51)" \
'[{"artTypeId":"'$TABELA_MEDIDAS'","artTypeLabel":"Tabela de medidas ","pointsPerUnit":28,"quantity":1,"variationQuantity":0,"variationPoints":0,"totalPoints":28}]' \
"S3"

# Davi S2 - 22/12, 18:51 - 1x Arte Única (+6 var) + 1x Arte Única, 38 pts
create_demand "$DAVI_ID" "Davi" "$(create_timestamp 18 51)" \
'[{"artTypeId":"'$ARTE_UNICA'","artTypeLabel":"Arte Única","pointsPerUnit":10,"quantity":1,"variationQuantity":6,"variationPoints":18,"totalPoints":28},{"artTypeId":"'$ARTE_UNICA'","artTypeLabel":"Arte Única","pointsPerUnit":10,"quantity":1,"variationQuantity":0,"variationPoints":0,"totalPoints":10}]' \
"S2"

# Davi S1 - 22/12, 18:51 - 1x Arte Única (+5 var) + 1x Arte Única, 35 pts
create_demand "$DAVI_ID" "Davi" "$(create_timestamp 18 51)" \
'[{"artTypeId":"'$ARTE_UNICA'","artTypeLabel":"Arte Única","pointsPerUnit":10,"quantity":1,"variationQuantity":5,"variationPoints":15,"totalPoints":25},{"artTypeId":"'$ARTE_UNICA'","artTypeLabel":"Arte Única","pointsPerUnit":10,"quantity":1,"variationQuantity":0,"variationPoints":0,"totalPoints":10}]' \
"S1"

echo ""
echo "✅ Todas as demandas foram criadas!"

