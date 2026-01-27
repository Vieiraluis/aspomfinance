import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account, Supplier, Payment, FinancialSummary, BankAccount } from '@/types/financial';
import { addMonths, isBefore, startOfDay, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface FinancialStore {
  suppliers: Supplier[];
  accounts: Account[];
  payments: Payment[];
  bankAccounts: BankAccount[];
  
  // Supplier actions
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  
  // Account actions
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  
  // Payment actions
  processPayment: (accountId: string, payment: Omit<Payment, 'id' | 'accountId'>) => void;
  
  // Installment generation
  generateInstallments: (
    baseAccount: Omit<Account, 'id' | 'createdAt' | 'installmentNumber' | 'totalInstallments' | 'parentId'>,
    numberOfInstallments: number
  ) => void;
  
  // Bank Account actions
  addBankAccount: (bankAccount: Omit<BankAccount, 'id' | 'createdAt' | 'currentBalance'>) => void;
  updateBankAccount: (id: string, bankAccount: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;
  
  // Summary
  getSummary: () => FinancialSummary;
  
  // Update overdue status
  updateOverdueStatus: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useFinancialStore = create<FinancialStore>()(
  persist(
    (set, get) => ({
      suppliers: [],
      accounts: [],
      payments: [],
      bankAccounts: [],
      
      addSupplier: (supplier) => {
        const newSupplier: Supplier = {
          ...supplier,
          id: generateId(),
          createdAt: new Date(),
        };
        set((state) => ({ suppliers: [...state.suppliers, newSupplier] }));
      },
      
      updateSupplier: (id, supplier) => {
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === id ? { ...s, ...supplier } : s
          ),
        }));
      },
      
      deleteSupplier: (id) => {
        set((state) => ({
          suppliers: state.suppliers.filter((s) => s.id !== id),
        }));
      },
      
      addAccount: (account) => {
        const newAccount: Account = {
          ...account,
          id: generateId(),
          createdAt: new Date(),
        };
        set((state) => ({ accounts: [...state.accounts, newAccount] }));
      },
      
      updateAccount: (id, account) => {
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, ...account } : a
          ),
        }));
      },
      
      deleteAccount: (id) => {
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id && a.parentId !== id),
        }));
      },
      
      processPayment: (accountId, payment) => {
        const newPayment: Payment = {
          ...payment,
          id: generateId(),
          accountId,
        };
        
        const account = get().accounts.find(a => a.id === accountId);
        
        set((state) => {
          // Atualiza saldo da conta bancária
          let updatedBankAccounts = state.bankAccounts;
          if (payment.bankAccountId) {
            updatedBankAccounts = state.bankAccounts.map((ba) => {
              if (ba.id === payment.bankAccountId) {
                const balanceChange = account?.type === 'receivable' 
                  ? payment.amount 
                  : -payment.amount;
                return { ...ba, currentBalance: ba.currentBalance + balanceChange };
              }
              return ba;
            });
          }
          
          return {
            payments: [...state.payments, newPayment],
            accounts: state.accounts.map((a) =>
              a.id === accountId
                ? { ...a, status: 'paid', paidAt: payment.paidAt, bankAccountId: payment.bankAccountId }
                : a
            ),
            bankAccounts: updatedBankAccounts,
          };
        });
      },
      
      generateInstallments: (baseAccount, numberOfInstallments) => {
        const parentId = generateId();
        const installmentAmount = baseAccount.amount / numberOfInstallments;
        
        const installments: Account[] = Array.from({ length: numberOfInstallments }, (_, index) => ({
          ...baseAccount,
          id: generateId(),
          amount: installmentAmount,
          dueDate: addMonths(new Date(baseAccount.dueDate), index),
          installmentNumber: index + 1,
          totalInstallments: numberOfInstallments,
          parentId: index === 0 ? undefined : parentId,
          description: `${baseAccount.description} (${index + 1}/${numberOfInstallments})`,
          createdAt: new Date(),
        }));
        
        set((state) => ({ accounts: [...state.accounts, ...installments] }));
      },
      
      addBankAccount: (bankAccount) => {
        const newBankAccount: BankAccount = {
          ...bankAccount,
          id: generateId(),
          currentBalance: bankAccount.initialBalance,
          createdAt: new Date(),
        };
        set((state) => ({ bankAccounts: [...state.bankAccounts, newBankAccount] }));
      },
      
      updateBankAccount: (id, bankAccount) => {
        set((state) => ({
          bankAccounts: state.bankAccounts.map((ba) =>
            ba.id === id ? { ...ba, ...bankAccount } : ba
          ),
        }));
      },
      
      deleteBankAccount: (id) => {
        set((state) => ({
          bankAccounts: state.bankAccounts.filter((ba) => ba.id !== id),
        }));
      },
      
      getSummary: () => {
        const { accounts } = get();
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
      },
      
      updateOverdueStatus: () => {
        const today = startOfDay(new Date());
        set((state) => ({
          accounts: state.accounts.map((a) => {
            if (a.status === 'pending' && isBefore(new Date(a.dueDate), today)) {
              return { ...a, status: 'overdue' };
            }
            return a;
          }),
        }));
      },
    }),
    {
      name: 'financial-store',
      partialize: (state) => ({
        suppliers: state.suppliers,
        accounts: state.accounts,
        payments: state.payments,
        bankAccounts: state.bankAccounts,
      }),
    }
  )
);
