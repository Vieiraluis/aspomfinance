import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Account, Supplier, Payment, BankAccount, FinancialSummary, BankAccountType, AccountCategory } from '@/types/financial';
import { addMonths, isBefore, startOfDay, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { normalizeStorageUrl } from '@/lib/storageUrl';

// Helper to parse date string without timezone issues
const parseDateOnly = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

// Helper to convert database row to frontend type
const mapAccountFromDB = (row: any): Account => ({
  id: row.id,
  type: row.type as 'payable' | 'receivable',
  description: row.description,
  amount: Number(row.amount),
  dueDate: parseDateOnly(row.due_date),
  status: row.status as 'pending' | 'paid' | 'overdue' | 'cancelled',
  supplierId: row.supplier_id || undefined,
  supplierName: row.supplier_name || undefined,
  category: row.category,
  installmentNumber: row.installment_number || undefined,
  totalInstallments: row.total_installments || undefined,
  parentId: row.parent_id || undefined,
  paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
  bankAccountId: row.bank_account_id || undefined,
  createdAt: new Date(row.created_at),
  notes: row.notes || undefined,
  billingSlipUrl: normalizeStorageUrl(row.billing_slip_url),
  paymentReceiptUrl: normalizeStorageUrl(row.payment_receipt_url),
});

const mapSupplierFromDB = (row: any): Supplier => ({
  id: row.id,
  name: row.name,
  document: row.document || '',
  email: row.email || '',
  phone: row.phone || '',
  address: row.address || undefined,
  type: (row.type as Supplier['type']) || 'supplier',
  createdAt: new Date(row.created_at),
});

const mapBankAccountFromDB = (row: any): BankAccount => ({
  id: row.id,
  name: row.name,
  type: row.type as BankAccountType,
  bankName: row.bank_name || undefined,
  agency: row.agency || undefined,
  accountNumber: row.account_number || undefined,
  initialBalance: Number(row.initial_balance),
  currentBalance: Number(row.current_balance),
  isActive: row.is_active,
  createdAt: new Date(row.created_at),
});

const mapPaymentFromDB = (row: any): Payment => ({
  id: row.id,
  accountId: row.account_id,
  amount: Number(row.amount),
  paidAt: new Date(row.paid_at),
  paymentMethod: row.payment_method as Payment['paymentMethod'],
  bankAccountId: row.bank_account_id || undefined,
  notes: row.notes || undefined,
});

// ============== SUPPLIERS ==============
export const useSuppliers = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['suppliers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      return (data || []).map(mapSupplierFromDB);
    },
    enabled: !!user,
  });
};

export const useAddSupplier = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          user_id: user.id,
          name: supplier.name,
          document: supplier.document || null,
          email: supplier.email || null,
          phone: supplier.phone || null,
          address: supplier.address || null,
          type: supplier.type || 'supplier',
        })
        .select()
        .single();
      
      if (error) throw error;
      return mapSupplierFromDB(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...supplier }: { id: string } & Partial<Supplier>) => {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: supplier.name,
          document: supplier.document || null,
          email: supplier.email || null,
          phone: supplier.phone || null,
          address: supplier.address || null,
          type: supplier.type || undefined,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};

// ============== ACCOUNTS ==============
export const useAccounts = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date');
      
      if (error) throw error;
      return (data || []).map(mapAccountFromDB);
    },
    enabled: !!user,
  });
};

