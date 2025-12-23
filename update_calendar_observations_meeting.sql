-- Atualizar tabela calendar_observations para incluir tipo 'meeting'
-- Como SQLite não permite alterar CHECK constraints, precisamos recriar a tabela

BEGIN TRANSACTION;

-- Criar tabela temporária com a nova estrutura
CREATE TABLE calendar_observations_new (
  id VARCHAR(50) PRIMARY KEY,
  designer_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date VARCHAR(10) NOT NULL,
  note TEXT NOT NULL,
  type VARCHAR(20) CHECK (type IN ('absence', 'event', 'note', 'meeting')) DEFAULT 'note',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  UNIQUE(designer_id, date)
);

-- Copiar dados existentes
INSERT INTO calendar_observations_new 
SELECT * FROM calendar_observations;

-- Remover tabela antiga
DROP TABLE calendar_observations;

-- Renomear tabela nova
ALTER TABLE calendar_observations_new RENAME TO calendar_observations;

-- Recriar índices
CREATE INDEX IF NOT EXISTS idx_calendar_observations_date ON calendar_observations(date);
CREATE INDEX IF NOT EXISTS idx_calendar_observations_designer ON calendar_observations(designer_id);

COMMIT;

