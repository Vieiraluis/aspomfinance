import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface LocalStorageData {
  suppliers: any[];
  accounts: any[];
  payments: any[];
  bankAccounts: any[];
}

const STORAGE_KEY = 'financial-store';

export const useDataMigration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);

  const getLocalStorageData = (): LocalStorageData | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      if (!parsed.state) return null;
      
      const { suppliers, accounts, payments, bankAccounts } = parsed.state;
      
      // Check if there's any data to migrate
      const hasData = 
        (suppliers?.length > 0) || 
        (accounts?.length > 0) || 
        (payments?.length > 0) || 
        (bankAccounts?.length > 0);
      
      if (!hasData) return null;
      
      return { suppliers, accounts, payments, bankAccounts };
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return null;
    }
  };

  const hasLocalData = (): boolean => {
    return getLocalStorageData() !== null;
  };

  const getLocalDataSummary = () => {
    const data = getLocalStorageData();
    if (!data) return null;
    
    return {
      suppliers: data.suppliers?.length || 0,
      accounts: data.accounts?.length || 0,
      payments: data.payments?.length || 0,
      bankAccounts: data.bankAccounts?.length || 0,
    };
  };

  const migrateData = async (): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para migrar os dados.',
        variant: 'destructive',
      });
      return false;
    }

    const data = getLocalStorageData();
    if (!data) {
      toast({
        title: 'Sem dados para migrar',
        description: 'Não foram encontrados dados no armazenamento local.',
      });
      return false;
    }

    setIsMigrating(true);
    setMigrationProgress(0);

    try {
      const totalItems = 
        (data.suppliers?.length || 0) + 
        (data.accounts?.length || 0) + 
        (data.payments?.length || 0) + 
        (data.bankAccounts?.length || 0);
      
      let migratedItems = 0;

      // 1. Migrate Suppliers
      if (data.suppliers?.length > 0) {
        const suppliersToInsert = data.suppliers.map((s: any) => ({
          user_id: user.id,
          name: s.name,
          document: s.document || null,
          email: s.email || null,
          phone: s.phone || null,
          address: s.address || null,
        }));

        const { error } = await supabase
          .from('suppliers')
          .insert(suppliersToInsert);
        
        if (error) {
          console.error('Error migrating suppliers:', error);
          throw new Error(`Erro ao migrar fornecedores: ${error.message}`);
        }

        migratedItems += data.suppliers.length;
        setMigrationProgress(Math.round((migratedItems / totalItems) * 100));
      }

      // 2. Migrate Bank Accounts
      if (data.bankAccounts?.length > 0) {
        const bankAccountsToInsert = data.bankAccounts.map((ba: any) => ({
          user_id: user.id,
          name: ba.name,
          type: ba.type,
          bank_name: ba.bankName || null,
          agency: ba.agency || null,
          account_number: ba.accountNumber || null,
          initial_balance: ba.initialBalance || 0,
          current_balance: ba.currentBalance || ba.initialBalance || 0,
          is_active: ba.isActive !== false,
        }));

        const { error } = await supabase
          .from('bank_accounts')
          .insert(bankAccountsToInsert);
        
        if (error) {
          console.error('Error migrating bank accounts:', error);
          throw new Error(`Erro ao migrar contas bancárias: ${error.message}`);
        }

        migratedItems += data.bankAccounts.length;
        setMigrationProgress(Math.round((migratedItems / totalItems) * 100));
      }

      // 3. Migrate Accounts
      if (data.accounts?.length > 0) {
        const accountsToInsert = data.accounts.map((a: any) => ({
          user_id: user.id,
          type: a.type,
          description: a.description,
          amount: a.amount,
          due_date: new Date(a.dueDate).toISOString().split('T')[0],
          status: a.status,
          supplier_id: null, // We don't have the new supplier IDs yet
          supplier_name: a.supplierName || null,
          category: a.category || 'other',
          installment_number: a.installmentNumber || null,
          total_installments: a.totalInstallments || null,
          parent_id: null, // Parent IDs are old, we won't link them
          paid_at: a.paidAt ? new Date(a.paidAt).toISOString() : null,
          bank_account_id: null, // We don't have the new bank account IDs yet
          notes: a.notes || null,
          billing_slip_url: a.billingSlipUrl || null,
          payment_receipt_url: a.paymentReceiptUrl || null,
        }));

        const { error } = await supabase
          .from('accounts')
          .insert(accountsToInsert);
        
        if (error) {
          console.error('Error migrating accounts:', error);
          throw new Error(`Erro ao migrar contas: ${error.message}`);
        }

        migratedItems += data.accounts.length;
        setMigrationProgress(Math.round((migratedItems / totalItems) * 100));
      }

      // 4. Skip payments as they reference old account IDs
      // Payments will be created naturally when users use the app
      if (data.payments?.length > 0) {
        migratedItems += data.payments.length;
        setMigrationProgress(Math.round((migratedItems / totalItems) * 100));
      }

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();

      toast({
        title: 'Migração concluída!',
        description: `Migrados: ${data.suppliers?.length || 0} fornecedores, ${data.bankAccounts?.length || 0} contas bancárias e ${data.accounts?.length || 0} contas.`,
      });

      return true;
    } catch (error: any) {
      console.error('Migration error:', error);
      toast({
        title: 'Erro na migração',
        description: error.message || 'Ocorreu um erro ao migrar os dados.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsMigrating(false);
      setMigrationProgress(100);
    }
  };

  const clearLocalData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      toast({
        title: 'Dados locais removidos',
        description: 'Os dados do armazenamento local foram limpos.',
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  return {
    hasLocalData,
    getLocalDataSummary,
    migrateData,
    clearLocalData,
    isMigrating,
    migrationProgress,
  };
};
