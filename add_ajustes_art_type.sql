-- Adicionar "Ajustes" como tipo de arte
-- Este tipo não conta para a meta diária, mas aparece no dashboard do admin

-- Verificar se já existe e adicionar se não existir
INSERT INTO art_types (id, label, points, sort_order)
SELECT 
  'ajustes-' || strftime('%s', 'now') || '-' || (abs(random()) % 10000),
  'Ajustes',
  0, -- 0 pontos pois não conta para meta
  COALESCE((SELECT MAX(sort_order) FROM art_types), -1) + 1
WHERE NOT EXISTS (
  SELECT 1 FROM art_types WHERE LOWER(TRIM(label)) = 'ajustes'
);




