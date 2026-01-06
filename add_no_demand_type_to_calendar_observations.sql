-- Migração: Adicionar tipo 'no_demand' (Sem demanda) à tabela calendar_observations
-- Execute este SQL apenas se a tabela calendar_observations já existir
-- ATENÇÃO: Este script recria a tabela. Faça backup antes de executar!

-- Para SQLite:
-- 1. Criar tabela temporária com os dados existentes
CREATE TABLE IF NOT EXISTS calendar_observations_backup AS 
SELECT * FROM calendar_observations;

-- 2. Dropar a tabela original
DROP TABLE IF EXISTS calendar_observations;

-- 3. Recriar a tabela com a nova constraint incluindo 'no_demand'
CREATE TABLE calendar_observations (
  id VARCHAR(50) PRIMARY KEY,
  designer_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date VARCHAR(10) NOT NULL,
  note TEXT NOT NULL,
  type VARCHAR(20) CHECK (type IN ('absence', 'event', 'note', 'meeting', 'no_demand')) DEFAULT 'note',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  UNIQUE(designer_id, date)
);

-- 4. Recriar índices
CREATE INDEX IF NOT EXISTS idx_calendar_observations_date ON calendar_observations(date);
CREATE INDEX IF NOT EXISTS idx_calendar_observations_designer ON calendar_observations(designer_id);

-- 5. Restaurar dados do backup
INSERT INTO calendar_observations 
SELECT * FROM calendar_observations_backup;

-- 6. Remover tabela de backup (opcional - descomente se quiser remover)
-- DROP TABLE IF EXISTS calendar_observations_backup;

-- Verificar estrutura final
.schema calendar_observations




