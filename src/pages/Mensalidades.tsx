import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Printer, Search, RefreshCw, Trash2, Check } from 'lucide-react';
import { useAssociados } from '@/hooks/useAssociados';
import { useMensalidades, useUpdateMensalidade, useDeleteMensalidade, useGerarMensalidadesMes } from '@/hooks/useMensalidades';
import { formatCurrency } from '@/lib/format';
import { MensalidadeStatusBadge } from '@/components/associados/StatusBadge';
import { BoletoBatchDialog } from '@/components/associados/BoletoBatchDialog';
import { toast } from '@/hooks/use-toast';

const currentMM_YYYY = () => {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function Mensalidades() {
  const { data: associados = [] } = useAssociados();
  const { data: mensalidades = [], isLoading } = useMensalidades();
  const update = useUpdateMensalidade();
  const del = useDeleteMensalidade();
  const gerar = useGerarMensalidadesMes();

  const [competencia, setCompetencia] = useState(currentMM_YYYY());
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [batchOpen, setBatchOpen] = useState(false);

  const filtered = useMemo(() => {
    const today = new Date();
    return mensalidades.filter((m) => {
      const a = associados.find((x) => x.id === m.associado_id);
      if (competencia !== 'all' && m.competencia !== competencia) return false;
      const effective = m.status === 'pendente' && new Date(m.vencimento + 'T23:59:59') < today ? 'atrasado' : m.status;
      if (statusFilter !== 'all' && effective !== statusFilter) return false;
      const q = search.toLowerCase().trim();
      if (q && !(a?.nome.toLowerCase().includes(q) || a?.matricula_associacao?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [mensalidades, associados, competencia, statusFilter, search]);

  const competencias = useMemo(() => {
    const set = new Set(mensalidades.map((m) => m.competencia));
    set.add(currentMM_YYYY());
    return Array.from(set).sort((a, b) => {
      const [ma, ya] = a.split('/').map(Number);
      const [mb, yb] = b.split('/').map(Number);
      return yb - ya || mb - ma;
    });
  }, [mensalidades]);

  const handleGerar = async () => {
    try {
      const r = await gerar.mutateAsync(competencia);
      toast({ title: `${r.inserted} mensalidade(s) geradas`, description: r.skipped ? `${r.skipped} já existiam` : undefined });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const handleBaixar = async (id: string) => {
    try {
      await update.mutateAsync({ id, status: 'pago', pago_em: new Date().toISOString().slice(0, 10) });
      toast({ title: 'Mensalidade baixada' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const handleEstornar = async (id: string) => {
    try { await update.mutateAsync({ id, status: 'pendente', pago_em: null }); } catch {}
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Mensalidades</h1>
            <p className="text-muted-foreground mt-1">Cobranças mensais dos associados</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGerar} disabled={gerar.isPending}>
              {gerar.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Gerar mensalidades de {competencia}
            </Button>
            <Button onClick={() => setBatchOpen(true)}><Printer className="w-4 h-4 mr-2" />Imprimir em lote</Button>
          </div>
        </div>

        <div className="sticky top-14 md:top-16 z-20 bg-background/80 backdrop-blur-md py-3 -mx-4 md:-mx-6 px-4 md:px-6 border-b border-border/40">
          <div className="flex flex-wrap gap-3">
            <Select value={competencia} onValueChange={setCompetencia}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas competências</SelectItem>
                {competencias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Buscar associado..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">Nenhuma mensalidade encontrada para o filtro selecionado.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Associado</TableHead>
                  <TableHead>Posto</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pago em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
                  const a = associados.find((x) => x.id === m.associado_id);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{a?.nome || '—'}</TableCell>
                      <TableCell>{a?.posto_graduacao || '—'}</TableCell>
                      <TableCell>{m.competencia}</TableCell>
                      <TableCell>{m.vencimento.split('-').reverse().join('/')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(m.valor))}</TableCell>
                      <TableCell><MensalidadeStatusBadge status={m.status} vencimento={m.vencimento} /></TableCell>
                      <TableCell className="text-muted-foreground">{m.pago_em ? m.pago_em.split('-').reverse().join('/') : '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {m.status === 'pago' ? (
                            <Button variant="ghost" size="sm" onClick={() => handleEstornar(m.id)}>Estornar</Button>
                          ) : (
                            <Button variant="ghost" size="icon" title="Dar baixa" onClick={() => handleBaixar(m.id)}><Check className="w-4 h-4 text-success" /></Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => del.mutate(m.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <BoletoBatchDialog open={batchOpen} onOpenChange={setBatchOpen} mensalidades={filtered} associados={associados} />
    </MainLayout>
  );
}
