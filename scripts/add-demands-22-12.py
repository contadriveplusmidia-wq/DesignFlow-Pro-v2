#!/usr/bin/env python3
import requests
import json
from datetime import datetime

API_URL = "http://localhost:3001/api"

# IDs dos usuários
USERS = {
    "Davi": "user-1765206551278",
    "Guilherme": "user-1765206376836",
    "Paulo": "user-1765206398336"
}

# IDs dos tipos de arte
ART_TYPES = {
    "Arte Única": "1",
    "Feed + Storys": "2",
    "Banner Site": "4",
    "Tabela de medidas": "5"
}

# Pontos por variação
VARIATION_POINTS = 3

def create_timestamp(date_str, time_str):
    """Cria timestamp a partir de data e hora (formato: DD/MM/YYYY HH:MM)"""
    dt = datetime.strptime(f"{date_str} {time_str}", "%d/%m/%Y %H:%M")
    return int(dt.timestamp() * 1000)

def create_demand(user_name, timestamp, items, execution_code=None):
    """Cria uma demanda"""
    user_id = USERS[user_name]
    
    total_quantity = sum(item["quantity"] for item in items)
    total_points = sum(item["totalPoints"] for item in items)
    
    demand_data = {
        "userId": user_id,
        "userName": user_name,
        "items": items,
        "totalQuantity": total_quantity,
        "totalPoints": total_points,
        "timestamp": timestamp
    }
    
    if execution_code:
        demand_data["executionCode"] = execution_code
    
    response = requests.post(f"{API_URL}/demands", json=demand_data)
    if response.status_code == 200:
        print(f"✅ {user_name} - {response.json().get('id', 'N/A')} - {total_points} pts")
        return response.json()
    else:
        print(f"❌ Erro ao criar demanda para {user_name}: {response.status_code} - {response.text}")
        return None

# ============ PAULO - 22/12/2025 ============
print("\n=== CRIANDO DEMANDAS DE PAULO ===")

# Paulo S4 - 22/12, 19:52 - 3x Banner Site, 90 pts, 3 artes
create_demand(
    "Paulo",
    create_timestamp("22/12/2025", "19:52"),
    [{
        "artTypeId": ART_TYPES["Banner Site"],
        "artTypeLabel": "Banner Site",
        "pointsPerUnit": 30,
        "quantity": 3,
        "variationQuantity": 0,
        "variationPoints": 0,
        "totalPoints": 90
    }],
    execution_code="S4"
)

# Paulo S3 - 22/12, 19:14 - 1x Tabela de medidas, 28 pts, 1 arte
create_demand(
    "Paulo",
    create_timestamp("22/12/2025", "19:14"),
    [{
        "artTypeId": ART_TYPES["Tabela de medidas"],
        "artTypeLabel": "Tabela de medidas ",
        "pointsPerUnit": 28,
        "quantity": 1,
        "variationQuantity": 0,
        "variationPoints": 0,
        "totalPoints": 28
    }],
    execution_code="S3"
)

# Paulo S2 - 22/12, 19:09 - 2x Banner Site, 60 pts, 2 artes
create_demand(
    "Paulo",
    create_timestamp("22/12/2025", "19:09"),
    [{
        "artTypeId": ART_TYPES["Banner Site"],
        "artTypeLabel": "Banner Site",
        "pointsPerUnit": 30,
        "quantity": 2,
        "variationQuantity": 0,
        "variationPoints": 0,
        "totalPoints": 60
    }],
    execution_code="S2"
)

# Paulo S1 - 22/12, 18:13 - 3x Banner Site (+2 var), 96 pts, 3 artes
create_demand(
    "Paulo",
    create_timestamp("22/12/2025", "18:13"),
    [{
        "artTypeId": ART_TYPES["Banner Site"],
        "artTypeLabel": "Banner Site",
        "pointsPerUnit": 30,
        "quantity": 3,
        "variationQuantity": 2,
        "variationPoints": 2 * VARIATION_POINTS,
        "totalPoints": 90 + (2 * VARIATION_POINTS)  # 90 + 6 = 96
    }],
    execution_code="S1"
)

# ============ GUILHERME - 22/12/2025 ============
print("\n=== CRIANDO DEMANDAS DE GUILHERME ===")

