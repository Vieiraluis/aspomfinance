import { useMemo, useRef, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAccounts, useSuppliers } from '@/hooks/useSupabaseData';
import { Account } from '@/types/financial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatDate, formatDocument } from '@/lib/format';
import { sumMoney } from '@/lib/money';
import { buildBoletoItau, nossoNumeroFromSeed, ITAU_BENEFICIARIO } from '@/lib/boletoItau';
import { generatePixCode } from '@/lib/pixCode';
import { BoletoDocument, BoletoData, BoletoItem } from '@/components/cobranca/BoletoDocument';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import QRCode from 'qrcode';
import { useCreateAsaasCharge, useAsaasCharges } from '@/hooks/useAsaasCharges';
import { Barcode, Copy, Download, FileText, Loader2, Mail, MessageCircle, Printer, Search, QrCode, Zap, ExternalLink } from 'lucide-react';


const Cobranca = () => {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: suppliers = [] } = useSuppliers();

  const [search, setSearch] = useState('');
  const [pagadorFilter, setPagadorFilter] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [juros, setJuros] = useState('1');
  const [multa, setMulta] = useState('2');
  const [instrucoes, setInstrucoes] = useState('');
  const [documento, setDocumento] = useState('');
  const [boleto, setBoleto] = useState<BoletoData | null>(null);
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);
  const [billingType, setBillingType] = useState<'BOLETO' | 'PIX' | 'UNDEFINED'>('BOLETO');
  const createAsaas = useCreateAsaasCharge();
  const { data: asaasCharges = [] } = useAsaasCharges();


  const receivables = useMemo(
    () => accounts.filter((a) => a.type === 'receivable' && a.status !== 'paid' && a.status !== 'cancelled'),
    [accounts],
  );

  const pagadores = useMemo(() => {
    const map = new Map<string, string>();
    receivables.forEach((r) => {
      if (r.supplierId && r.supplierName) map.set(r.supplierId, r.supplierName);
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [receivables]);

  const filtered = receivables.filter((a) => {
    const s = search.toLowerCase();
    const matchesSearch =
      !s ||
      a.description.toLowerCase().includes(s) ||
      (a.supplierName || '').toLowerCase().includes(s) ||
      (a.code || '').toLowerCase().includes(s);
    const matchesPagador = pagadorFilter === 'all' || a.supplierId === pagadorFilter;
    return matchesSearch && matchesPagador;
  });

  const selectedAccounts = receivables.filter((a) => selected.includes(a.id));
  const total = sumMoney(selectedAccounts.map((a) => a.amount));

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map((a) => a.id));

  const buildDescricao = (items: Account[]) =>
    items
      .map((i) => `${i.code ? `${i.code} — ` : ''}${i.description} (venc. ${formatDate(i.dueDate)}) ${formatCurrency(i.amount)}`)
      .join(' | ');

  const handleGenerate = async () => {
    if (selectedAccounts.length === 0) {
      toast({ title: 'Selecione ao menos um lançamento', variant: 'destructive' });
      return;
    }
    const pagadorIds = new Set(selectedAccounts.map((a) => a.supplierId || 'sem'));
    if (pagadorIds.size > 1) {
      toast({
        title: 'Pagadores diferentes',
        description: 'Selecione lançamentos de um único cliente para agrupar em um boleto.',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const { data: settings } = await supabase.from('receipt_settings').select('*').maybeSingle();
      const pixKey = (settings as any)?.pix_key || ITAU_BENEFICIARIO.cnpj.replace(/\D/g, '');

      const [y, m, d] = dueDate.split('-').map(Number);
      const venc = new Date(y, m - 1, d, 12, 0, 0);

      const seed = selectedAccounts.map((a) => a.id).sort().join('') + dueDate;
      const nn = nossoNumeroFromSeed(seed);
      const numbers = buildBoletoItau({ nossoNumero: nn, valor: total, vencimento: venc });

      const pixCode = generatePixCode({
        pixKey,
        merchantName: ITAU_BENEFICIARIO.nomeCurto,
        merchantCity: 'RIO DE JANEIRO',
        amount: total,
        txid: nn,
        description: `Cobranca ${nn}`,
      });
      let pixQr: string | undefined;
      try {
        pixQr = await QRCode.toDataURL(pixCode, { margin: 0, width: 260 });
      } catch {
        pixQr = undefined;
      }

      const supplier = suppliers.find((s) => s.id === selectedAccounts[0].supplierId);
      const itens: BoletoItem[] = selectedAccounts.map((a) => ({
        id: a.id,
        descricao: a.description,
        vencimento: a.dueDate,
        valor: a.amount,
        codigo: a.code,
      }));

      setBoleto({
        numbers,
        pagadorNome: selectedAccounts[0].supplierName || 'Pagador não informado',
        pagadorDocumento: supplier?.document ? formatDocument(supplier.document) : undefined,
        pagadorEndereco: supplier?.address,
        vencimento: venc,
        total,
        itens,
        descricao: buildDescricao(selectedAccounts),
        documento: documento || numbers.nossoNumeroFormatado.replace(/\D/g, '').slice(-8),
        juros: Number(juros) || 0,
        multa: Number(multa) || 0,
        instrucoesExtras: instrucoes,
        pixCode,
        pixQr,
      });
      setOpen(true);
    } catch (e: any) {
      toast({ title: 'Erro ao gerar boleto', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleRegisterAsaas = async () => {
    if (selectedAccounts.length === 0) {
      toast({ title: 'Selecione ao menos um lançamento', variant: 'destructive' });
      return;
    }
    const pagadorIds = new Set(selectedAccounts.map((a) => a.supplierId || 'sem'));
    if (pagadorIds.size > 1) {
      toast({
        title: 'Pagadores diferentes',
        description: 'Selecione lançamentos de um único cliente.',
        variant: 'destructive',
      });
      return;
    }
    const supplier = suppliers.find((s) => s.id === selectedAccounts[0].supplierId);
    if (!supplier?.document) {
      toast({
        title: 'Cliente sem CPF/CNPJ',
        description: 'Cadastre o CPF/CNPJ do cliente para registrar a cobrança no Asaas.',
        variant: 'destructive',
      });
      return;
    }

    createAsaas.mutate({
      accountIds: selectedAccounts.map((a) => a.id),
      billingType,
      dueDate,
      description: buildDescricao(selectedAccounts).slice(0, 490),
      juros: Number(juros) || 0,
      multa: Number(multa) || 0,
      notify: true,
      customer: {
        name: supplier.name,
        cpfCnpj: supplier.document,
        email: supplier.email || undefined,
        phone: supplier.phone || undefined,
        address: supplier.address || undefined,
      },
    });
  };



  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copiado!` });
    } catch {
      toast({ title: 'Não foi possível copiar', variant: 'destructive' });
    }
  };

  const handleDownloadPdf = async () => {
    if (!docRef.current) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(docRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = 210;
      const margin = 8;
      const w = pageW - margin * 2;
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(img, 'PNG', margin, margin, w, h);
      pdf.save(`boleto-aspom-${boleto?.numbers.nossoNumeroFormatado.replace(/\D/g, '')}.pdf`);
    } catch (e: any) {
      toast({ title: 'Erro ao gerar PDF', description: e.message, variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  const shareText = boleto
    ? `Cobrança ASPOM\nVencimento: ${formatDate(boleto.vencimento)}\nValor: ${formatCurrency(boleto.total)}\n\nLinha digitável:\n${boleto.numbers.linhaDigitavel}\n\nPIX Copia e Cola:\n${boleto.pixCode}`
    : '';

  return (
    <MainLayout>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .boleto-sheet, .boleto-sheet * { visibility: visible !important; }
          .boleto-sheet { position: absolute; left: 0; top: 0; width: 100%; max-width: none; }
        }
      `}</style>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Barcode className="w-6 h-6 text-primary" />
              Cobrança — Boleto & PIX
            </h1>
            <p className="text-sm text-muted-foreground">
              Agrupe lançamentos de Contas a Receber em um único boleto Itaú com QR Code PIX.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Seleção de lançamentos */}
          <Card className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, descrição ou código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={pagadorFilter} onValueChange={(v) => { setPagadorFilter(v); setSelected([]); }}>
                <SelectTrigger className="sm:w-56">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {pagadores.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{filtered.length} lançamento(s) em aberto · {selected.length} selecionado(s)</span>
              <Button variant="ghost" size="sm" onClick={toggleAll} disabled={filtered.length === 0}>
                {selected.length === filtered.length && filtered.length > 0 ? 'Limpar' : 'Selecionar tudo'}
              </Button>
            </div>

            <ScrollArea className="h-[420px] rounded-lg border border-border">
              {isLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">Nenhum lançamento em aberto.</div>
              ) : (
                <div className="divide-y divide-border">
                  {filtered.map((a) => (
                    <label
                      key={a.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox checked={selected.includes(a.id)} onCheckedChange={() => toggle(a.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.description}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {a.supplierName || 'Sem cliente'} · {a.code || '—'} · Venc. {formatDate(a.dueDate)}
                        </p>
                      </div>
                      {a.status === 'overdue' && (
                        <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">
                          Vencido
                        </Badge>
                      )}
                      <span className="text-sm font-semibold tabular-nums">{formatCurrency(a.amount)}</span>
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Configuração da cobrança */}
          <Card className="p-4 space-y-4 h-fit lg:sticky lg:top-20">
            <div className="rounded-lg bg-gradient-primary/10 border border-primary/20 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Valor total do boleto</p>
              <p className="text-3xl font-display font-bold text-primary tabular-nums">{formatCurrency(total)}</p>
              <p className="text-xs text-muted-foreground mt-1">{selectedAccounts.length} lançamento(s) agrupado(s)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venc">Vencimento do boleto</Label>
              <Input id="venc" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="juros">Juros (% a.m.)</Label>
                <Input id="juros" type="number" step="0.01" value={juros} onChange={(e) => setJuros(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="multa">Multa (%)</Label>
                <Input id="multa" type="number" step="0.01" value={multa} onChange={(e) => setMulta(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc">Nº do documento (opcional)</Label>
              <Input id="doc" value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="Automático" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instr">Instruções adicionais</Label>
              <Textarea
                id="instr"
                rows={3}
                value={instrucoes}
                onChange={(e) => setInstrucoes(e.target.value)}
                placeholder="Uma instrução por linha"
              />
            </div>

            <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">{ITAU_BENEFICIARIO.nomeCurto} — Banco {ITAU_BENEFICIARIO.banco} ({ITAU_BENEFICIARIO.bancoCodigo})</p>
              <p>CNPJ {ITAU_BENEFICIARIO.cnpj}</p>
              <p>Agência {ITAU_BENEFICIARIO.agencia} · C/C {ITAU_BENEFICIARIO.conta}-{ITAU_BENEFICIARIO.contaDv}</p>
            </div>

            <Button className="w-full" onClick={handleGenerate} disabled={generating || selectedAccounts.length === 0}>
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Gerar Boleto + PIX
            </Button>
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[900px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Boleto de Cobrança
            </DialogTitle>
          </DialogHeader>

          {boleto && (
            <>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => copy(boleto.numbers.linhaDigitavelRaw, 'Linha digitável')}>
                  <Copy className="w-4 h-4 mr-2" /> Copiar Linha Digitável
                </Button>
                <Button variant="outline" size="sm" onClick={() => copy(boleto.pixCode, 'Código PIX')}>
                  <Copy className="w-4 h-4 mr-2" /> Copiar Código PIX
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={downloading}>
                  {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Baixar PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" /> Imprimir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    (window.location.href = `mailto:?subject=${encodeURIComponent(
                      `Cobrança ASPOM — ${formatCurrency(boleto.total)}`,
                    )}&body=${encodeURIComponent(shareText)}`)
                  }
                >
                  <Mail className="w-4 h-4 mr-2" /> E-mail
                </Button>
              </div>

              <div className="rounded-lg border border-border overflow-x-auto bg-muted/30 p-3">
                <BoletoDocument ref={docRef} data={boleto} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Cobranca;
