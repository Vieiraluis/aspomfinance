import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useFinancialStore } from '@/store/financialStore';
import { Account, categoryLabels, AccountCategory } from '@/types/financial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Search, TrendingDown, Trash2, Split, Receipt } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { SupplierSelect } from '@/components/suppliers/SupplierSelect';
import { ReceiptDialog } from '@/components/receipts/ReceiptDialog';

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
  const { accounts, suppliers, addAccount, deleteAccount, generateInstallments } = useFinancialStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isInstallmentOpen, setIsInstallmentOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [receiptMode, setReceiptMode] = useState<'single' | 'batch'>('single');
  
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
    return matchesSearch && matchesStatus;
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const supplier = suppliers.find((s) => s.id === formData.supplierId);
    
    addAccount({
      type: 'payable',
      description: formData.description,
      amount: parseFloat(formData.amount),
      dueDate: new Date(formData.dueDate),
      status: 'pending',
      supplierId: formData.supplierId || undefined,
      supplierName: supplier?.name,
      category: formData.category,
      notes: formData.notes || undefined,
    });
    
    toast({ title: 'Conta a pagar registrada com sucesso!' });
    setIsOpen(false);
    resetForm();
  };
  
  const handleInstallmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const supplier = suppliers.find((s) => s.id === installmentData.supplierId);
    
    generateInstallments(
      {
        type: 'payable',
        description: installmentData.description,
        amount: parseFloat(installmentData.amount),
        dueDate: new Date(installmentData.dueDate),
        status: 'pending',
        supplierId: installmentData.supplierId || undefined,
        supplierName: supplier?.name,
        category: installmentData.category as AccountCategory,
        notes: installmentData.notes || undefined,
      },
      parseInt(installmentData.numberOfInstallments)
    );
    
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
  };
  
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
                      <Input
                        id="inst-amount"
                        type="number"
                        step="0.01"
                        value={installmentData.amount}
                        onChange={(e) => setInstallmentData({ ...installmentData, amount: e.target.value })}
                        placeholder="0,00"
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
                    <Button type="submit">Gerar Parcelas</Button>
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
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0,00"
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
                    <Button type="submit">Registrar</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição ou fornecedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="overdue">Vencidos</SelectItem>
            </SelectContent>
          </Select>
          
          {paidPayables.length > 0 && (
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={openBatchReceipts}
            >
              <Receipt className="w-4 h-4" />
              Recibos em Lote ({selectedAccounts.length})
            </Button>
          )}
        </div>
        
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
                          onClick={() => {
                            deleteAccount(account.id);
                            toast({ title: 'Conta excluída!' });
                          }}
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
