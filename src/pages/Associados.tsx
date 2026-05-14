import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAssociados, useDeleteAssociado } from '@/hooks/useAssociados';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Search, Pencil, Trash2, Users, Printer } from 'lucide-react';
import { Associado, postoGraduacaoOptions } from '@/types/associados';
import { AssociadoForm } from '@/components/associados/AssociadoForm';
import { AssociadoStatusBadge } from '@/components/associados/StatusBadge';
import { formatCurrency } from '@/lib/format';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export default function Associados() {
  const { data = [], isLoading } = useAssociados();
  const del = useDeleteAssociado();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [postoFilter, setPostoFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Associado | null>(null);

  const filtered = useMemo(() => {
    return data.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (postoFilter !== 'all' && a.posto_graduacao !== postoFilter) return false;
      const q = search.toLowerCase().trim();
      if (q && !`${a.nome} ${a.matricula_associacao || ''} ${a.cpf || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, search, statusFilter, postoFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este associado e todas as mensalidades dele?')) return;
    try {
      await del.mutateAsync(id);
      toast({ title: 'Associado excluído' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Associados</h1>
            <p className="text-muted-foreground mt-1">Cadastro de militares associados — ASPOM</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/associados/mensalidades"><Printer className="w-4 h-4 mr-2" />Mensalidades</Link></Button>
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />Novo Associado
            </Button>
          </div>
        </div>

        <div className="sticky top-14 md:top-16 z-20 bg-background/80 backdrop-blur-md py-3 -mx-4 md:-mx-6 px-4 md:px-6 border-b border-border/40">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Buscar por nome, matrícula, CPF..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
              </SelectContent>
            </Select>
            <Select value={postoFilter} onValueChange={setPostoFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos postos</SelectItem>
                {postoGraduacaoOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mb-3 opacity-50" />
              <p>Nenhum associado encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foto</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Posto/Grad</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead className="text-right">Mensalidade</TableHead>
                  <TableHead className="text-center">Venc.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {a.photo_url ? <img src={a.photo_url} alt={a.nome} className="w-full h-full object-cover" /> : <Users className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{a.nome}</TableCell>
                    <TableCell>{a.posto_graduacao || '—'}</TableCell>
                    <TableCell>{a.matricula_associacao || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{a.cpf || '—'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(a.valor_mensalidade))}</TableCell>
                    <TableCell className="text-center">dia {a.dia_vencimento}</TableCell>
                    <TableCell><AssociadoStatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(a); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
      <AssociadoForm open={open} onOpenChange={setOpen} editing={editing} />
    </MainLayout>
  );
}
