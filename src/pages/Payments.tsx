import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAccounts, useBankAccounts, useProcessPayment, useUpdateAccount } from '@/hooks/useSupabaseData';
import { Account, paymentMethodLabels, Payment } from '@/types/financial';
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
import { CreditCard, CheckCircle, TrendingDown, TrendingUp, Wallet, Loader2, Pencil } from 'lucide-react';

import { toast } from '@/hooks/use-toast';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { AttachmentButtons } from '@/components/attachments/AttachmentButtons';
import { AccountFilters } from '@/components/accounts/AccountFilters';
import { EditAccountDialog } from '@/components/accounts/EditAccountDialog';

const Payments = () => {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: bankAccounts = [] } = useBankAccounts();
  const processPaymentMutation = useProcessPayment();
  const updateAccountMutation = useUpdateAccount();
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const activeBankAccounts = bankAccounts.filter(ba => ba.isActive);
  
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'pix' as Payment['paymentMethod'],
    paidAt: format(new Date(), 'yyyy-MM-dd'),
    bankAccountId: '',
    notes: '',
  });
  
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
    
    return matchesSearch && matchesType && matchesDateRange;
  });
  
  const openPaymentDialog = (account: Account) => {
    setSelectedAccount(account);
    setPaymentData({
      amount: account.amount.toString(),
      paymentMethod: 'pix',
      paidAt: format(new Date(), 'yyyy-MM-dd'),
      bankAccountId: activeBankAccounts[0]?.id || '',
      notes: '',
    });
    setIsPaymentOpen(true);
  };

  const openEditDialog = (account: Account) => {
    setEditingAccount(account);
    setIsEditOpen(true);
  };
  
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccount) return;
    
    if (!paymentData.bankAccountId) {
      toast({
        title: 'Selecione uma conta',
        description: 'É necessário selecionar uma conta bancária para a baixa.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Create date at noon to avoid timezone issues
      const [year, month, day] = paymentData.paidAt.split('-').map(Number);
      const paidAt = new Date(year, month - 1, day, 12, 0, 0);
      
      await processPaymentMutation.mutateAsync({
        accountId: selectedAccount.id,
        payment: {
          amount: parseFloat(paymentData.amount),
          paymentMethod: paymentData.paymentMethod,
          paidAt: paidAt,
          bankAccountId: paymentData.bankAccountId,
          notes: paymentData.notes || undefined,
        },
      });
      
      const bankAccount = bankAccounts.find(ba => ba.id === paymentData.bankAccountId);
      
      toast({
        title: selectedAccount.type === 'payable' ? 'Pagamento registrado!' : 'Recebimento registrado!',
        description: `${selectedAccount.description} - ${formatCurrency(parseFloat(paymentData.amount))} via ${bankAccount?.name}`,
      });
      
      setIsPaymentOpen(false);
      setSelectedAccount(null);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao processar.',
        variant: 'destructive',
      });
    }
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
        
        {/* Table */}
        <div className="glass-card overflow-hidden">
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
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="font-display">
                {selectedAccount?.type === 'payable' ? 'Registrar Pagamento' : 'Registrar Recebimento'}
              </DialogTitle>
            </DialogHeader>
            {selectedAccount && (
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  {selectedAccount.code && (
                    <p className="text-xs font-mono text-muted-foreground mb-1">{selectedAccount.code}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Conta:</p>
                  <p className="font-medium">{selectedAccount.description}</p>
                  <p className={cn(
                    'text-lg font-semibold mt-1',
                    selectedAccount.type === 'payable' ? 'text-destructive' : 'text-success'
                  )}>
                    {formatCurrency(selectedAccount.amount)}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor Pago</Label>
                    <CurrencyInput
                      id="amount"
                      value={paymentData.amount}
                      onValueChange={(value) => setPaymentData({ ...paymentData, amount: value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paidAt">Data</Label>
                    <Input
                      id="paidAt"
                      type="date"
                      value={paymentData.paidAt}
                      onChange={(e) => setPaymentData({ ...paymentData, paidAt: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bankAccountId">Conta para Baixa</Label>
                  <Select
                    value={paymentData.bankAccountId}
                    onValueChange={(value) => setPaymentData({ ...paymentData, bankAccountId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeBankAccounts.map((ba) => (
                        <SelectItem key={ba.id} value={ba.id}>
                          <span className="flex items-center gap-2">
                            <Wallet className="w-4 h-4" />
                            {ba.name} ({formatCurrency(ba.currentBalance)})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {activeBankAccounts.length === 0 && (
                    <p className="text-xs text-destructive">
                      Nenhuma conta bancária ativa. Cadastre uma conta primeiro.
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                  <Select
                    value={paymentData.paymentMethod}
                    onValueChange={(value) => setPaymentData({ ...paymentData, paymentMethod: value as Payment['paymentMethod'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(paymentMethodLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Input
                    id="notes"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    placeholder="Notas adicionais..."
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={processPaymentMutation.isPending}>
                    {processPaymentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Confirmar {selectedAccount.type === 'payable' ? 'Pagamento' : 'Recebimento'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </MainLayout>
  );
};

export default Payments;
