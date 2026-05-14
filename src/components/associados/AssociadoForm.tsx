import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Associado, AssociadoStatus, postoGraduacaoOptions } from '@/types/associados';
import { useAddAssociado, useUpdateAssociado, uploadAssociadoPhoto } from '@/hooks/useAssociados';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Associado | null;
}

const empty = {
  nome: '',
  cpf: '',
  rg_pmerj: '',
  identidade: '',
  posto_graduacao: '',
  matricula_associacao: '',
  email: '',
  telefone: '',
  endereco_cep: '',
  endereco_rua: '',
  endereco_numero: '',
  endereco_complemento: '',
  endereco_bairro: '',
  endereco_cidade: '',
  endereco_estado: '',
  banco: '',
  agencia: '',
  conta: '',
  pix_chave: '',
  valor_mensalidade: 0,
  dia_vencimento: 10,
  data_adesao: '',
  status: 'ativo' as AssociadoStatus,
  observacoes: '',
  photo_url: '' as string | null,
};

export function AssociadoForm({ open, onOpenChange, editing }: Props) {
  const { user } = useAuthContext();
  const add = useAddAssociado();
  const update = useUpdateAssociado();
  const [form, setForm] = useState({ ...empty });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        ...empty,
        ...Object.fromEntries(Object.entries(editing).map(([k, v]) => [k, v ?? (typeof (empty as any)[k] === 'number' ? 0 : '')])),
      } as any);
    } else {
      setForm({ ...empty });
    }
  }, [editing, open]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handlePhoto = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const url = await uploadAssociadoPhoto(file, user.id);
      set('photo_url', url);
    } catch (e: any) {
      toast({ title: 'Erro no upload', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' });
      return;
    }
    const payload: any = {
      ...form,
      valor_mensalidade: Number(form.valor_mensalidade) || 0,
      dia_vencimento: Math.min(Math.max(Number(form.dia_vencimento) || 10, 1), 28),
      data_adesao: form.data_adesao || null,
    };
    Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null; });
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...payload });
        toast({ title: 'Associado atualizado' });
      } else {
        await add.mutateAsync(payload);
        toast({ title: 'Associado cadastrado' });
      }
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const saving = add.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{editing ? 'Editar Associado' : 'Novo Associado'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Foto */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-border">
              {form.photo_url ? (
                <img src={form.photo_url as string} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">Sem foto</span>
              )}
            </div>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer text-primary hover:underline">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Enviando...' : 'Carregar foto'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Nome completo *</Label>
              <Input value={form.nome} onChange={(e) => set('nome', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Posto/Graduação</Label>
              <Select value={form.posto_graduacao || ''} onValueChange={(v) => set('posto_graduacao', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {postoGraduacaoOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Matrícula na Associação</Label>
              <Input value={form.matricula_associacao || ''} onChange={(e) => set('matricula_associacao', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>CPF</Label>
              <Input value={form.cpf || ''} onChange={(e) => set('cpf', e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-1.5">
              <Label>RG PMERJ</Label>
              <Input value={form.rg_pmerj || ''} onChange={(e) => set('rg_pmerj', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Identidade Civil</Label>
              <Input value={form.identidade || ''} onChange={(e) => set('identidade', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.telefone || ''} onChange={(e) => set('telefone', e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Adesão</Label>
              <Input type="date" value={form.data_adesao || ''} onChange={(e) => set('data_adesao', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor da Mensalidade (R$)</Label>
              <Input type="number" step="0.01" min={0} value={form.valor_mensalidade} onChange={(e) => set('valor_mensalidade', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Dia de Vencimento (1-28)</Label>
              <Input type="number" min={1} max={28} value={form.dia_vencimento} onChange={(e) => set('dia_vencimento', e.target.value)} />
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <div className="md:col-span-2 space-y-1.5"><Label>CEP</Label><Input value={form.endereco_cep || ''} onChange={(e) => set('endereco_cep', e.target.value)} /></div>
              <div className="md:col-span-3 space-y-1.5"><Label>Rua</Label><Input value={form.endereco_rua || ''} onChange={(e) => set('endereco_rua', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Nº</Label><Input value={form.endereco_numero || ''} onChange={(e) => set('endereco_numero', e.target.value)} /></div>
              <div className="md:col-span-2 space-y-1.5"><Label>Complemento</Label><Input value={form.endereco_complemento || ''} onChange={(e) => set('endereco_complemento', e.target.value)} /></div>
              <div className="md:col-span-2 space-y-1.5"><Label>Bairro</Label><Input value={form.endereco_bairro || ''} onChange={(e) => set('endereco_bairro', e.target.value)} /></div>
              <div className="md:col-span-1 space-y-1.5"><Label>UF</Label><Input maxLength={2} value={form.endereco_estado || ''} onChange={(e) => set('endereco_estado', e.target.value.toUpperCase())} /></div>
              <div className="md:col-span-3 space-y-1.5"><Label>Cidade</Label><Input value={form.endereco_cidade || ''} onChange={(e) => set('endereco_cidade', e.target.value)} /></div>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Dados Bancários / PIX</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2 space-y-1.5"><Label>Banco</Label><Input value={form.banco || ''} onChange={(e) => set('banco', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Agência</Label><Input value={form.agencia || ''} onChange={(e) => set('agencia', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Conta</Label><Input value={form.conta || ''} onChange={(e) => set('conta', e.target.value)} /></div>
              <div className="md:col-span-4 space-y-1.5"><Label>Chave PIX (do associado)</Label><Input value={form.pix_chave || ''} onChange={(e) => set('pix_chave', e.target.value)} /></div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea rows={2} value={form.observacoes || ''} onChange={(e) => set('observacoes', e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
