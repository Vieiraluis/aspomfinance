import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployeeAbsences, useAddAbsence, useDeleteAbsence, useEmployeeExams, useAddExam, useDeleteExam, useUploadHRFile } from '@/hooks/useHRData';
import { Plus, Trash2, FileUp, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

interface Props { employeeId: string; }

export function TabHealthAbsences({ employeeId }: Props) {
  const { data: absences = [] } = useEmployeeAbsences(employeeId);
  const { data: exams = [] } = useEmployeeExams(employeeId);
  const addAbsence = useAddAbsence();
  const deleteAbsence = useDeleteAbsence();
  const addExam = useAddExam();
  const deleteExam = useDeleteExam();
  const uploadFile = useUploadHRFile();

  const [showAbsForm, setShowAbsForm] = useState(false);
  const [showExamForm, setShowExamForm] = useState(false);
  const [absForm, setAbsForm] = useState({ start_date: '', end_date: '', reason: '', cid_code: '', absence_type: 'medical', certificate_url: '' });
  const [examForm, setExamForm] = useState({ exam_type: '', exam_date: '', next_exam_date: '', result: '', file_url: '' });

  const handleAbsFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFile.mutateAsync({ file, folder: 'absences' });
      setAbsForm(prev => ({ ...prev, certificate_url: url }));
      toast({ title: 'Atestado anexado com sucesso!' });
    } catch (error: any) {
      toast({ title: 'Erro ao anexar atestado', description: error.message || 'Tente novamente.', variant: 'destructive' });
    }
  };

  const handleExamFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFile.mutateAsync({ file, folder: 'exams' });
      setExamForm(prev => ({ ...prev, file_url: url }));
      toast({ title: 'Arquivo do exame anexado com sucesso!' });
    } catch (error: any) {
      toast({ title: 'Erro ao anexar arquivo do exame', description: error.message || 'Tente novamente.', variant: 'destructive' });
    }
  };

  const submitAbsence = async () => {
    if (!absForm.start_date) return;
    await addAbsence.mutateAsync({ ...absForm, employee_id: employeeId });
    setAbsForm({ start_date: '', end_date: '', reason: '', cid_code: '', absence_type: 'medical', certificate_url: '' });
    setShowAbsForm(false);
  };

  const submitExam = async () => {
    if (!examForm.exam_type || !examForm.exam_date) return;
    await addExam.mutateAsync({ ...examForm, employee_id: employeeId });
    setExamForm({ exam_type: '', exam_date: '', next_exam_date: '', result: '', file_url: '' });
    setShowExamForm(false);
  };

  const formatDate = (d: string | null) => d ? format(new Date(d + 'T12:00:00'), 'dd/MM/yyyy') : '—';

  return (
    <Tabs defaultValue="absences" className="py-2">
      <TabsList>
        <TabsTrigger value="absences">Afastamentos</TabsTrigger>
        <TabsTrigger value="exams">Exames</TabsTrigger>
      </TabsList>

      <TabsContent value="absences">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold">Afastamentos</h4>
          <Button size="sm" variant="outline" onClick={() => setShowAbsForm(!showAbsForm)}><Plus className="w-4 h-4 mr-1" />Novo</Button>
        </div>

        {showAbsForm && (
          <div className="border rounded-lg p-4 mb-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Início *</Label><Input type="date" value={absForm.start_date} onChange={e => setAbsForm(p => ({ ...p, start_date: e.target.value }))} /></div>
              <div><Label>Fim</Label><Input type="date" value={absForm.end_date} onChange={e => setAbsForm(p => ({ ...p, end_date: e.target.value }))} /></div>
              <div><Label>Motivo</Label><Input value={absForm.reason} onChange={e => setAbsForm(p => ({ ...p, reason: e.target.value }))} /></div>
              <div><Label>CID</Label><Input value={absForm.cid_code} onChange={e => setAbsForm(p => ({ ...p, cid_code: e.target.value }))} /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={absForm.absence_type} onValueChange={v => setAbsForm(p => ({ ...p, absence_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medical">Atestado Médico</SelectItem>
                    <SelectItem value="maternity">Licença Maternidade</SelectItem>
                    <SelectItem value="paternity">Licença Paternidade</SelectItem>
                    <SelectItem value="accident">Acidente de Trabalho</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Atestado</Label>
                <div className="flex gap-2 items-center">
                  <label className="flex items-center gap-1 text-sm text-primary cursor-pointer hover:underline">
                    <FileUp className="w-4 h-4" />Anexar
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleAbsFile} />
                  </label>
                  {absForm.certificate_url && <span className="text-xs text-green-600">✓ Anexado</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={submitAbsence}>Salvar</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAbsForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader><TableRow>
            <TableHead>Início</TableHead><TableHead>Fim</TableHead><TableHead>Tipo</TableHead><TableHead>CID</TableHead><TableHead>Atestado</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {absences.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum afastamento</TableCell></TableRow>}
            {absences.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell>{formatDate(a.start_date)}</TableCell>
                <TableCell>{formatDate(a.end_date)}</TableCell>
                <TableCell className="capitalize">{a.absence_type}</TableCell>
                <TableCell>{a.cid_code || '—'}</TableCell>
                <TableCell>{a.certificate_url ? <a href={a.certificate_url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 text-primary" /></a> : '—'}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => deleteAbsence.mutate(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>

      <TabsContent value="exams">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold">Exames Periódicos</h4>
          <Button size="sm" variant="outline" onClick={() => setShowExamForm(!showExamForm)}><Plus className="w-4 h-4 mr-1" />Novo</Button>
        </div>

        {showExamForm && (
          <div className="border rounded-lg p-4 mb-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tipo de Exame *</Label><Input value={examForm.exam_type} onChange={e => setExamForm(p => ({ ...p, exam_type: e.target.value }))} placeholder="ASO, admissional..." /></div>
              <div><Label>Data *</Label><Input type="date" value={examForm.exam_date} onChange={e => setExamForm(p => ({ ...p, exam_date: e.target.value }))} /></div>
              <div><Label>Próximo Exame</Label><Input type="date" value={examForm.next_exam_date} onChange={e => setExamForm(p => ({ ...p, next_exam_date: e.target.value }))} /></div>
              <div><Label>Resultado</Label><Input value={examForm.result} onChange={e => setExamForm(p => ({ ...p, result: e.target.value }))} placeholder="Apto / Inapto" /></div>
              <div>
                <Label>Arquivo</Label>
                <label className="flex items-center gap-1 text-sm text-primary cursor-pointer hover:underline">
                  <FileUp className="w-4 h-4" />Anexar
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleExamFile} />
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={submitExam}>Salvar</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowExamForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader><TableRow>
            <TableHead>Tipo</TableHead><TableHead>Data</TableHead><TableHead>Próximo</TableHead><TableHead>Resultado</TableHead><TableHead>Arquivo</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {exams.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum exame</TableCell></TableRow>}
            {exams.map((ex: any) => (
              <TableRow key={ex.id}>
                <TableCell>{ex.exam_type}</TableCell>
                <TableCell>{formatDate(ex.exam_date)}</TableCell>
                <TableCell>{formatDate(ex.next_exam_date)}</TableCell>
                <TableCell>{ex.result || '—'}</TableCell>
                <TableCell>{ex.file_url ? <a href={ex.file_url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 text-primary" /></a> : '—'}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => deleteExam.mutate(ex.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  );
}
