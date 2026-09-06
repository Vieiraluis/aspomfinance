import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StorageAvatarImage } from '@/components/ui/storage-image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VisitFormDialog } from '@/components/portaria/VisitFormDialog';
import { PlantaoManager } from '@/components/portaria/PlantaoManager';
import { LocaisManager } from '@/components/portaria/LocaisManager';
import { useVisitas, useRegistrarSaida, usePlantaoAtual, useDeleteVisita } from '@/hooks/usePortariaData';
import { exportPortariaPdf } from '@/lib/portariaPdf';
import { format } from 'date-fns';
import { DoorOpen, FileDown, LogOut, Plus, Search, ShieldCheck, Trash2, Users } from 'lucide-react';

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
const dayEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
const isoDay = (d: Date) => format(d, 'yyyy-MM-dd');

export default function Portaria() {
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [start, setStart] = useState(isoDay(new Date()));
  const [end, setEnd] = useState(isoDay(new Date()));

  const { plantao } = usePlantaoAtual();
  const { data: ativas = [], isLoading: loadingAtivas } = useVisitas({ onlyActive: true });
  const registrarSaida = useRegistrarSaida();
  const deleteVisita = useDeleteVisita();

  const startDate = useMemo(() => dayStart(new Date(`${start}T12:00:00`)), [start]);
  const endDate = useMemo(() => dayEnd(new Date(`${end}T12:00:00`)), [end]);
  const { data: historico = [] } = useVisitas({ start: startDate, end: endDate });

  const filteredAtivas = ativas.filter((v: any) =>
    v.visitante_nome.toLowerCase().includes(search.toLowerCase())
  );

  const recepcionista = plantao?.employees;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              Portaria e Controle de Acesso
            </h1>
            <p className="text-sm text-muted-foreground">
              Registro de visitantes, escala de plantão e relatórios de acesso.
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nova visita
          </Button>
        </div>

        {/* Plantão em destaque */}
        <Card className="border-primary/40">
          <CardContent className="flex flex-wrap items-center gap-4 p-5">
            <Avatar className="w-16 h-16 ring-2 ring-primary/50">
              <StorageAvatarImage url={recepcionista?.photo_url} alt={recepcionista?.name} />
              <AvatarFallback>{(recepcionista?.name || '?').charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Recepcionista em plantão agora
              </p>
              <p className="text-xl font-semibold">
                {recepcionista?.name || 'Nenhum plantão ativo neste horário'}
              </p>
              {plantao && (
                <p className="text-sm text-muted-foreground">
                  {String(plantao.hora_inicio).slice(0, 5)} às {String(plantao.hora_fim).slice(0, 5)}
                  {recepcionista?.position ? ` • ${recepcionista.position}` : ''}
                </p>
              )}
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{ativas.length}</p>
                <p className="text-xs text-muted-foreground">No prédio</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{historico.length}</p>
                <p className="text-xs text-muted-foreground">No período</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="ativas">
          <TabsList>
            <TabsTrigger value="ativas">Visitas ativas</TabsTrigger>
            <TabsTrigger value="historico">Histórico e relatório</TabsTrigger>
            <TabsTrigger value="config">Escala e destinos</TabsTrigger>
          </TabsList>

          <TabsContent value="ativas" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4" /> Quem está no prédio
                </CardTitle>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar visitante..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14">Foto</TableHead>
                        <TableHead>Visitante</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Destino</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Recepcionista</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingAtivas && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            Carregando...
                          </TableCell>
                        </TableRow>
                      )}
                      {!loadingAtivas && filteredAtivas.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            Nenhuma visita em andamento.
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredAtivas.map((v: any) => (
                        <TableRow key={v.id}>
                          <TableCell>
                            <Avatar className="w-9 h-9">
                              <StorageAvatarImage url={v.foto_url} alt={v.visitante_nome} />
                              <AvatarFallback>{v.visitante_nome.charAt(0)}</AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">{v.visitante_nome}</TableCell>
                          <TableCell>{v.documento || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {v.portaria_locais?.nome || v.destino_nome || '—'}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(v.entrada_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                          <TableCell>{v.employees?.name || v.recepcionista_nome || '—'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => registrarSaida.mutate(v.id)}
                              disabled={registrarSaida.isPending}
                            >
                              <LogOut className="w-4 h-4 mr-2" /> Registrar saída
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DoorOpen className="w-4 h-4" /> Histórico de acessos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1.5">
                    <Label>De</Label>
                    <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Até</Label>
                    <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const today = isoDay(new Date());
                      setStart(today);
                      setEnd(today);
                    }}
                  >
                    Acessos de hoje
                  </Button>
                  <Button
                    className="ml-auto"
                    onClick={() =>
                      exportPortariaPdf({ visitas: historico as any, startDate, endDate })
                    }
                    disabled={historico.length === 0}
                  >
                    <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visitante</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Destino</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Saída</TableHead>
                        <TableHead>Recepcionista</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historico.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            Nenhum acesso no período.
                          </TableCell>
                        </TableRow>
                      )}
                      {historico.map((v: any) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-medium">{v.visitante_nome}</TableCell>
                          <TableCell>{v.documento || '—'}</TableCell>
                          <TableCell>{v.portaria_locais?.nome || v.destino_nome || '—'}</TableCell>
                          <TableCell>{format(new Date(v.entrada_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                          <TableCell>
                            {v.saida_at ? (
                              format(new Date(v.saida_at), 'dd/MM/yyyy HH:mm')
                            ) : (
                              <Badge>Em aberto</Badge>
                            )}
                          </TableCell>
                          <TableCell>{v.employees?.name || v.recepcionista_nome || '—'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => deleteVisita.mutate(v.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="mt-4 space-y-6">
            <PlantaoManager />
            <LocaisManager />
          </TabsContent>
        </Tabs>
      </div>

      <VisitFormDialog open={formOpen} onOpenChange={setFormOpen} plantao={plantao} />
    </MainLayout>
  );
}
