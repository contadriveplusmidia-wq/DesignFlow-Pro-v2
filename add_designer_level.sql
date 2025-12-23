-- Adicionar campo level à tabela users para níveis de designer
-- Valores permitidos: 'junior', 'pleno', 'senior', ou NULL (oculto)

BEGIN TRANSACTION;

-- Adicionar coluna level se não existir
-- SQLite não suporta ALTER TABLE ADD COLUMN IF NOT EXISTS, então verificamos primeiro
-- Se a coluna já existir, o comando falhará silenciosamente, mas isso é OK

-- Adicionar coluna level
ALTER TABLE users ADD COLUMN level VARCHAR(10) CHECK (level IN ('junior', 'pleno', 'senior') OR level IS NULL);

COMMIT;

