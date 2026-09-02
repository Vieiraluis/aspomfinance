import { Fragment, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAccounts, useBankAccounts, useProcessPayment, useUpdateAccount } from '@/hooks/useSupabaseData';
import { Account, categoryGroups, categoryLabels, paymentMethodLabels, Payment } from '@/types/financial';
import { sumMoney } from '@/lib/money';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CreditCard, CheckCircle, TrendingDown, TrendingUp, Wallet, Loader2, Pencil, Tags } from 'lucide-react';

import { toast } from '@/hooks/use-toast';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { AttachmentButtons } from '@/components/attachments/AttachmentButtons';
import { AccountFilters } from '@/components/accounts/AccountFilters';
import { EditAccountDialog } from '@/components/accounts/EditAccountDialog';
import { PaymentDialog } from '@/components/accounts/PaymentDialog';

const Payments = () => {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: bankAccounts = [] } = useBankAccounts();
  const processPaymentMutation = useProcessPayment();
  const updateAccountMutation = useUpdateAccount();
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const activeBankAccounts = bankAccounts.filter(ba => ba.isActive);
  
 
  const pendingAccounts = accounts.filter(
    (a) => a.status === 'pending' || a.status === 'overdue'
  );
  
  const filteredAccounts = pendingAccounts.filter((a) => {
    const searchLower = search.toLowerCase();
    const searchNormalized = searchLower.replace(/[-\/]/g, '');
    const matchesSearch = a.description.toLowerCase().includes(searchLower) ||
      (a.supplierName && a.supplierName.toLowerCase().includes(searchLower)) ||
      (a.code && (a.code.toLowerCase().includes(searchLower) || a.code.toLowerCase().replace(/[-\/]/g, '').includes(searchNormalized)));
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(a.category);
    
    
    let matchesDateRange = true;
    if (startDate || endDate) {
      const accountDate = a.dueDate;
      if (startDate && endDate) {
        matchesDateRange = isWithinInterval(accountDate, { 
          start: startOfDay(startDate), 
          end: endOfDay(endDate) 
        });
      } else if (startDate) {
        matchesDateRange = accountDate >= startOfDay(startDate);
      } else if (endDate) {
        matchesDateRange = accountDate <= endOfDay(endDate);
      }
    }
    
    return matchesSearch && matchesType && matchesCategory && matchesDateRange;
  });

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  // Agrupa por categoria quando houver seleção de categorias
  const groupedAccounts: { category: string; accounts: Account[]; subtotal: number }[] = (() => {
    if (selectedCategories.length === 0) return [];
    const groups = new Map<string, Account[]>();
    filteredAccounts.forEach((a) => {
      const list = groups.get(a.category) || [];
      list.push(a);
      groups.set(a.category, list);
    });
    const order = categoryGroups.flatMap((g) => g.categories);
    return Array.from(groups.entries())
      .sort(([a], [b]) => {
        const ia = order.indexOf(a as never);
        const ib = order.indexOf(b as never);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      })
      .map(([category, list]) => ({
        category,
        accounts: list,
        subtotal: sumMoney(list, (x) => x.amount),
      }));
  })();

  const grandTotal = sumMoney(filteredAccounts, (a) => a.amount);
  
  const openPaymentDialog = (account: Account) => {
    setSelectedAccount(account);
    setIsPaymentOpen(true);
  };


  const openEditDialog = (account: Account) => {
    setEditingAccount(account);
    setIsEditOpen(true);
  };
  
  const handleUpdateAccount = async (id: string, data: Partial<Account>) => {
    try {
      await updateAccountMutation.mutateAsync({ id, ...data });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao atualizar.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Baixa de Pagamentos
            </h1>
            <p className="text-muted-foreground mt-1">
              Registre pagamentos e recebimentos
            </p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-destructive/20">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">A Pagar Pendentes</p>
              <p className="text-xl font-semibold text-destructive">
                {pendingAccounts.filter((a) => a.type === 'payable').length}
              </p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/20">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">A Receber Pendentes</p>
              <p className="text-xl font-semibold text-success">
                {pendingAccounts.filter((a) => a.type === 'receivable').length}
              </p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/20">
              <CreditCard className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pendente</p>
              <p className="text-xl font-semibold text-foreground">
                {pendingAccounts.length}
              </p>
            </div>
          </div>
        </div>
        
        {/* Filters - Sticky Menu */}
        <AccountFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={typeFilter}
          onStatusFilterChange={setTypeFilter}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          showDateFilter={true}
          searchPlaceholder="Buscar por código, descrição ou fornecedor..."
          statusOptions={[
            { value: 'all', label: 'Todas as Contas' },
            { value: 'payable', label: 'Contas a Pagar' },
            { value: 'receivable', label: 'Contas a Receber' },
          ]}
        />

        {/* Category selector + grouping */}
        <div className="glass-card p-3 flex flex-wrap items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Tags className="w-4 h-4" />
                {selectedCategories.length === 0
                  ? 'Todas as Categorias'
                  : `${selectedCategories.length} categoria(s) selecionada(s)`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 max-h-96 overflow-y-auto" align="start" side="bottom">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Filtrar e agrupar por categoria</p>
                  {selectedCategories.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCategories([])}>
                      Limpar
                    </Button>
                  )}
                </div>
                {categoryGroups.map((group) => (
                  <div key={group.label}>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.categories.map((key) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 text-sm cursor-pointer rounded px-1 py-0.5 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedCategories.includes(key)}
                            onCheckedChange={() => toggleCategory(key)}
                          />
                          {categoryLabels[key]}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {selectedCategories.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Agrupado por categoria · Total:{' '}
              <span className="font-semibold text-foreground">{formatCurrency(grandTotal)}</span>
            </p>
          )}
        </div>

        {/* Table */}
        <div className="glass-card overflow-x-auto">
          {filteredAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mb-3 opacity-50 text-success" />
              <p>Nenhuma conta pendente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor/Cliente</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Anexos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {account.code || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          account.type === 'payable'
                            ? 'bg-destructive/20 text-destructive border-destructive/30'
                            : 'bg-success/20 text-success border-success/30'
                        )}
                      >
                        {account.type === 'payable' ? 'Pagar' : 'Receber'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {account.description}
                      {account.installmentNumber && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({account.installmentNumber}/{account.totalInstallments})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {account.supplierName || '—'}
                    </TableCell>
                    <TableCell>{formatDate(account.dueDate)}</TableCell>
                    <TableCell className={cn(
                      'font-semibold',
                      account.type === 'payable' ? 'text-destructive' : 'text-success'
                    )}>
                      {formatCurrency(account.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          account.status === 'overdue'
                            ? 'bg-destructive/20 text-destructive border-destructive/30'
                            : 'bg-warning/20 text-warning border-warning/30'
                        )}
                      >
                        {account.status === 'overdue' ? 'Vencido' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <AttachmentButtons
                        billingSlipUrl={account.billingSlipUrl}
                        paymentReceiptUrl={account.paymentReceiptUrl}
                        onBillingSlipChange={(url) => handleUpdateAccount(account.id, { billingSlipUrl: url })}
                        onPaymentReceiptChange={(url) => handleUpdateAccount(account.id, { paymentReceiptUrl: url })}
                        compact
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(account)}
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4 text-primary" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openPaymentDialog(account)}
                          className="gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {account.type === 'payable' ? 'Pagar' : 'Receber'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        
        {/* Edit Dialog */}
        <EditAccountDialog
          account={editingAccount}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          type={editingAccount?.type || 'payable'}
        />
        
        {/* Payment Dialog */}
        <PaymentDialog
          account={selectedAccount}
          open={isPaymentOpen}
          onOpenChange={(open) => {
            setIsPaymentOpen(open);
            if (!open) setSelectedAccount(null);
          }}
        />

      </div>
    </MainLayout>
  );
};

export default Payments;
