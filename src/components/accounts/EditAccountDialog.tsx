import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Account, categoryLabels, AccountCategory } from '@/types/financial';
import { useUpdateAccount, useSuppliers } from '@/hooks/useSupabaseData';
import { SupplierSelect } from '@/components/suppliers/SupplierSelect';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface EditAccountDialogProps {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'payable' | 'receivable';
}

export function EditAccountDialog({
  account,
  open,
  onOpenChange,
  type,
}: EditAccountDialogProps) {
  const updateAccountMutation = useUpdateAccount();
  const { data: suppliers = [] } = useSuppliers();
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    dueDate: '',
    supplierId: '',
    category: 'other' as AccountCategory,
    notes: '',
  });

  useEffect(() => {
    if (account) {
      // Format date correctly - dueDate is always a Date object from our hook
      const dueDateStr = format(account.dueDate, 'yyyy-MM-dd');
      
      setFormData({
        description: account.description,
        amount: account.amount.toString(),
        dueDate: dueDateStr,
        supplierId: account.supplierId || '',
        category: (account.category as AccountCategory) || 'other',
        notes: account.notes || '',
      });
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    try {
      const supplier = suppliers.find((s) => s.id === formData.supplierId);
      
      // Create date at noon to avoid timezone issues
      const [year, month, day] = formData.dueDate.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day, 12, 0, 0);
      
      await updateAccountMutation.mutateAsync({
        id: account.id,
        description: formData.description,
        amount: parseFloat(formData.amount),
        dueDate: dueDate,
        supplierId: formData.supplierId || undefined,
        supplierName: supplier?.name || undefined,
        category: formData.category,
        notes: formData.notes || undefined,
      });

      toast({ title: 'Conta atualizada com sucesso!' });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao atualizar.',
        variant: 'destructive',
      });
    }
  };

  const title = type === 'payable' ? 'Editar Conta a Pagar' : 'Editar Conta a Receber';
  const supplierLabel = type === 'payable' ? 'Fornecedor' : 'Cliente';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          <DialogDescription>Altere os dados da conta</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrição</Label>
            <Input
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Conta de luz"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>{supplierLabel}</Label>
            <SupplierSelect
              value={formData.supplierId}
              onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
              type={type === 'payable' ? 'supplier' : 'receiver'}
              placeholder={`Selecione o ${supplierLabel.toLowerCase()}...`}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Valor</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0,00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dueDate">Vencimento</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-category">Categoria</Label>
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
          
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Observações</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionais..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateAccountMutation.isPending}>
              {updateAccountMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
