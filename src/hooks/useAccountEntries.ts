import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Account, AccountCategory } from '@/types/financial';
import { normalizeStorageUrl } from '@/lib/storageUrl';
import { addMonths } from 'date-fns';
import { toCents, fromCents, sumMoney } from '@/lib/money';
import { SettlementPart, validateSettlement } from '@/lib/settlement';

const parseDateOnly = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const mapRow = (row: any): Account => ({
  id: row.id,
  code: row.code || undefined,
  documentNumber: row.document_number || undefined,
  paymentTerms: row.payment_terms || undefined,
  type: row.type,
  description: row.description,
  amount: Number(row.amount),
  dueDate: parseDateOnly(row.due_date),
  status: row.status,
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

/** Carrega um lançamento (cabeçalho + parcelas) a partir do id da parcela-cabeçalho. */
export const useAccountEntry = (headId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['account-entry', headId, user?.id],
    queryFn: async () => {
      if (!user || !headId) return null;
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .or(`id.eq.${headId},parent_id.eq.${headId}`)
        .order('due_date');

      if (error) throw error;
      const rows = (data || []).map(mapRow);
      const head = rows.find((r) => r.id === headId) || null;
      if (!head) return null;
      return { head, installments: rows };
    },
    enabled: !!user && !!headId,
  });
};

export interface EntryInstallmentInput {
  id?: string;
  dueDate: Date;
  amount: number;
  installmentNumber: number;
}

export interface EntryInput {
  headId?: string;
  type: 'payable' | 'receivable';
  description: string;
  documentNumber?: string;
  paymentTerms: string;
  supplierId?: string;
  supplierName?: string;
  category: AccountCategory;
  notes?: string;
  installments: EntryInstallmentInput[];
}

/** Divide um valor total em N parcelas, ajustando os centavos na última. */
export const splitInstallments = (total: number, count: number): number[] => {
  const totalCents = toCents(total);
  const base = Math.floor(totalCents / count);
  const values = Array.from({ length: count }, () => base);
  values[count - 1] += totalCents - base * count;
  return values.map(fromCents);
};

export const useSaveAccountEntry = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entry: EntryInput) => {
      if (!user) throw new Error('Not authenticated');

      const total = entry.installments.length;
      const rowFor = (inst: EntryInstallmentInput) => ({
        user_id: user.id,
        type: entry.type,
        description:
          total > 1
            ? `${entry.description} (${inst.installmentNumber}/${total})`
            : entry.description,
        document_number: entry.documentNumber || null,
        payment_terms: entry.paymentTerms,
        amount: inst.amount,
        due_date: toDateStr(inst.dueDate),
        status: 'pending',
        supplier_id: entry.supplierId || null,
        supplier_name: entry.supplierName || null,
        category: entry.category,
        installment_number: total > 1 ? inst.installmentNumber : null,
        total_installments: total > 1 ? total : null,
        notes: entry.notes || null,
      });

      // Atualização de um lançamento existente
      if (entry.headId) {
        for (const inst of entry.installments) {
          if (inst.id) {
            const { error } = await supabase
              .from('accounts')
              .update(rowFor(inst))
              .eq('id', inst.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('accounts')
              .insert({ ...rowFor(inst), parent_id: entry.headId });
            if (error) throw error;
          }
        }
        return entry.headId;
      }

      // Novo lançamento: primeira parcela é o cabeçalho do grupo
      const [first, ...rest] = entry.installments;
      const { data: headRow, error: headError } = await supabase
        .from('accounts')
        .insert(rowFor(first))
        .select()
        .single();
      if (headError) throw headError;

      if (rest.length > 0) {
        const { error } = await supabase
          .from('accounts')
          .insert(rest.map((inst) => ({ ...rowFor(inst), parent_id: headRow.id })));
        if (error) throw error;
      }

      return headRow.id as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account-entry'] });
    },
  });
};

export interface SettleInput {
  accounts: Account[];
  paidAt: Date;
  notes?: string;
  amount: number;
  interest: number;
  discount: number;
  parts: SettlementPart[];
  settlementId: string;
}

/** Atomic settlement: separate payment methods, residual principal and bank movements. */
export const useSettleInstallments = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: SettleInput) => {
      if (!user) throw new Error('Not authenticated');
      const errorMessage = validateSettlement(input.amount, input.interest, input.discount,
        sumMoney(input.accounts, a => a.amount), input.parts);
      if (errorMessage) throw new Error(errorMessage);
      const { error } = await supabase.rpc('settle_account_installments', {
        p_account_ids: input.accounts.map(a => a.id),
        p_paid_at: input.paidAt.toISOString(),
        p_principal: input.amount,
        p_interest: input.interest,
        p_discount: input.discount,
        p_parts: input.parts.map(p => ({ amount: p.amount, paymentMethod: p.paymentMethod, bankAccountId: p.bankAccountId })),
        p_notes: input.notes || '',
        p_settlement_id: input.settlementId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      for (const key of ['accounts', 'account-entry', 'payments', 'bank_accounts']) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
};

export const buildInstallmentDates = (firstDue: Date, count: number): Date[] =>
  Array.from({ length: count }, (_, i) => addMonths(firstDue, i));
