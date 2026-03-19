import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAddEmployee, useUpdateEmployee, useUploadHRFile } from '@/hooks/useHRData';
import { Camera, Loader2 } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatCurrency } from '@/lib/format';
import { toast } from '@/hooks/use-toast';

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: any;
}

export function EmployeeForm({ open, onOpenChange, employee }: EmployeeFormProps) {
  const addEmployee = useAddEmployee();
  const updateEmployee = useUpdateEmployee();
  const uploadFile = useUploadHRFile();
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', cpf: '', rg: '', birth_date: '', phone: '', email: '',
    address_cep: '', address_street: '', address_number: '', address_complement: '',
    address_neighborhood: '', address_city: '', address_state: '',
    admission_date: '', salary: 0, position: '', department: '',
    bank_name: '', bank_agency: '', bank_account: '', status: 'active',
    photo_url: '',
  });

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || '',
        cpf: employee.cpf || '',
        rg: employee.rg || '',
        birth_date: employee.birth_date || '',
        phone: employee.phone || '',
        email: employee.email || '',
        address_cep: employee.address_cep || '',
        address_street: employee.address_street || '',
        address_number: employee.address_number || '',
        address_complement: employee.address_complement || '',
        address_neighborhood: employee.address_neighborhood || '',
        address_city: employee.address_city || '',
        address_state: employee.address_state || '',
        admission_date: employee.admission_date || '',
        salary: Number(employee.salary) || 0,
        position: employee.position || '',
        department: employee.department || '',
        bank_name: employee.bank_name || '',
        bank_agency: employee.bank_agency || '',
        bank_account: employee.bank_account || '',
        status: employee.status || 'active',
        photo_url: employee.photo_url || '',
      });
      setPhotoPreview(employee.photo_url || null);
    } else {
      setForm({
        name: '', cpf: '', rg: '', birth_date: '', phone: '', email: '',
        address_cep: '', address_street: '', address_number: '', address_complement: '',
        address_neighborhood: '', address_city: '', address_state: '',
        admission_date: '', salary: 0, position: '', department: '',
        bank_name: '', bank_agency: '', bank_account: '', status: 'active',
        photo_url: '',
      });
      setPhotoPreview(null);
    }
  }, [employee, open]);

  const handleCepBlur = async () => {
    const cep = form.address_cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          address_street: data.logradouro || '',
          address_neighborhood: data.bairro || '',
          address_city: data.localidade || '',
          address_state: data.uf || '',
        }));
      }
    } catch {
      // ignore
    } finally {
      setCepLoading(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoPreview(URL.createObjectURL(file));

    try {
      const url = await uploadFile.mutateAsync({ file, folder: 'photos' });
      setForm(prev => ({ ...prev, photo_url: url }));
      toast({ title: 'Foto anexada com sucesso!' });
    } catch (error: any) {
      toast({ title: 'Erro ao anexar foto', description: error.message || 'Tente novamente.', variant: 'destructive' });
      setPhotoPreview(form.photo_url || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      if (employee) {
        await updateEmployee.mutateAsync({ id: employee.id, ...form });
      } else {
        await addEmployee.mutateAsync(form);
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={photoPreview || undefined} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {form.name ? form.name.charAt(0).toUpperCase() : '?'}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90">
                <Camera className="w-4 h-4 text-primary-foreground" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            </div>
            <div className="flex-1">
              <Label>Nome Completo *</Label>
              <Input value={form.name} onChange={e => updateField('name', e.target.value)} required />
            </div>
          </div>

          {/* Personal Data */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Dados Pessoais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>CPF</Label><Input value={form.cpf} onChange={e => updateField('cpf', e.target.value)} placeholder="000.000.000-00" /></div>
              <div><Label>RG</Label><Input value={form.rg} onChange={e => updateField('rg', e.target.value)} /></div>
              <div><Label>Data Nascimento</Label><Input type="date" value={form.birth_date} onChange={e => updateField('birth_date', e.target.value)} /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={e => updateField('phone', e.target.value)} /></div>
              <div className="sm:col-span-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} /></div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Endereço</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>CEP</Label>
                <div className="relative">
                  <Input value={form.address_cep} onChange={e => updateField('address_cep', e.target.value)} onBlur={handleCepBlur} placeholder="00000-000" />
                  {cepLoading && <Loader2 className="absolute right-2 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
              </div>
              <div className="sm:col-span-2"><Label>Rua</Label><Input value={form.address_street} onChange={e => updateField('address_street', e.target.value)} /></div>
              <div><Label>Número</Label><Input value={form.address_number} onChange={e => updateField('address_number', e.target.value)} /></div>
              <div><Label>Complemento</Label><Input value={form.address_complement} onChange={e => updateField('address_complement', e.target.value)} /></div>
              <div><Label>Bairro</Label><Input value={form.address_neighborhood} onChange={e => updateField('address_neighborhood', e.target.value)} /></div>
              <div><Label>Cidade</Label><Input value={form.address_city} onChange={e => updateField('address_city', e.target.value)} /></div>
              <div><Label>Estado</Label><Input value={form.address_state} onChange={e => updateField('address_state', e.target.value)} maxLength={2} /></div>
            </div>
          </div>

          {/* Contract Data */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Dados Contratuais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Data Admissão</Label><Input type="date" value={form.admission_date} onChange={e => updateField('admission_date', e.target.value)} /></div>
              <div><Label>Salário</Label><CurrencyInput value={String(form.salary)} onValueChange={val => updateField('salary', Number(val) || 0)} /></div>
              <div><Label>Cargo</Label><Input value={form.position} onChange={e => updateField('position', e.target.value)} /></div>
              <div><Label>Departamento</Label><Input value={form.department} onChange={e => updateField('department', e.target.value)} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={val => updateField('status', val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="away">Afastado</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Bank Data */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Dados Bancários</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><Label>Banco</Label><Input value={form.bank_name} onChange={e => updateField('bank_name', e.target.value)} /></div>
              <div><Label>Agência</Label><Input value={form.bank_agency} onChange={e => updateField('bank_agency', e.target.value)} /></div>
              <div><Label>Conta</Label><Input value={form.bank_account} onChange={e => updateField('bank_account', e.target.value)} /></div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {employee ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