# Guilherme S6 - 22/12, 17:41 - 1x Feed + Storys, 25 pts
create_demand(
    "Guilherme",
    create_timestamp("22/12/2025", "17:41"),
    [{
        "artTypeId": ART_TYPES["Feed + Storys"],
        "artTypeLabel": "Feed + Storys",
        "pointsPerUnit": 25,
        "quantity": 1,
        "variationQuantity": 0,
        "variationPoints": 0,
        "totalPoints": 25
    }],
    execution_code="S6"
)

# Guilherme S5, S4, S3, S2, S1 - 22/12, 15:00 - 1x Feed + Storys cada, 25 pts
for session in ["S5", "S4", "S3", "S2", "S1"]:
    create_demand(
        "Guilherme",
        create_timestamp("22/12/2025", "15:00"),
        [{
            "artTypeId": ART_TYPES["Feed + Storys"],
            "artTypeLabel": "Feed + Storys",
            "pointsPerUnit": 25,
            "quantity": 1,
            "variationQuantity": 0,
            "variationPoints": 0,
            "totalPoints": 25
        }],
        execution_code=session
    )

# ============ DAVI - 22/12/2025 ============
print("\n=== CRIANDO DEMANDAS DE DAVI ===")

# Davi - 22/12, 18:51 - Baseado na primeira imagem
# Vou criar as demandas que aparecem na imagem

# Davi S4 - 22/12, 18:51 - 1x Feed + Storys, 25 pts
create_demand(
    "Davi",
    create_timestamp("22/12/2025", "18:51"),
    [{
        "artTypeId": ART_TYPES["Feed + Storys"],
        "artTypeLabel": "Feed + Storys",
        "pointsPerUnit": 25,
        "quantity": 1,
        "variationQuantity": 0,
        "variationPoints": 0,
        "totalPoints": 25
    }],
    execution_code="S4"
)

# Davi S3 - 22/12, 18:51 - 1x Tabela de medidas, 28 pts
create_demand(
    "Davi",
    create_timestamp("22/12/2025", "18:51"),
    [{
        "artTypeId": ART_TYPES["Tabela de medidas"],
        "artTypeLabel": "Tabela de medidas ",
        "pointsPerUnit": 28,
        "quantity": 1,
        "variationQuantity": 0,
        "variationPoints": 0,
        "totalPoints": 28
    }],
    execution_code="S3"
)

# Davi S2 - 22/12, 18:51 - 1x Arte Única (+6 var) + 1x Arte Única, 38 pts, 2 artes
# 1 arte com 6 var + 1 arte = (10+18) + 10 = 38 pts, 2 artes
create_demand(
    "Davi",
    create_timestamp("22/12/2025", "18:51"),
    [{
        "artTypeId": ART_TYPES["Arte Única"],
        "artTypeLabel": "Arte Única",
        "pointsPerUnit": 10,
        "quantity": 1,
        "variationQuantity": 6,
        "variationPoints": 6 * VARIATION_POINTS,
        "totalPoints": 10 + (6 * VARIATION_POINTS)  # 10 + 18 = 28
    },
    {
        "artTypeId": ART_TYPES["Arte Única"],
        "artTypeLabel": "Arte Única",
        "pointsPerUnit": 10,
        "quantity": 1,
        "variationQuantity": 0,
        "variationPoints": 0,
        "totalPoints": 10
    }],
    execution_code="S2"
)

# Davi S1 - 22/12, 18:51 - 1x Arte Única (+5 var) + 1x Arte Única, 35 pts, 2 artes
# 1 arte com 5 var + 1 arte = (10+15) + 10 = 35 pts, 2 artes
create_demand(
    "Davi",
    create_timestamp("22/12/2025", "18:51"),
    [{
        "artTypeId": ART_TYPES["Arte Única"],
        "artTypeLabel": "Arte Única",
        "pointsPerUnit": 10,
        "quantity": 1,
        "variationQuantity": 5,
        "variationPoints": 5 * VARIATION_POINTS,
        "totalPoints": 10 + (5 * VARIATION_POINTS)  # 10 + 15 = 25
    },
    {
        "artTypeId": ART_TYPES["Arte Única"],
        "artTypeLabel": "Arte Única",
        "pointsPerUnit": 10,
        "quantity": 1,
        "variationQuantity": 0,
        "variationPoints": 0,
        "totalPoints": 10
    }],
    execution_code="S1"
)

print("\n✅ Todas as demandas foram criadas!")

