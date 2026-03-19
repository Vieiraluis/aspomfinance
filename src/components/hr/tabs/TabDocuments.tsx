import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployeeDocuments, useAddDocument, useDeleteDocument, useUploadHRFile } from '@/hooks/useHRData';
import { Plus, Trash2, ExternalLink, FileUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface Props { employeeId: string; }

const docLabels: Record<string, string> = {
  payslip: 'Holerite',
  payment_receipt: 'Comprovante de Pagamento',
};

export function TabDocuments({ employeeId }: Props) {
  const { data: docs = [] } = useEmployeeDocuments(employeeId);
  const addDoc = useAddDocument();
  const deleteDoc = useDeleteDocument();
  const uploadFile = useUploadHRFile();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ doc_type: 'payslip', reference_month: format(new Date(), 'yyyy-MM'), file_url: '', notes: '' });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFile.mutateAsync({ file, folder: 'documents' });
      setForm(prev => ({ ...prev, file_url: url }));
      toast({ title: 'Documento anexado com sucesso!' });
    } catch (error: any) {
      toast({ title: 'Erro ao anexar documento', description: error.message || 'Tente novamente.', variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    if (!form.file_url || !form.reference_month) return;
    await addDoc.mutateAsync({ ...form, employee_id: employeeId });
    setForm({ doc_type: 'payslip', reference_month: format(new Date(), 'yyyy-MM'), file_url: '', notes: '' });
    setShowForm(false);
  };

  return (
    <div className="py-2 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold">Histórico Financeiro</h4>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" />Novo</Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.doc_type} onValueChange={v => setForm(p => ({ ...p, doc_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="payslip">Holerite</SelectItem>
                  <SelectItem value="payment_receipt">Comprovante de Pagamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Mês Referência</Label><Input type="month" value={form.reference_month} onChange={e => setForm(p => ({ ...p, reference_month: e.target.value }))} /></div>
            <div><Label>Observações</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
            <div>
              <Label>Arquivo *</Label>
              <label className="flex items-center gap-1 text-sm text-primary cursor-pointer hover:underline">
                <FileUp className="w-4 h-4" />Anexar PDF/Imagem
                <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleFile} />
              </label>
              {form.file_url && <span className="text-xs text-green-600">✓ Anexado</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit}>Salvar</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader><TableRow>
          <TableHead>Tipo</TableHead><TableHead>Referência</TableHead><TableHead>Observações</TableHead><TableHead>Arquivo</TableHead><TableHead></TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {docs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum documento</TableCell></TableRow>}
          {docs.map((d: any) => (
            <TableRow key={d.id}>
              <TableCell>{docLabels[d.doc_type] || d.doc_type}</TableCell>
              <TableCell>{d.reference_month}</TableCell>
              <TableCell>{d.notes || '—'}</TableCell>
              <TableCell><a href={d.file_url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 text-primary" /></a></TableCell>
              <TableCell><Button size="icon" variant="ghost" onClick={() => deleteDoc.mutate(d.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
