import { useState } from 'react';
import { useAddSupplier } from '@/hooks/useSupabaseData';
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
import { UserPlus, Loader2 } from 'lucide-react';

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
  const addSupplierMutation = useAddSupplier();
  
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newSupplier = await addSupplierMutation.mutateAsync({
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
      
      onSupplierCreated?.(newSupplier.id);
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao cadastrar.',
        variant: 'destructive'
      });
    }
  };
  
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
            <Label htmlFor="quick-document">CPF / CNPJ</Label>
            <Input
              id="quick-document"
              value={formData.document}
              onChange={(e) => setFormData({ ...formData, document: e.target.value })}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-email">E-mail</Label>
              <Input
                id="quick-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-phone">Telefone</Label>
              <Input
                id="quick-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
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
            <Button type="submit" className="gap-2" disabled={addSupplierMutation.isPending}>
              {addSupplierMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Cadastrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
