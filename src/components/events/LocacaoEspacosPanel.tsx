import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  EspacoLocacao,
  LocacaoReserva,
  useEspacos,
  useLocacoes,
  useUpsertEspaco,
  useUpsertLocacao,
  useDeleteEspaco,
  useDeleteLocacao,
  useConfirmarLocacao,
  useUploadContrato,
} from '@/hooks/useLocacaoData';
import { gerarContratoModelo } from '@/lib/contractPdf';
import {
  Plus, Trash2, CheckCircle2, FileText, Upload, Send, Calendar as CalendarIcon, MapPin, Phone,
} from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CurrencyInput } from '@/components/ui/currency-input';

const TURNOS: Array<{ value: 'manha' | 'tarde' | 'noite'; label: string }> = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  rascunho: { label: 'Rascunho', cls: 'bg-slate-700 text-slate-200' },
  confirmada: { label: 'Confirmada', cls: 'bg-emerald-600 text-white' },
  cancelada: { label: 'Cancelada', cls: 'bg-red-600 text-white' },
};

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function LocacaoEspacosPanel() {
  const { data: espacos = [] } = useEspacos();
  const { data: reservas = [] } = useLocacoes();

  return (
    <Tabs defaultValue="agenda">
      <TabsList>
        <TabsTrigger value="agenda">Agenda</TabsTrigger>
        <TabsTrigger value="reservas">Reservas ({reservas.length})</TabsTrigger>
        <TabsTrigger value="espacos">Espaços ({espacos.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="agenda" className="mt-4">
        <AgendaView reservas={reservas} espacos={espacos} />
      </TabsContent>
      <TabsContent value="reservas" className="mt-4">
        <ReservasView reservas={reservas} espacos={espacos} />
      </TabsContent>
      <TabsContent value="espacos" className="mt-4">
        <EspacosView espacos={espacos} />
      </TabsContent>
    </Tabs>
  );
}

/* ============== Espaços ============== */
function EspacosView({ espacos }: { espacos: EspacoLocacao[] }) {
  const upsert = useUpsertEspaco();
  const del = useDeleteEspaco();
  const [draft, setDraft] = useState({ nome: '', capacidade_maxima: 0, preco_base: 0, descricao: '' });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Novo espaço</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Nome *</Label>
            <Input value={draft.nome} onChange={e => setDraft(d => ({ ...d, nome: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Capacidade</Label>
              <Input type="number" value={draft.capacidade_maxima}
                onChange={e => setDraft(d => ({ ...d, capacidade_maxima: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label>Preço base</Label>
              <CurrencyInput value={draft.preco_base}
                onChange={(v) => setDraft(d => ({ ...d, preco_base: v }))} />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea rows={2} value={draft.descricao}
              onChange={e => setDraft(d => ({ ...d, descricao: e.target.value }))} />
          </div>
          <Button
            disabled={!draft.nome || upsert.isPending}
            onClick={() => upsert.mutate(draft, { onSuccess: () => setDraft({ nome: '', capacidade_maxima: 0, preco_base: 0, descricao: '' }) })}
          >
            <Plus className="w-4 h-4 mr-1" /> Cadastrar
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {espacos.map(e => (
          <Card key={e.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{e.nome}</div>
                  <p className="text-xs text-muted-foreground">{e.descricao}</p>
                  <div className="flex gap-3 text-xs mt-2">
                    <span>👥 {e.capacidade_maxima} lugares</span>
                    <span className="text-emerald-400">{fmtBRL(Number(e.preco_base))}</span>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del.mutate(e.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {espacos.length === 0 && (
          <Card className="md:col-span-2 border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2" /> Cadastre seu primeiro espaço
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ============== Reservas ============== */
function ReservasView({ reservas, espacos }: { reservas: LocacaoReserva[]; espacos: EspacoLocacao[] }) {
  const upsert = useUpsertLocacao();
  const del = useDeleteLocacao();
  const confirmar = useConfirmarLocacao();
  const upload = useUploadContrato();

  const [draft, setDraft] = useState<any>({
    espaco_id: '', cliente_nome: '', cliente_telefone: '', cliente_documento: '',
    tipo_evento: '', data_evento: format(new Date(), 'yyyy-MM-dd'), turno: 'noite',
    total_lugares: 0, valor_total: 0,
  });

  const espacoMap = useMemo(() => new Map(espacos.map(e => [e.id, e])), [espacos]);

  // valida turno disponível
  const conflito = useMemo(() => {
    return reservas.some(r =>
      r.espaco_id === draft.espaco_id &&
      r.data_evento === draft.data_evento &&
      r.turno === draft.turno &&
      r.status === 'confirmada'
    );
  }, [reservas, draft]);

  const handleCriar = () => {
    if (!draft.espaco_id || !draft.cliente_nome) return;
    upsert.mutate(draft, {
      onSuccess: () => setDraft({ ...draft, cliente_nome: '', cliente_telefone: '', cliente_documento: '', total_lugares: 0, valor_total: 0 }),
    });
  };

  const handleGerarContrato = async (r: LocacaoReserva) => {
    const esp = espacoMap.get(r.espaco_id);
    if (!esp) return;
    const blob = gerarContratoModelo(r, esp);
    const file = new File([blob], `contrato-${r.protocolo || r.id}.pdf`, { type: 'application/pdf' });
    await upload.mutateAsync({ id: r.id, file, kind: 'modelo' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4">
      <Card className="self-start sticky top-20">
        <CardHeader className="pb-3"><CardTitle className="text-base">Nova reserva</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Espaço *</Label>
            <Select value={draft.espaco_id} onValueChange={v => setDraft({ ...draft, espaco_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {espacos.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cliente *</Label>
            <Input value={draft.cliente_nome} onChange={e => setDraft({ ...draft, cliente_nome: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Telefone (WhatsApp)</Label>
              <Input value={draft.cliente_telefone} placeholder="(21) 99999-9999"
                onChange={e => setDraft({ ...draft, cliente_telefone: e.target.value })} />
            </div>
            <div>
              <Label>Documento</Label>
              <Input value={draft.cliente_documento}
                onChange={e => setDraft({ ...draft, cliente_documento: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Tipo de evento</Label>
            <Input value={draft.tipo_evento} placeholder="Casamento, formatura..."
              onChange={e => setDraft({ ...draft, tipo_evento: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Data</Label>
              <Input type="date" value={draft.data_evento}
                onChange={e => setDraft({ ...draft, data_evento: e.target.value })} />
            </div>
            <div>
              <Label>Turno</Label>
              <Select value={draft.turno} onValueChange={v => setDraft({ ...draft, turno: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TURNOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Lugares</Label>
              <Input type="number" value={draft.total_lugares}
                onChange={e => setDraft({ ...draft, total_lugares: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Valor total</Label>
              <CurrencyInput value={draft.valor_total} onChange={(v) => setDraft({ ...draft, valor_total: v })} />
            </div>
          </div>
          {conflito && (
            <p className="text-xs text-red-400">⚠ Já existe reserva confirmada nesse turno.</p>
          )}
          <Button className="w-full" disabled={!draft.espaco_id || !draft.cliente_nome || conflito || upsert.isPending} onClick={handleCriar}>
            <Plus className="w-4 h-4 mr-1" /> Salvar como rascunho
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {reservas.map(r => {
          const esp = espacoMap.get(r.espaco_id);
          const st = STATUS_BADGE[r.status];
          return (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{r.cliente_nome}</span>
                      <Badge className={st.cls}>{st.label}</Badge>
                      {r.protocolo && <span className="text-[10px] font-mono bg-secondary px-2 py-0.5 rounded">{r.protocolo}</span>}
                      {r.whatsapp_enviado_at && <Badge variant="outline" className="text-emerald-400 border-emerald-400 text-[10px]">WhatsApp ✓</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-3 mt-1 flex-wrap">
                      <span><MapPin className="w-3 h-3 inline mr-1" />{esp?.nome}</span>
                      <span><CalendarIcon className="w-3 h-3 inline mr-1" />{format(new Date(r.data_evento + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })} • {TURNOS.find(t => t.value === r.turno)?.label}</span>
                      {r.cliente_telefone && <span><Phone className="w-3 h-3 inline mr-1" />{r.cliente_telefone}</span>}
                      <span>👥 {r.total_lugares} lugares</span>
                    </div>
                    {r.tipo_evento && <p className="text-xs mt-1">{r.tipo_evento}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-emerald-400">{fmtBRL(Number(r.valor_total))}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {r.status !== 'confirmada' && r.status !== 'cancelada' && (
                    <Button size="sm" onClick={() => confirmar.mutate(r.id)} disabled={confirmar.isPending}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmar + WhatsApp
                    </Button>
                  )}
                  {r.status === 'confirmada' && (
                    <Button size="sm" variant="outline" onClick={() => confirmar.mutate(r.id)} disabled={confirmar.isPending}>
                      <Send className="w-3 h-3 mr-1" /> Reenviar WhatsApp
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleGerarContrato(r)}>
                    <FileText className="w-3 h-3 mr-1" /> Gerar contrato
                  </Button>
                  {r.contrato_modelo_url && (
                    <a href={r.contrato_modelo_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost">📄 Modelo</Button>
                    </a>
                  )}
                  <label className="inline-block">
                    <input type="file" accept="application/pdf" hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) upload.mutate({ id: r.id, file: f, kind: 'assinado' });
                      }} />
                    <Button size="sm" variant="outline" asChild>
                      <span><Upload className="w-3 h-3 mr-1" /> Assinado</span>
                    </Button>
                  </label>
                  {r.contrato_assinado_url && (
                    <a href={r.contrato_assinado_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost">✍️ Ver assinado</Button>
                    </a>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive ml-auto" onClick={() => del.mutate(r.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {reservas.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2" /> Nenhuma reserva ainda
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ============== Agenda ============== */
function AgendaView({ reservas, espacos }: { reservas: LocacaoReserva[]; espacos: EspacoLocacao[] }) {
  const [refDate, setRefDate] = useState(new Date());
  const days = useMemo(() => {
    const start = startOfMonth(refDate);
    const end = endOfMonth(refDate);
    return eachDayOfInterval({ start, end });
  }, [refDate]);

  const reservasPorDia = useMemo(() => {
    const m = new Map<string, LocacaoReserva[]>();
    reservas.forEach(r => {
      const k = r.data_evento;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    });
    return m;
  }, [reservas]);

  const espacoNome = (id: string) => espacos.find(e => e.id === id)?.nome || '—';
  const proximas = reservas
    .filter(r => r.status === 'confirmada' && new Date(r.data_evento) >= addDays(new Date(), -1))
    .slice(0, 5);
  const pendentes = reservas.filter(r => r.status === 'rascunho').slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">{format(refDate, "MMMM 'de' yyyy", { locale: ptBR })}</CardTitle>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setRefDate(addDays(startOfMonth(refDate), -1))}>‹</Button>
            <Button size="sm" variant="outline" onClick={() => setRefDate(new Date())}>Hoje</Button>
            <Button size="sm" variant="outline" onClick={() => setRefDate(addDays(endOfMonth(refDate), 1))}>›</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground mb-1">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d} className="text-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: days[0].getDay() }).map((_, i) => <div key={'e' + i} />)}
            {days.map(d => {
              const k = format(d, 'yyyy-MM-dd');
              const list = reservasPorDia.get(k) || [];
              const hasConfirmada = list.some(l => l.status === 'confirmada');
              const turnosOcupados = new Set(list.filter(l => l.status === 'confirmada').map(l => l.turno));
              const isToday = isSameDay(d, new Date());
              return (
                <div key={k} className={`min-h-[64px] rounded border p-1 text-[10px] ${isToday ? 'border-emerald-500' : 'border-border'} ${hasConfirmada ? 'bg-emerald-950/30' : 'bg-card'}`}>
                  <div className="font-semibold">{format(d, 'd')}</div>
                  <div className="flex gap-0.5 mt-0.5">
                    {TURNOS.map(t => (
                      <div key={t.value}
                        title={t.label}
                        className={`flex-1 h-1 rounded ${turnosOcupados.has(t.value) ? 'bg-emerald-500' : 'bg-secondary'}`} />
                    ))}
                  </div>
                  <div className="mt-0.5 space-y-0.5">
                    {list.slice(0, 2).map(l => (
                      <div key={l.id} className="truncate" title={`${l.cliente_nome} - ${espacoNome(l.espaco_id)}`}>
                        • {l.cliente_nome}
                      </div>
                    ))}
                    {list.length > 2 && <div className="text-muted-foreground">+{list.length - 2}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 text-[10px] mt-3 text-muted-foreground">
            <span><span className="inline-block w-2 h-2 rounded bg-emerald-500 mr-1" /> Turno confirmado</span>
            <span><span className="inline-block w-2 h-2 rounded bg-secondary mr-1" /> Disponível</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Próximos Eventos</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-xs">
            {proximas.length === 0 && <p className="text-muted-foreground">Nenhum próximo</p>}
            {proximas.map(r => (
              <div key={r.id} className="border-l-2 border-emerald-500 pl-2">
                <div className="font-semibold">{r.cliente_nome}</div>
                <div className="text-muted-foreground">{format(new Date(r.data_evento + 'T12:00:00'), 'dd/MM', { locale: ptBR })} • {espacoNome(r.espaco_id)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Reservas Pendentes</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-xs">
            {pendentes.length === 0 && <p className="text-muted-foreground">Nenhuma pendente</p>}
            {pendentes.map(r => (
              <div key={r.id} className="border-l-2 border-amber-500 pl-2">
                <div className="font-semibold">{r.cliente_nome}</div>
                <div className="text-muted-foreground">{format(new Date(r.data_evento + 'T12:00:00'), 'dd/MM', { locale: ptBR })} • {fmtBRL(Number(r.valor_total))}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
