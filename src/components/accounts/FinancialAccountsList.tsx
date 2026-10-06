import { useMemo, useState } from 'react';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { AccountFilters } from '@/components/accounts/AccountFilters';
import { AccountRowActions } from '@/components/accounts/AccountRowActions';
import { EditAccountDialog } from '@/components/accounts/EditAccountDialog';
import { FinancialActionsMenu } from '@/components/accounts/FinancialActionsMenu';
import { ReceiptDialog } from '@/components/receipts/ReceiptDialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TablePagination, usePagination } from '@/components/ui/table-pagination';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { toast } from '@/hooks/use-toast';
import { useAccounts, useDeleteAccount } from '@/hooks/useSupabaseData';
import { formatCurrency, formatDate } from '@/lib/format';
import { sumMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { Account, AccountCategory, categoryLabels } from '@/types/financial';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface FinancialAccountsListProps {
  type: 'payable' | 'receivable';
}

const statusStyles: Record<string, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  paid: 'bg-success/15 text-success border-success/30',
  overdue: 'bg-warning/15 text-warning border-warning/30',
  cancelled: 'bg-warning/15 text-warning border-warning/30',
};

export function FinancialAccountsList({ type }: FinancialAccountsListProps) {
  const { data: accounts = [], isLoading } = useAccounts();
  const deleteAccountMutation = useDeleteAccount();
  const isPayable = type === 'payable';
  const title = isPayable ? 'Contas a Pagar' : 'Contas a Receber';
  const entityLabel = isPayable ? 'Fornecedor' : 'Cliente';
  const entryPath = isPayable ? '/payables/lancamento' : '/receivables/lancamento';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [receiptMode, setReceiptMode] = useState<'single' | 'batch' | 'grouped'>('single');
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const filteredAccounts = useMemo(() => {
    const searchLower = search.toLowerCase();
    const searchNormalized = searchLower.replace(/[-/]/g, '');

    return accounts.filter((account) => {
      if (account.type !== type) return false;
      const matchesSearch =
        account.description.toLowerCase().includes(searchLower) ||
        account.supplierName?.toLowerCase().includes(searchLower) ||
        account.code?.toLowerCase().includes(searchLower) ||
        account.code?.toLowerCase().replace(/[-/]/g, '').includes(searchNormalized);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' ? account.status === 'paid' : account.status !== 'paid');
      const matchesCategory = categoryFilter === 'all' || account.category === categoryFilter;
      let matchesDate = true;

      if (startDate && endDate) {
        matchesDate = isWithinInterval(account.dueDate, {
          start: startOfDay(startDate),
          end: endOfDay(endDate),
        });
      } else if (startDate) {
        matchesDate = account.dueDate >= startOfDay(startDate);
      } else if (endDate) {
        matchesDate = account.dueDate <= endOfDay(endDate);
      }

      return Boolean(matchesSearch && matchesStatus && matchesCategory && matchesDate);
    });
  }, [accounts, categoryFilter, endDate, search, startDate, statusFilter, type]);

  const paidAccounts = filteredAccounts.filter((account) => account.status === 'paid');
  const openTotal = sumMoney(filteredAccounts.filter((account) => account.status !== 'paid'), (account) => account.amount);
  const paidTotal = sumMoney(paidAccounts, (account) => account.amount);
  const pagination = usePagination(filteredAccounts, 50);

  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccounts((current) =>
      current.includes(accountId) ? current.filter((id) => id !== accountId) : [...current, accountId],
    );
  };

  const toggleSelectAll = () => {
    setSelectedAccounts((current) =>
      current.length === paidAccounts.length ? [] : paidAccounts.map((account) => account.id),
    );
  };

  const openReceipts = (mode: 'batch' | 'grouped') => {
    const minimum = mode === 'grouped' ? 2 : 1;
    if (selectedAccounts.length < minimum) {
      toast({
        title: 'Selecione parcelas',
        description: mode === 'grouped'
          ? 'Selecione ao menos duas parcelas pagas para agrupar em um único recibo.'
          : `Selecione ao menos uma conta ${isPayable ? 'paga' : 'recebida'} para gerar recibos.`,
        variant: 'destructive',
      });
      return;
    }
    setReceiptMode(mode);
    setIsReceiptDialogOpen(true);
  };

  const openSingleReceipt = (account: Account) => {
    setSelectedAccounts([account.id]);
    setReceiptMode('single');
    setIsReceiptDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAccountMutation.mutateAsync(id);
      toast({ title: 'Conta excluída!' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao excluir.',
        variant: 'destructive',
      });
    }
  };

  const EmptyIcon = isPayable ? TrendingDown : TrendingUp;

  return (
    <MainLayout>
      <div className="mx-auto max-w-[1500px] animate-fade-in space-y-3">
        <header className="sticky top-14 z-20 flex min-h-12 items-center justify-between gap-3 border-b border-border/60 bg-background/95 py-2 backdrop-blur md:top-16">
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-semibold text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground">
              {filteredAccounts.length} lançamentos no resultado atual
            </p>
          </div>
          <FinancialActionsMenu
            entryPath={entryPath}
            selectedCount={selectedAccounts.length}
            hasPaidAccounts={paidAccounts.length > 0}
            onBatchReceipts={() => openReceipts('batch')}
            onGroupedReceipt={() => openReceipts('grouped')}
          />
        </header>

        <div className="flex flex-col gap-3 lg:flex-row">
          <AccountFilters
            layout="sidebar"
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            showCategoryFilter
            showDateFilter
            searchPlaceholder={`Buscar código, descrição ou ${entityLabel.toLowerCase()}...`}
            statusOptions={[
              { value: 'all', label: 'Todos' },
              { value: 'pending', label: 'Pendentes' },
              { value: 'paid', label: isPayable ? 'Pagos' : 'Recebidos' },
            ]}
          />

          <section className="min-w-0 flex-1 overflow-hidden rounded-md border border-border/70 bg-card/50">
            {isLoading ? (
              <TableSkeleton columns={8} rows={8} />
            ) : filteredAccounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <EmptyIcon className="mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">Nenhuma conta encontrada</p>
              </div>
            ) : (
              <Table className="text-xs">
                <TableHeader className="bg-muted/35">
                  <TableRow className="hover:bg-transparent">
                    {paidAccounts.length > 0 && (
                      <TableHead className="h-9 w-9 px-2">
                        <Checkbox
                          checked={selectedAccounts.length === paidAccounts.length && paidAccounts.length > 0}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Selecionar todas as contas quitadas"
                        />
                      </TableHead>
                    )}
                    <TableHead className="h-9 w-24 px-2 text-[10px] uppercase">Código</TableHead>
                    <TableHead className="h-9 min-w-48 px-2 text-[10px] uppercase">Lançamento</TableHead>
                    <TableHead className="h-9 min-w-36 px-2 text-[10px] uppercase">{entityLabel}</TableHead>
                    <TableHead className="h-9 min-w-36 px-2 text-[10px] uppercase">Categoria</TableHead>
                    <TableHead className="h-9 w-24 px-2 text-[10px] uppercase">Vencimento</TableHead>
                    <TableHead className="h-9 w-28 px-2 text-right text-[10px] uppercase">Valor</TableHead>
                    <TableHead className="h-9 w-20 px-2 text-center text-[10px] uppercase">Status</TableHead>
                    <TableHead className="h-9 w-48 px-2 text-right text-[10px] uppercase">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.paged.map((account) => (
                    <TableRow key={account.id} className="h-11">
                      {paidAccounts.length > 0 && (
                        <TableCell className="px-2 py-1.5">
                          {account.status === 'paid' && (
                            <Checkbox
                              checked={selectedAccounts.includes(account.id)}
                              onCheckedChange={() => toggleAccountSelection(account.id)}
                              aria-label={`Selecionar ${account.description}`}
                            />
                          )}
                        </TableCell>
                      )}
                      <TableCell className="whitespace-nowrap px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
                        {account.code || '—'}
                      </TableCell>
                      <TableCell className="max-w-64 px-2 py-1.5 font-medium">
                        <div className="truncate">{account.description}</div>
                        {account.installmentNumber && (
                          <div className="text-[10px] text-muted-foreground">
                            Parcela {account.installmentNumber}/{account.totalInstallments}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-48 truncate px-2 py-1.5">{account.supplierName || '—'}</TableCell>
                      <TableCell className="max-w-48 truncate px-2 py-1.5 text-muted-foreground">
                        {categoryLabels[account.category as AccountCategory]}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-1.5">{formatDate(account.dueDate)}</TableCell>
                      <TableCell className={cn('whitespace-nowrap px-2 py-1.5 text-right font-semibold', isPayable ? 'text-destructive' : 'text-success')}>
                        {formatCurrency(account.amount)}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-center">
                        <Badge variant="outline" className={cn('px-1.5 py-0 text-[10px] font-medium', statusStyles[account.status])}>
                          {account.status === 'paid' ? (isPayable ? 'Pago' : 'Recebido') : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-1 py-1 text-right">
                        <AccountRowActions
                          account={account}
                          onEdit={(selected) => {
                            setEditingAccount(selected);
                            setIsEditOpen(true);
                          }}
                          onReceipt={openSingleReceipt}
                          onDelete={handleDelete}
                          isDeleting={deleteAccountMutation.isPending}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!isLoading && filteredAccounts.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-border/60 bg-muted/20 px-3 py-2 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-[10px] uppercase text-muted-foreground">
                  <span>Em aberto <strong className="ml-1 text-foreground">{formatCurrency(openTotal)}</strong></span>
                  <span>{isPayable ? 'Pago' : 'Recebido'} <strong className="ml-1 text-success">{formatCurrency(paidTotal)}</strong></span>
                </div>
                <TablePagination
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  totalPages={pagination.totalPages}
                  onPageChange={pagination.setPage}
                  onPageSizeChange={pagination.setPageSize}
                  itemLabel="contas"
                />
              </div>
            )}
          </section>
        </div>

        <EditAccountDialog
          account={editingAccount}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          type={type}
        />
        <ReceiptDialog
          open={isReceiptDialogOpen}
          onOpenChange={(open) => {
            setIsReceiptDialogOpen(open);
            if (!open) setSelectedAccounts([]);
          }}
          accounts={accounts.filter((account) => selectedAccounts.includes(account.id))}
          mode={receiptMode}
        />
      </div>
    </MainLayout>
  );
}