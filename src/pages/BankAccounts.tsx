import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useBankAccounts, useAddBankAccount, useUpdateBankAccount, useDeleteBankAccount } from '@/hooks/useSupabaseData';
import { BankAccountType, bankAccountTypeLabels } from '@/types/financial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Plus, Wallet, Trash2, Edit, Building2, Banknote, Loader2 } from 'lucide-react';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

const BankAccounts = () => {
  const { data: bankAccounts = [], isLoading } = useBankAccounts();
  const addBankAccountMutation = useAddBankAccount();
  const updateBankAccountMutation = useUpdateBankAccount();
  const deleteBankAccountMutation = useDeleteBankAccount();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking' as BankAccountType,
    bankName: '',
    agency: '',
    accountNumber: '',
    initialBalance: '',
    isActive: true,
  });
  
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'checking',
      bankName: '',
      agency: '',
      accountNumber: '',
      initialBalance: '',
      isActive: true,
    });
    setEditingAccount(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAccount) {
        await updateBankAccountMutation.mutateAsync({
          id: editingAccount,
          name: formData.name,
          type: formData.type,
          bankName: formData.bankName || undefined,
          agency: formData.agency || undefined,
          accountNumber: formData.accountNumber || undefined,
          isActive: formData.isActive,
        });
        toast({ title: 'Conta atualizada com sucesso!' });
      } else {
        await addBankAccountMutation.mutateAsync({
          name: formData.name,
          type: formData.type,
          bankName: formData.bankName || undefined,
          agency: formData.agency || undefined,
          accountNumber: formData.accountNumber || undefined,
          initialBalance: parseFloat(formData.initialBalance) || 0,
          isActive: formData.isActive,
        });
        toast({ title: 'Conta bancária cadastrada com sucesso!' });
      }
      
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
  
  const handleEdit = (id: string) => {
    const account = bankAccounts.find(a => a.id === id);
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        bankName: account.bankName || '',
        agency: account.agency || '',
        accountNumber: account.accountNumber || '',
        initialBalance: account.initialBalance.toString(),
        isActive: account.isActive,
      });
      setEditingAccount(id);
      setIsOpen(true);
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      await deleteBankAccountMutation.mutateAsync(id);
      toast({ title: 'Conta excluída!' });
    } catch (error: any) {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Ocorreu um erro ao excluir.',
        variant: 'destructive' 
      });
    }
  };
  
  const totalBalance = bankAccounts
    .filter(a => a.isActive)
    .reduce((sum, a) => sum + a.currentBalance, 0);
  
  const getAccountIcon = (type: BankAccountType) => {
    switch (type) {
      case 'cash':
        return <Banknote className="w-5 h-5" />;
      case 'checking':
      case 'savings':
        return <Building2 className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
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
              Contas Bancárias
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas contas bancárias e caixa
            </p>
          </div>
          
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
                <DialogTitle className="font-display">
                  {editingAccount ? 'Editar Conta' : 'Nova Conta Bancária'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Conta</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Conta Principal, Caixa Loja"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as BankAccountType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(bankAccountTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Banco</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="Ex: Bradesco"
                    />
                  </div>
                </div>
                
                {formData.type !== 'cash' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="agency">Agência</Label>
                      <Input
                        id="agency"
                        value={formData.agency}
                        onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                        placeholder="0001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Número da Conta</Label>
                      <Input
                        id="accountNumber"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        placeholder="12345-6"
                      />
                    </div>
                  </div>
                )}
                
                {!editingAccount && (
                  <div className="space-y-2">
                    <Label htmlFor="initialBalance">Saldo Inicial</Label>
                    <Input
                      id="initialBalance"
                      type="number"
                      step="0.01"
                      value={formData.initialBalance}
                      onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                  <div>
                    <Label htmlFor="isActive" className="text-sm font-medium">Conta Ativa</Label>
                    <p className="text-xs text-muted-foreground">Contas inativas não aparecem nas baixas</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={addBankAccountMutation.isPending || updateBankAccountMutation.isPending}
                  >
                    {(addBankAccountMutation.isPending || updateBankAccountMutation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingAccount ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/20">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Contas</p>
              <p className="text-xl font-semibold text-foreground">
                {bankAccounts.length}
              </p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/20">
              <Banknote className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Total</p>
              <p className={cn(
                "text-xl font-semibold",
                totalBalance >= 0 ? "text-success" : "text-destructive"
              )}>
                {formatCurrency(totalBalance)}
              </p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/20">
              <Building2 className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contas Ativas</p>
              <p className="text-xl font-semibold text-foreground">
                {bankAccounts.filter(a => a.isActive).length}
              </p>
            </div>
          </div>
        </div>
        
        {/* Table */}
        <div className="glass-card overflow-hidden">
          {bankAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Wallet className="w-12 h-12 mb-3 opacity-50" />
              <p>Nenhuma conta bancária cadastrada</p>
              <p className="text-sm">Cadastre sua primeira conta para começar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Banco/Agência</TableHead>
                  <TableHead>Saldo Atual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          account.isActive ? "bg-primary/10" : "bg-muted"
                        )}>
                          {getAccountIcon(account.type)}
                        </div>
                        {account.name}
                      </div>
                    </TableCell>
                    <TableCell>{bankAccountTypeLabels[account.type]}</TableCell>
                    <TableCell>
                      {account.bankName && (
                        <div>
                          <p className="font-medium">{account.bankName}</p>
                          {account.agency && account.accountNumber && (
                            <p className="text-xs text-muted-foreground">
                              Ag: {account.agency} | Cc: {account.accountNumber}
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "font-semibold",
                        account.currentBalance >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {formatCurrency(account.currentBalance)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          account.isActive
                            ? 'bg-success/20 text-success border-success/30'
                            : 'bg-muted text-muted-foreground border-muted'
                        )}
                      >
                        {account.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(account.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(account.id)}
                          disabled={deleteBankAccountMutation.isPending}
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

        <FloatingActionButton
          onAdd={() => { setEditingAccount(null); setIsOpen(true); }}
          onEdit={() => {
            toast({ title: 'Selecione um registro', description: 'Clique no ícone de edição na tabela para alterar um registro.' });
          }}
          onDelete={() => {
            toast({ title: 'Selecione um registro', description: 'Clique no ícone de exclusão na tabela para remover um registro.' });
          }}
          onPrint={() => window.print()}
        />
      </div>
    </MainLayout>
  );
};

export default BankAccounts;
