import { Demand } from '../types';

/**
 * Verifica se uma demanda contém apenas tipos de arte que não contam para a meta
 * Atualmente, "Ajustes" não conta para a meta
 */
export const shouldExcludeFromGoal = (demand: Demand): boolean => {
  // Se a demanda não tem items, não excluir (pode ser caso especial)
  if (!demand.items || demand.items.length === 0) {
    return false;
  }

  // Verificar se TODOS os items são "Ajustes"
  const allItemsAreAdjustments = demand.items.every(item => 
    item.artTypeLabel.toLowerCase().trim() === 'ajustes'
  );

  return allItemsAreAdjustments;
};

/**
 * Calcula a quantidade total de artes de uma demanda, excluindo tipos que não contam para a meta
 * Exclui "Ajustes" da contagem mesmo quando há outros tipos de arte na demanda
 */
export const getArtsCountForGoal = (demand: Demand): number => {
  if (shouldExcludeFromGoal(demand)) {
    return 0;
  }
  
  // Se não tem items, retornar totalQuantity (caso especial)
  if (!demand.items || demand.items.length === 0) {
    return demand.totalQuantity;
  }
  
  // Contar apenas items que NÃO são "Ajustes"
  return demand.items
    .filter(item => item.artTypeLabel.toLowerCase().trim() !== 'ajustes')
    .reduce((acc, item) => acc + item.quantity, 0);
};

/**
 * Conta quantos "Ajustes" uma demanda tem
 */
export const getAdjustmentsCount = (demand: Demand): number => {
  if (!demand.items || demand.items.length === 0) {
    return 0;
  }

  return demand.items
    .filter(item => item.artTypeLabel.toLowerCase().trim() === 'ajustes')
    .reduce((acc, item) => acc + item.quantity, 0);
};

/**
 * Filtra demandas que devem contar para a meta
 */
export const filterDemandsForGoal = (demands: Demand[]): Demand[] => {
  return demands.filter(d => !shouldExcludeFromGoal(d));
};