export const useAddAccount = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (account: Omit<Account, 'id' | 'createdAt'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          type: account.type,
          description: account.description,
          amount: account.amount,
          due_date: account.dueDate.toISOString().split('T')[0],
          status: account.status,
          supplier_id: account.supplierId || null,
          supplier_name: account.supplierName || null,
          category: account.category,
          installment_number: account.installmentNumber || null,
          total_installments: account.totalInstallments || null,
          parent_id: account.parentId || null,
          paid_at: account.paidAt?.toISOString() || null,
          bank_account_id: account.bankAccountId || null,
          notes: account.notes || null,
          billing_slip_url: account.billingSlipUrl || null,
          payment_receipt_url: account.paymentReceiptUrl || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return mapAccountFromDB(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...account }: { id: string } & Partial<Account>) => {
      const updateData: any = {};
      
      if (account.type !== undefined) updateData.type = account.type;
      if (account.description !== undefined) updateData.description = account.description;
      if (account.amount !== undefined) updateData.amount = account.amount;
      if (account.dueDate !== undefined) updateData.due_date = account.dueDate.toISOString().split('T')[0];
      if (account.status !== undefined) updateData.status = account.status;
      if (account.supplierId !== undefined) updateData.supplier_id = account.supplierId || null;
      if (account.supplierName !== undefined) updateData.supplier_name = account.supplierName || null;
      if (account.category !== undefined) updateData.category = account.category;
      if (account.paidAt !== undefined) updateData.paid_at = account.paidAt?.toISOString() || null;
      if (account.bankAccountId !== undefined) updateData.bank_account_id = account.bankAccountId || null;
      if (account.notes !== undefined) updateData.notes = account.notes || null;
      // Attachment URLs
      if (account.billingSlipUrl !== undefined) updateData.billing_slip_url = account.billingSlipUrl || null;
      if (account.paymentReceiptUrl !== undefined) updateData.payment_receipt_url = account.paymentReceiptUrl || null;
      
      const { error } = await supabase
        .from('accounts')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Delete child accounts (installments) first
      const { error: childError } = await supabase
        .from('accounts')
        .delete()
        .eq('parent_id', id);
      
      if (childError) throw childError;
      
      // Delete the main account
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useGenerateInstallments = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      baseAccount, 
      numberOfInstallments 
    }: { 
      baseAccount: Omit<Account, 'id' | 'createdAt' | 'installmentNumber' | 'totalInstallments' | 'parentId'>;
      numberOfInstallments: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const installmentAmount = baseAccount.amount / numberOfInstallments;
      
      const installments = Array.from({ length: numberOfInstallments }, (_, index) => ({
        user_id: user.id,
        type: baseAccount.type,
        description: `${baseAccount.description} (${index + 1}/${numberOfInstallments})`,
        amount: installmentAmount,
        due_date: addMonths(new Date(baseAccount.dueDate), index).toISOString().split('T')[0],
        status: baseAccount.status,
        supplier_id: baseAccount.supplierId || null,
        supplier_name: baseAccount.supplierName || null,
        category: baseAccount.category,
        installment_number: index + 1,
        total_installments: numberOfInstallments,
        notes: baseAccount.notes || null,
      }));
      
      const { error } = await supabase
        .from('accounts')
        .insert(installments);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

// ============== PAYMENTS ==============
export const usePayments = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['payments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('paid_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapPaymentFromDB);
    },
    enabled: !!user,
  });
};

export const useProcessPayment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      accountId, 
      payment 
    }: { 
      accountId: string; 
      payment: Omit<Payment, 'id' | 'accountId'>;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Get the account to determine the type
      const { data: accountData, error: accountFetchError } = await supabase
        .from('accounts')
        .select('type')
        .eq('id', accountId)
        .single();
      
      if (accountFetchError) throw accountFetchError;
      
      // Insert payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          account_id: accountId,
          amount: payment.amount,
          paid_at: payment.paidAt.toISOString(),
          payment_method: payment.paymentMethod,
          bank_account_id: payment.bankAccountId || null,
          notes: payment.notes || null,
        });
      
      if (paymentError) throw paymentError;
      
      // Update account status
      const { error: accountError } = await supabase
        .from('accounts')
        .update({
          status: 'paid',
          paid_at: payment.paidAt.toISOString(),
          bank_account_id: payment.bankAccountId || null,
        })
        .eq('id', accountId);
      
      if (accountError) throw accountError;
      
      // Update bank account balance if specified
      if (payment.bankAccountId) {
        const { data: bankData, error: bankFetchError } = await supabase
          .from('bank_accounts')
          .select('current_balance')
          .eq('id', payment.bankAccountId)
          .single();
        
        if (bankFetchError) throw bankFetchError;
        
        const balanceChange = accountData.type === 'receivable' 
          ? payment.amount 
          : -payment.amount;
        
        const { error: bankUpdateError } = await supabase
          .from('bank_accounts')
          .update({
            current_balance: Number(bankData.current_balance) + balanceChange,
          })
          .eq('id', payment.bankAccountId);
        
        if (bankUpdateError) throw bankUpdateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['bank_accounts'] });
    },
  });
};

