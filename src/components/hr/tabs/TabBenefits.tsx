import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployeeBenefits, useAddBenefit, useDeleteBenefit } from '@/hooks/useHRData';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Props { employeeId: string; }

const benefitLabels: Record<string, string> = {
  transport: 'Vale Transporte',
  meal: 'Vale Refeição',
};

export function TabBenefits({ employeeId }: Props) {
  const { data: benefits = [] } = useEmployeeBenefits(employeeId);
  const addBenefit = useAddBenefit();
  const deleteBenefit = useDeleteBenefit();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ benefit_type: 'transport', working_days: 22, daily_cost: 0, month_reference: format(new Date(), 'yyyy-MM') });

  const totalValue = useMemo(() => form.working_days * form.daily_cost, [form.working_days, form.daily_cost]);

  const handleSubmit = async () => {
    if (!form.month_reference) return;
    await addBenefit.mutateAsync({
      ...form,
      total_value: totalValue,
      employee_id: employeeId,
    });
    setForm({ benefit_type: 'transport', working_days: 22, daily_cost: 0, month_reference: format(new Date(), 'yyyy-MM') });
    setShowForm(false);
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const totalTransport = benefits.filter((b: any) => b.benefit_type === 'transport').reduce((s: number, b: any) => s + Number(b.total_value), 0);
  const totalMeal = benefits.filter((b: any) => b.benefit_type === 'meal').reduce((s: number, b: any) => s + Number(b.total_value), 0);

  return (
    <div className="py-2 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold">Benefícios</h4>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" />Novo</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/40 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Total VT</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(totalTransport)}</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Total VR</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(totalMeal)}</p>
        </div>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.benefit_type} onValueChange={v => setForm(p => ({ ...p, benefit_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="transport">Vale Transporte</SelectItem>
                  <SelectItem value="meal">Vale Refeição</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Mês Referência</Label><Input type="month" value={form.month_reference} onChange={e => setForm(p => ({ ...p, month_reference: e.target.value }))} /></div>
            <div><Label>Dias Úteis</Label><Input type="number" value={form.working_days} onChange={e => setForm(p => ({ ...p, working_days: Number(e.target.value) }))} /></div>
            <div><Label>Custo Diário (R$)</Label><Input type="number" step="0.01" value={form.daily_cost} onChange={e => setForm(p => ({ ...p, daily_cost: Number(e.target.value) }))} /></div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Total: {formatCurrency(totalValue)}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit}>Salvar</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      <Table>
        <TableHeader><TableRow>
          <TableHead>Tipo</TableHead><TableHead>Mês</TableHead><TableHead>Dias</TableHead><TableHead>Custo/Dia</TableHead><TableHead>Total</TableHead><TableHead></TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {benefits.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum benefício</TableCell></TableRow>}
          {benefits.map((b: any) => (
            <TableRow key={b.id}>
              <TableCell>{benefitLabels[b.benefit_type] || b.benefit_type}</TableCell>
              <TableCell>{b.month_reference}</TableCell>
              <TableCell>{b.working_days}</TableCell>
              <TableCell>{formatCurrency(Number(b.daily_cost))}</TableCell>
              <TableCell className="font-semibold">{formatCurrency(Number(b.total_value))}</TableCell>
              <TableCell><Button size="icon" variant="ghost" onClick={() => deleteBenefit.mutate(b.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
