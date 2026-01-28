import { useEffect } from 'react';
import { useFinancialStore } from '@/store/financialStore';

/**
 * Hook para sincronizar status de contas vencidas
 * Executa uma vez na montagem do componente
 */
export const useOverdueSync = () => {
  const updateOverdueStatus = useFinancialStore((state) => state.updateOverdueStatus);

  useEffect(() => {
    // Atualiza status de vencidos ao montar
    updateOverdueStatus();
  }, [updateOverdueStatus]);
};
