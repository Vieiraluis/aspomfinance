import { useState } from 'react';
import { useFinancialStore } from '@/store/financialStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';

interface QuickSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSupplierCreated?: (supplierId: string) => void;
  type: 'supplier' | 'receiver';
  initialName?: string;
}

export const QuickSupplierDialog = ({
  open,
  onOpenChange,
  onSupplierCreated,
  type,
  initialName = '',
}: QuickSupplierDialogProps) => {
  const { addSupplier } = useFinancialStore();
  
  const [formData, setFormData] = useState({
    name: initialName,
    document: '',
    email: '',
    phone: '',
    address: '',
  });
  
  const resetForm = () => {
    setFormData({
      name: '',
      document: '',
      email: '',
      phone: '',
      address: '',
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newId = Math.random().toString(36).substring(2, 15);
    
    addSupplier({
      name: formData.name,
      document: formData.document,
      email: formData.email,
      phone: formData.phone,
      address: formData.address || undefined,
    });
    
    toast({ 
      title: type === 'supplier' ? 'Fornecedor cadastrado!' : 'Recebedor cadastrado!',
      description: `${formData.name} foi adicionado com sucesso.`
    });
    
    onSupplierCreated?.(newId);
    onOpenChange(false);
    resetForm();
  };
  
  // Update form when initial name changes
  useState(() => {
    if (initialName) {
      setFormData(prev => ({ ...prev, name: initialName }));
    }
  });
  
  const title = type === 'supplier' ? 'Cadastrar Fornecedor' : 'Cadastrar Recebedor';
  const subtitle = type === 'supplier' 
    ? 'Adicione um novo fornecedor rapidamente' 
    : 'Adicione um novo recebedor rapidamente';

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-name">Nome / Razão Social *</Label>
            <Input
              id="quick-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo ou razão social"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-document">CPF / CNPJ *</Label>
            <Input
              id="quick-document"
              value={formData.document}
              onChange={(e) => setFormData({ ...formData, document: e.target.value })}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-email">E-mail *</Label>
              <Input
                id="quick-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-phone">Telefone *</Label>
              <Input
                id="quick-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-address">Endereço (opcional)</Label>
            <Input
              id="quick-address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua, número, cidade..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="gap-2">
              <UserPlus className="w-4 h-4" />
              Cadastrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
