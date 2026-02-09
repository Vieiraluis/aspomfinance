import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAccounts, useSuppliers, useAddAccount, useDeleteAccount, useGenerateInstallments } from '@/hooks/useSupabaseData';
import { Account, categoryLabels, AccountCategory } from '@/types/financial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import { Plus, TrendingDown, Trash2, Split, Receipt, Loader2, Pencil } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { SupplierSelect } from '@/components/suppliers/SupplierSelect';
import { ReceiptDialog } from '@/components/receipts/ReceiptDialog';
import { AccountFilters } from '@/components/accounts/AccountFilters';
import { EditAccountDialog } from '@/components/accounts/EditAccountDialog';

const statusLabels = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
};

const statusStyles = {
  pending: 'bg-warning/20 text-warning border-warning/30',
  paid: 'bg-success/20 text-success border-success/30',
  overdue: 'bg-destructive/20 text-destructive border-destructive/30',
  cancelled: 'bg-muted text-muted-foreground border-muted',
};

const Payables = () => {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: suppliers = [] } = useSuppliers();
  const addAccountMutation = useAddAccount();
  const deleteAccountMutation = useDeleteAccount();
  const generateInstallmentsMutation = useGenerateInstallments();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isInstallmentOpen, setIsInstallmentOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [receiptMode, setReceiptMode] = useState<'single' | 'batch'>('single');
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    supplierId: '',
    category: 'other' as AccountCategory,
    notes: '',
  });
  
  const [installmentData, setInstallmentData] = useState({
    ...formData,
    numberOfInstallments: '2',
  });
  
  const payables = accounts.filter((a) => a.type === 'payable');
  
  const filteredPayables = payables.filter((a) => {
    const matchesSearch = 
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      (a.supplierName && a.supplierName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
    
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
    
    return matchesSearch && matchesStatus && matchesCategory && matchesDateRange;
  });

  const paidPayables = filteredPayables.filter(a => a.status === 'paid');
  
  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAccounts.length === paidPayables.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(paidPayables.map(a => a.id));
    }
  };

  const openBatchReceipts = () => {
    if (selectedAccounts.length === 0) {
      toast({ 
        title: 'Selecione contas', 
        description: 'Selecione pelo menos uma conta paga para gerar recibos.',
        variant: 'destructive'
      });
      return;
    }
    setReceiptMode('batch');
    setIsReceiptDialogOpen(true);
  };

  const openSingleReceipt = (account: Account) => {
    setSelectedAccounts([account.id]);
    setReceiptMode('single');
    setIsReceiptDialogOpen(true);
  };

  const openEditDialog = (account: Account) => {
    setEditingAccount(account);
    setIsEditOpen(true);
  };
  
  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      supplierId: '',
      category: 'other',
      notes: '',
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const supplier = suppliers.find((s) => s.id === formData.supplierId);
      
      // Create date at noon to avoid timezone issues
      const [year, month, day] = formData.dueDate.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day, 12, 0, 0);
      
      await addAccountMutation.mutateAsync({
        type: 'payable',
        description: formData.description,
        amount: parseFloat(formData.amount),
        dueDate: dueDate,
        status: 'pending',
        supplierId: formData.supplierId || undefined,
        supplierName: supplier?.name,
        category: formData.category,
        notes: formData.notes || undefined,
      });
      
      toast({ title: 'Conta a pagar registrada com sucesso!' });
      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Ocorreu um erro ao salvar.',
        variant: 'destructive' 
      });
    }
  };
  
  const handleInstallmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const supplier = suppliers.find((s) => s.id === installmentData.supplierId);
      
      // Create date at noon to avoid timezone issues
      const [year, month, day] = installmentData.dueDate.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day, 12, 0, 0);
      
      await generateInstallmentsMutation.mutateAsync({
        baseAccount: {
          type: 'payable',
          description: installmentData.description,
          amount: parseFloat(installmentData.amount),
          dueDate: dueDate,
          status: 'pending',
          supplierId: installmentData.supplierId || undefined,
          supplierName: supplier?.name,
          category: installmentData.category as AccountCategory,
          notes: installmentData.notes || undefined,
        },
        numberOfInstallments: parseInt(installmentData.numberOfInstallments),
      });
      
      toast({ 
        title: 'Parcelas geradas com sucesso!',
        description: `${installmentData.numberOfInstallments} parcelas criadas.`
      });
      setIsInstallmentOpen(false);
      setInstallmentData({
        description: '',
        amount: '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        supplierId: '',
        category: 'other',
        notes: '',
        numberOfInstallments: '2',
      });
    } catch (error: any) {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Ocorreu um erro ao gerar parcelas.',
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAccountMutation.mutateAsync(id);
      toast({ title: 'Conta excluída!' });
    } catch (error: any) {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Ocorreu um erro ao excluir.',
        variant: 'destructive' 
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
              Contas a Pagar
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas despesas e pagamentos
            </p>
          </div>
          
          <div className="flex gap-3">
            <Dialog open={isInstallmentOpen} onOpenChange={setIsInstallmentOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Split className="w-4 h-4" />
                  Parcelar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="font-display">Gerar Parcelas</DialogTitle>
                  <DialogDescription>Divida uma conta em parcelas mensais</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInstallmentSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inst-description">Descrição</Label>
                    <Input
                      id="inst-description"
                      value={installmentData.description}
                      onChange={(e) => setInstallmentData({ ...installmentData, description: e.target.value })}
                      placeholder="Ex: Compra de equipamentos"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fornecedor</Label>
                    <SupplierSelect
                      value={installmentData.supplierId}
                      onValueChange={(value) => setInstallmentData({ ...installmentData, supplierId: value })}
                      type="supplier"
                      placeholder="Selecione o fornecedor..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inst-amount">Valor Total</Label>
                      <CurrencyInput
                        id="inst-amount"
                        value={installmentData.amount}
                        onValueChange={(value) => setInstallmentData({ ...installmentData, amount: value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inst-installments">Nº de Parcelas</Label>
                      <Input
                        id="inst-installments"
                        type="number"
                        min="2"
                        max="48"
                        value={installmentData.numberOfInstallments}
                        onChange={(e) => setInstallmentData({ ...installmentData, numberOfInstallments: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inst-dueDate">Primeiro Vencimento</Label>
                      <Input
                        id="inst-dueDate"
                        type="date"
                        value={installmentData.dueDate}
                        onChange={(e) => setInstallmentData({ ...installmentData, dueDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inst-category">Categoria</Label>
                      <Select
                        value={installmentData.category}
                        onValueChange={(value) => setInstallmentData({ ...installmentData, category: value as AccountCategory })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(categoryLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {installmentData.amount && installmentData.numberOfInstallments && (
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <p className="text-sm text-muted-foreground">Valor de cada parcela:</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(parseFloat(installmentData.amount) / parseInt(installmentData.numberOfInstallments))}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsInstallmentOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={generateInstallmentsMutation.isPending}>
                      {generateInstallmentsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Gerar Parcelas
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isOpen} onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Conta
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="font-display">Nova Conta a Pagar</DialogTitle>
                  <DialogDescription>Registre uma nova despesa ou conta a pagar</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: Conta de luz"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fornecedor</Label>
                    <SupplierSelect
                      value={formData.supplierId}
                      onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
                      type="supplier"
                      placeholder="Selecione o fornecedor..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Valor</Label>
                      <CurrencyInput
                        id="amount"
                        value={formData.amount}
                        onValueChange={(value) => setFormData({ ...formData, amount: value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Vencimento</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as AccountCategory })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={addAccountMutation.isPending}>
                      {addAccountMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Registrar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Filters - Sticky Menu */}
        <AccountFilters
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
          showCategoryFilter={true}
          showDateFilter={true}
          searchPlaceholder="Buscar por descrição ou fornecedor..."
          rightContent={
            paidPayables.length > 0 && (
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={openBatchReceipts}
              >
                <Receipt className="w-4 h-4" />
                Recibos em Lote ({selectedAccounts.length})
              </Button>
            )
          }
        />
        
        {/* Table */}
        <div className="glass-card overflow-hidden">
          {filteredPayables.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <TrendingDown className="w-12 h-12 mb-3 opacity-50" />
              <p>Nenhuma conta a pagar encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {paidPayables.length > 0 && (
                    <TableHead className="w-10">
                      <Checkbox 
                        checked={selectedAccounts.length === paidPayables.length && paidPayables.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayables.map((account) => (
                  <TableRow key={account.id}>
                    {paidPayables.length > 0 && (
                      <TableCell>
                        {account.status === 'paid' && (
                          <Checkbox 
                            checked={selectedAccounts.includes(account.id)}
                            onCheckedChange={() => toggleAccountSelection(account.id)}
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {account.description}
                      {account.installmentNumber && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({account.installmentNumber}/{account.totalInstallments})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{account.supplierName || '-'}</TableCell>
                    <TableCell>{categoryLabels[account.category as AccountCategory]}</TableCell>
                    <TableCell>{formatDate(account.dueDate)}</TableCell>
                    <TableCell className="font-semibold text-destructive">
                      {formatCurrency(account.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(statusStyles[account.status])}>
                        {statusLabels[account.status]}
                      </Badge>
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
                        {account.status === 'paid' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openSingleReceipt(account)}
                            title="Gerar Recibo"
                          >
                            <Receipt className="w-4 h-4 text-primary" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(account.id)}
                          disabled={deleteAccountMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
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
          type="payable"
        />
        
        {/* Receipt Dialog */}
        <ReceiptDialog
          open={isReceiptDialogOpen}
          onOpenChange={(open) => {
            setIsReceiptDialogOpen(open);
            if (!open) setSelectedAccounts([]);
          }}
          accounts={accounts.filter(a => selectedAccounts.includes(a.id))}
          mode={receiptMode}
        />
      </div>
    </MainLayout>
  );
};

export default Payables;
