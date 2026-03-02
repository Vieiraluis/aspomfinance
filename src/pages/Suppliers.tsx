import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useSuppliers, useAddSupplier, useUpdateSupplier, useDeleteSupplier } from '@/hooks/useSupabaseData';
import { Supplier, SupplierType, supplierTypeLabels } from '@/types/financial';
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
import { formatDocument, formatPhone, formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, Search, Users, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Suppliers = () => {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const addSupplierMutation = useAddSupplier();
  const updateSupplierMutation = useUpdateSupplier();
  const deleteSupplierMutation = useDeleteSupplier();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    type: 'supplier' as SupplierType,
  });
  
  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.document.includes(search) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );
  
  const resetForm = () => {
    setFormData({ name: '', document: '', email: '', phone: '', address: '', type: 'supplier' });
    setEditingSupplier(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSupplier) {
        await updateSupplierMutation.mutateAsync({ id: editingSupplier.id, ...formData });
        toast({ title: 'Fornecedor atualizado com sucesso!' });
      } else {
        await addSupplierMutation.mutateAsync(formData);
        toast({ title: 'Fornecedor cadastrado com sucesso!' });
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
  
  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      document: supplier.document,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address || '',
      type: supplier.type || 'supplier',
    });
    setIsOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    try {
      await deleteSupplierMutation.mutateAsync(id);
      toast({ title: 'Fornecedor excluído!' });
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
              Fornecedores e Clientes
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus fornecedores e clientes
            </p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Cadastro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingSupplier ? 'Editar Cadastro' : 'Novo Cadastro'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as SupplierType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">Fornecedor</SelectItem>
                      <SelectItem value="client">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome / Razão Social</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo ou razão social"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">CPF / CNPJ</Label>
                  <Input
                    id="document"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço (opcional)</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, cidade..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={addSupplierMutation.isPending || updateSupplierMutation.isPending}
                  >
                    {(addSupplierMutation.isPending || updateSupplierMutation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingSupplier ? 'Salvar Alterações' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, documento ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Table */}
        <div className="glass-card overflow-hidden">
          {filteredSuppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mb-3 opacity-50" />
              <p>Nenhum fornecedor cadastrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>
                      <Badge variant={supplier.type === 'client' ? 'default' : 'secondary'}>
                        {supplierTypeLabels[supplier.type] || 'Fornecedor'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDocument(supplier.document)}</TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>{formatPhone(supplier.phone)}</TableCell>
                    <TableCell>{formatDate(supplier.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(supplier)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(supplier.id)}
                          disabled={deleteSupplierMutation.isPending}
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
      </div>
    </MainLayout>
  );
};

export default Suppliers;
