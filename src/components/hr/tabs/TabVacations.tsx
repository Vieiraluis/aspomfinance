import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useEmployeeVacations, useAddVacation, useUpdateVacation, useDeleteVacation, useUploadHRFile } from '@/hooks/useHRData';
import { Plus, Trash2, FileUp, ExternalLink, AlertTriangle } from 'lucide-react';
import { format, differenceInDays, addYears } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface Props { employeeId: string; }

export function TabVacations({ employeeId }: Props) {
  const { data: vacations = [] } = useEmployeeVacations(employeeId);
  const addVacation = useAddVacation();
  const updateVacation = useUpdateVacation();
  const deleteVacation = useDeleteVacation();
  const uploadFile = useUploadHRFile();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ period_start: '', period_end: '', vacation_start: '', vacation_end: '', days: 30, status: 'pending', notes: '' });

  const handleSubmit = async () => {
    if (!form.period_start || !form.period_end) return;
    await addVacation.mutateAsync({ ...form, employee_id: employeeId });
    setForm({ period_start: '', period_end: '', vacation_start: '', vacation_end: '', days: 30, status: 'pending', notes: '' });
    setShowForm(false);
  };

  const handleReceipt = async (vacationId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFile.mutateAsync({ file, folder: 'vacations' });
      await updateVacation.mutateAsync({ id: vacationId, receipt_url: url });
      toast({ title: 'Recibo de férias anexado com sucesso!' });
    } catch (error: any) {
      toast({ title: 'Erro ao anexar recibo', description: error.message || 'Tente novamente.', variant: 'destructive' });
    }
  };

  const formatDate = (d: string | null) => d ? format(new Date(d + 'T12:00:00'), 'dd/MM/yyyy') : '—';

  // Vacation expiry warnings
  const warnings = useMemo(() => {
    return vacations.filter((v: any) => {
      if (v.status === 'taken') return false;
      const limitDate = addYears(new Date(v.period_end + 'T12:00:00'), 1);
      const daysLeft = differenceInDays(limitDate, new Date());
      return daysLeft <= 90;
    });
  }, [vacations]);

  return (
    <div className="py-2 space-y-4">
      {warnings.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Férias próximas do vencimento!</p>
            <p className="text-xs text-muted-foreground">{warnings.length} período(s) com menos de 90 dias para vencer.</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold">Controle de Férias</h4>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" />Novo Período</Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Período Aquisitivo Início *</Label><Input type="date" value={form.period_start} onChange={e => setForm(p => ({ ...p, period_start: e.target.value }))} /></div>
            <div><Label>Período Aquisitivo Fim *</Label><Input type="date" value={form.period_end} onChange={e => setForm(p => ({ ...p, period_end: e.target.value }))} /></div>
            <div><Label>Início Férias</Label><Input type="date" value={form.vacation_start} onChange={e => setForm(p => ({ ...p, vacation_start: e.target.value }))} /></div>
            <div><Label>Fim Férias</Label><Input type="date" value={form.vacation_end} onChange={e => setForm(p => ({ ...p, vacation_end: e.target.value }))} /></div>
            <div><Label>Dias</Label><Input type="number" value={form.days} onChange={e => setForm(p => ({ ...p, days: Number(e.target.value) }))} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit}>Salvar</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader><TableRow>
          <TableHead>Período Aquisitivo</TableHead><TableHead>Férias</TableHead><TableHead>Dias</TableHead><TableHead>Status</TableHead><TableHead>Recibo</TableHead><TableHead></TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {vacations.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum período</TableCell></TableRow>}
          {vacations.map((v: any) => {
            const limitDate = addYears(new Date(v.period_end + 'T12:00:00'), 1);
            const daysLeft = differenceInDays(limitDate, new Date());
            const isExpiring = v.status !== 'taken' && daysLeft <= 90;
            return (
              <TableRow key={v.id} className={isExpiring ? 'bg-destructive/5' : ''}>
                <TableCell>{formatDate(v.period_start)} - {formatDate(v.period_end)}</TableCell>
                <TableCell>{v.vacation_start ? `${formatDate(v.vacation_start)} - ${formatDate(v.vacation_end)}` : '—'}</TableCell>
                <TableCell>{v.days}</TableCell>
                <TableCell>
                  <Badge variant={v.status === 'taken' ? 'default' : isExpiring ? 'destructive' : 'secondary'}>
                    {v.status === 'taken' ? 'Gozadas' : isExpiring ? `Vence em ${daysLeft}d` : 'Pendente'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {v.receipt_url ? (
                    <a href={v.receipt_url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 text-primary" /></a>
                  ) : (
                    <label className="cursor-pointer text-primary hover:underline">
                      <FileUp className="w-4 h-4 inline" />
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleReceipt(v.id, e)} />
                    </label>
                  )}
                </TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => deleteVacation.mutate(v.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