// ============== BANK ACCOUNTS ==============
export const useBankAccounts = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['bank_accounts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      return (data || []).map(mapBankAccountFromDB);
    },
    enabled: !!user,
  });
};

export const useAddBankAccount = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (bankAccount: Omit<BankAccount, 'id' | 'createdAt' | 'currentBalance'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: user.id,
          name: bankAccount.name,
          type: bankAccount.type,
          bank_name: bankAccount.bankName || null,
          agency: bankAccount.agency || null,
          account_number: bankAccount.accountNumber || null,
          initial_balance: bankAccount.initialBalance,
          current_balance: bankAccount.initialBalance,
          is_active: bankAccount.isActive,
        })
        .select()
        .single();
      
      if (error) throw error;
      return mapBankAccountFromDB(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank_accounts'] });
    },
  });
};

export const useUpdateBankAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...bankAccount }: { id: string } & Partial<BankAccount>) => {
      const updateData: any = {};
      
      if (bankAccount.name !== undefined) updateData.name = bankAccount.name;
      if (bankAccount.type !== undefined) updateData.type = bankAccount.type;
      if (bankAccount.bankName !== undefined) updateData.bank_name = bankAccount.bankName || null;
      if (bankAccount.agency !== undefined) updateData.agency = bankAccount.agency || null;
      if (bankAccount.accountNumber !== undefined) updateData.account_number = bankAccount.accountNumber || null;
      if (bankAccount.isActive !== undefined) updateData.is_active = bankAccount.isActive;
      if (bankAccount.currentBalance !== undefined) updateData.current_balance = bankAccount.currentBalance;
      
      const { error } = await supabase
        .from('bank_accounts')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank_accounts'] });
    },
  });
};

export const useDeleteBankAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank_accounts'] });
    },
  });
};

// ============== SUMMARY ==============
export const useFinancialSummary = (): FinancialSummary => {
  const { data: accounts = [] } = useAccounts();
  
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  
  const pendingPayable = accounts.filter(
    (a) => a.type === 'payable' && a.status === 'pending'
  );
  const pendingReceivable = accounts.filter(
    (a) => a.type === 'receivable' && a.status === 'pending'
  );
  
  const totalPayable = pendingPayable.reduce((sum, a) => sum + a.amount, 0);
  const totalReceivable = pendingReceivable.reduce((sum, a) => sum + a.amount, 0);
  
  const overduePayable = pendingPayable
    .filter((a) => isBefore(new Date(a.dueDate), today))
    .reduce((sum, a) => sum + a.amount, 0);
    
  const overdueReceivable = pendingReceivable
    .filter((a) => isBefore(new Date(a.dueDate), today))
    .reduce((sum, a) => sum + a.amount, 0);
    
  const paidThisMonth = accounts
    .filter(
      (a) =>
        a.type === 'payable' &&
        a.status === 'paid' &&
        a.paidAt &&
        isWithinInterval(new Date(a.paidAt), { start: monthStart, end: monthEnd })
    )
    .reduce((sum, a) => sum + a.amount, 0);
    
  const receivedThisMonth = accounts
    .filter(
      (a) =>
        a.type === 'receivable' &&
        a.status === 'paid' &&
        a.paidAt &&
        isWithinInterval(new Date(a.paidAt), { start: monthStart, end: monthEnd })
    )
    .reduce((sum, a) => sum + a.amount, 0);
    
  return {
    totalPayable,
    totalReceivable,
    overduePayable,
    overdueReceivable,
    paidThisMonth,
    receivedThisMonth,
    balance: totalReceivable - totalPayable,
  };
};

// ============== UPDATE OVERDUE STATUS ==============
export const useUpdateOverdueStatus = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const today = startOfDay(new Date()).toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('accounts')
        .update({ status: 'overdue' })
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .lt('due_date', today);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};
