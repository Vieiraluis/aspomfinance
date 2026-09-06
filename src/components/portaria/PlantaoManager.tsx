import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StorageAvatarImage } from '@/components/ui/storage-image';
import { Badge } from '@/components/ui/badge';
import { useEmployees } from '@/hooks/useHRData';
import { usePlantoes, useSavePlantao, useDeletePlantao, usePlantaoAtual } from '@/hooks/usePortariaData';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';

const todayISO = () => format(new Date(), 'yyyy-MM-dd');

export function PlantaoManager() {
  const { data: employees = [] } = useEmployees();
  const { data: plantoes = [] } = usePlantoes();
  const { plantao: atual } = usePlantaoAtual();
  const savePlantao = useSavePlantao();
  const deletePlantao = useDeletePlantao();

  const [employeeId, setEmployeeId] = useState('');
  const [data, setData] = useState(todayISO());
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('18:00');

  const handleAdd = async () => {
    if (!employeeId) {
      toast({ title: 'Selecione o recepcionista', variant: 'destructive' });
      return;
    }
    await savePlantao.mutateAsync({
      employee_id: employeeId,
      data,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
    });
    setEmployeeId('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="w-4 h-4" /> Escala de plantão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_auto] md:items-end">
          <div className="space-y-1.5">
            <Label>Recepcionista</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o funcionário" />
              </SelectTrigger>
              <SelectContent>
                {employees.length === 0 && (
                  <SelectItem value="__none" disabled>
                    Cadastre funcionários em Gestão de RH
                  </SelectItem>
                )}
                {employees.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Data</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Início</Label>
            <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Fim</Label>
            <Input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
          </div>
          <Button onClick={handleAdd} disabled={savePlantao.isPending}>
            <Plus className="w-4 h-4 mr-2" /> Incluir
          </Button>
        </div>

        <div className="divide-y divide-border rounded-lg border border-border">
          {plantoes.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Nenhum plantão cadastrado.</p>
          )}
          {plantoes.map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 p-3">
              <Avatar className="w-9 h-9">
                <StorageAvatarImage url={p.employees?.photo_url} alt={p.employees?.name} />
                <AvatarFallback>{(p.employees?.name || '?').charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.employees?.name || '—'}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(`${p.data}T12:00:00`), 'dd/MM/yyyy')} •{' '}
                  {String(p.hora_inicio).slice(0, 5)} às {String(p.hora_fim).slice(0, 5)}
                </p>
              </div>
              {atual?.id === p.id && <Badge>Em plantão</Badge>}
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => deletePlantao.mutate(p.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
