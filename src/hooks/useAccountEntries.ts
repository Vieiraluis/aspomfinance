import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Account, AccountCategory, Payment } from '@/types/financial';
import { normalizeStorageUrl } from '@/lib/storageUrl';
import { addMonths } from 'date-fns';
import { subMoney, toCents, fromCents } from '@/lib/money';

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
  paymentMethod: Payment['paymentMethod'];
  bankAccountId: string;
  notes?: string;
  /** Valor efetivamente quitado (pode ser parcial em relação ao total selecionado). */
  amount: number;
  headId?: string;
}

/**
 * Quita uma ou mais parcelas de forma agrupada.
 * Em quitação parcial, gera automaticamente uma nova parcela com o saldo restante.
 */
export const useSettleInstallments = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: SettleInput) => {
      if (!user) throw new Error('Not authenticated');
      const { accounts, paidAt, paymentMethod, bankAccountId, notes } = input;
      if (accounts.length === 0) throw new Error('Nenhuma parcela selecionada');

      let remaining = toCents(input.amount);

      for (const acc of accounts) {
        const accCents = toCents(acc.amount);
        const payCents = Math.max(0, Math.min(accCents, remaining));
        remaining -= payCents;

        if (payCents === 0) continue;

        const paidValue = fromCents(payCents);

        const { error: paymentError } = await supabase.from('payments').insert({
          user_id: user.id,
          account_id: acc.id,
          amount: paidValue,
          paid_at: paidAt.toISOString(),
          payment_method: paymentMethod,
          bank_account_id: bankAccountId || null,
          notes: notes || null,
        });
        if (paymentError) throw paymentError;

        const { error: updateError } = await supabase
          .from('accounts')
          .update({
            status: 'paid',
            paid_at: paidAt.toISOString(),
            bank_account_id: bankAccountId || null,
            amount: paidValue,
          })
          .eq('id', acc.id);
        if (updateError) throw updateError;

        // Quitação parcial: gera a parcela com o saldo restante
        if (payCents < accCents) {
          const residual = subMoney(acc.amount, paidValue);
          const { error: residualError } = await supabase.from('accounts').insert({
            user_id: user.id,
            type: acc.type,
            description: `${acc.description} - saldo`,
            document_number: acc.documentNumber || null,
            payment_terms: acc.paymentTerms || null,
            amount: residual,
            due_date: toDateStr(acc.dueDate),
            status: 'pending',
            supplier_id: acc.supplierId || null,
            supplier_name: acc.supplierName || null,
            category: acc.category,
            parent_id: input.headId || acc.parentId || acc.id,
            notes: acc.notes || null,
          });
          if (residualError) throw residualError;
        }
      }

      // Ajuste do saldo bancário (uma única movimentação pelo total quitado)
      if (bankAccountId) {
        const { data: bankData, error: bankFetchError } = await supabase
          .from('bank_accounts')
          .select('current_balance')
          .eq('id', bankAccountId)
          .single();
        if (bankFetchError) throw bankFetchError;

        const settled = fromCents(toCents(input.amount) - Math.max(0, remaining));
        const delta = accounts[0].type === 'receivable' ? settled : -settled;

        const { error: bankUpdateError } = await supabase
          .from('bank_accounts')
          .update({ current_balance: Number(bankData.current_balance) + delta })
          .eq('id', bankAccountId);
        if (bankUpdateError) throw bankUpdateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account-entry'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['bank_accounts'] });
    },
  });
};

export const buildInstallmentDates = (firstDue: Date, count: number): Date[] =>
  Array.from({ length: count }, (_, i) => addMonths(firstDue, i));
