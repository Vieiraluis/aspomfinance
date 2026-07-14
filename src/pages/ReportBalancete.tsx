import { useMemo, useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAccounts } from '@/hooks/useSupabaseData';
import { categoryLabels, AccountCategory, Account } from '@/types/financial';
import { formatCurrency, formatDate } from '@/lib/format';
import { sumMoney, subMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, FileDown, CalendarIcon, X, Scale, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Regime = 'competencia' | 'caixa';
type StatusFilter = 'all' | 'paid' | 'pending';

const ReportBalancete = () => {
  const { data: accounts = [], isLoading } = useAccounts();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [regime, setRegime] = useState<Regime>('competencia');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const printRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const s = startDate ? startOfDay(startDate).getTime() : -Infinity;
    const e = endDate ? endOfDay(endDate).getTime() : Infinity;

    return accounts.filter((a) => {
      if (a.status === 'cancelled') return false;

      // Status filter
      if (statusFilter === 'paid' && a.status !== 'paid') return false;
      if (statusFilter === 'pending' && a.status === 'paid') return false;

      // Regime filter
      let refDate: Date | null = null;
      if (regime === 'caixa') {
        if (a.status !== 'paid' || !a.paidAt) return false;
        refDate = new Date(a.paidAt);
      } else {
        refDate = new Date(a.dueDate);
      }
      const t = refDate.getTime();
      return t >= s && t <= e;
    });
  }, [accounts, startDate, endDate, regime, statusFilter]);

  const buildGroups = (type: 'payable' | 'receivable') => {
    const list = filtered.filter((a) => a.type === type);
    const byCat = new Map<string, Account[]>();
    for (const a of list) {
      const key = a.category || 'other';
      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key)!.push(a);
    }
    const groups = Array.from(byCat.entries()).map(([key, items]) => ({
      category: key,
      label: categoryLabels[key as AccountCategory] || key,
      items,
      total: sumMoney(items, (i) => i.amount),
      count: items.length,
    }));
    groups.sort((a, b) => b.total - a.total);
    const total = sumMoney(groups, (g) => g.total);
    return { groups, total };
  };

  const receitas = useMemo(() => buildGroups('receivable'), [filtered]);
  const despesas = useMemo(() => buildGroups('payable'), [filtered]);
  const resultado = subMoney(receitas.total, despesas.total);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Balancete de Contas',
  });

  const handleExportPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text('Balancete de Contas', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(100);
    const periodo = startDate || endDate
      ? `${startDate ? format(startDate, 'dd/MM/yyyy') : '—'} até ${endDate ? format(endDate, 'dd/MM/yyyy') : '—'}`
      : 'Todos os registros';
    doc.text(`Período: ${periodo}`, pageWidth / 2, 21, { align: 'center' });
    doc.text(
      `Regime: ${regime === 'caixa' ? 'Caixa (Pagamento)' : 'Competência (Vencimento)'}  •  Status: ${
        statusFilter === 'all' ? 'Todos' : statusFilter === 'paid' ? 'Pagos/Recebidos' : 'Pendentes'
      }`,
      pageWidth / 2,
      26,
      { align: 'center' },
    );
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, 31, { align: 'center' });

    let y = 38;

    const renderSection = (title: string, groups: typeof receitas.groups, total: number, color: [number, number, number]) => {
      doc.setFontSize(12);
      doc.setTextColor(...color);
      doc.text(title, 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [['Categoria', 'Qtd.', 'Valor (R$)']],
        body: groups.map((g) => [g.label, String(g.count), formatCurrency(g.total)]),
        foot: [['TOTAL', String(groups.reduce((s, g) => s + g.count, 0)), formatCurrency(total)]],
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: color, textColor: [255, 255, 255], fontStyle: 'bold' },
        footStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
        theme: 'grid',
      });
      // @ts-ignore
      y = (doc as any).lastAutoTable.finalY + 8;
    };

    renderSection('RECEITAS', receitas.groups, receitas.total, [16, 122, 87]);
    renderSection('DESPESAS', despesas.groups, despesas.total, [190, 40, 40]);

    doc.setFontSize(12);
    doc.setTextColor(33, 33, 33);
    doc.text('RESULTADO DO PERÍODO', 14, y);
    autoTable(doc, {
      startY: y + 2,
      body: [
        ['(+) Total de Receitas', formatCurrency(receitas.total)],
        ['(-) Total de Despesas', formatCurrency(despesas.total)],
        ['(=) Resultado Líquido', formatCurrency(resultado)],
      ],
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right', fontStyle: 'bold' } },
      theme: 'grid',
    });

    doc.save('balancete.pdf');
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const periodoLabel = startDate || endDate
    ? `${startDate ? format(startDate, 'dd/MM/yyyy') : '—'} até ${endDate ? format(endDate, 'dd/MM/yyyy') : '—'}`
    : 'Todos os registros';

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Balancete de Contas</h1>
            <p className="text-muted-foreground mt-1">Receitas e despesas agrupadas por categoria</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handlePrint()}>
              <Printer className="w-4 h-4 mr-2" /> Imprimir
            </Button>
            <Button onClick={handleExportPdf}>
              <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 no-print">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Período:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-[160px] justify-start text-left font-normal', !startDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy') : 'Data inicial'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-[160px] justify-start text-left font-normal', !endDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy') : 'Data final'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              {(startDate || endDate) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" /> Limpar
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Regime:</span>
              <Select value={regime} onValueChange={(v) => setRegime(v as Regime)}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="competencia">Competência (Vencimento)</SelectItem>
                  <SelectItem value="caixa">Caixa (Pagamento)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} disabled={regime === 'caixa'}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pagos / Recebidos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <span className="text-sm text-muted-foreground">Total Receitas</span>
            </div>
            <p className="text-2xl font-display font-bold text-success">{formatCurrency(receitas.total)}</p>
            <p className="text-xs text-muted-foreground mt-1">{receitas.groups.reduce((s, g) => s + g.count, 0)} lançamento(s)</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-destructive" />
              <span className="text-sm text-muted-foreground">Total Despesas</span>
            </div>
            <p className="text-2xl font-display font-bold text-destructive">{formatCurrency(despesas.total)}</p>
            <p className="text-xs text-muted-foreground mt-1">{despesas.groups.reduce((s, g) => s + g.count, 0)} lançamento(s)</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Resultado Líquido</span>
            </div>
            <p className={cn('text-2xl font-display font-bold', resultado >= 0 ? 'text-success' : 'text-destructive')}>
              {formatCurrency(resultado)}
            </p>
          </div>
        </div>

        {/* On-screen tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionTable title="Receitas" groups={receitas.groups} total={receitas.total} accent="success" />
          <SectionTable title="Despesas" groups={despesas.groups} total={despesas.total} accent="destructive" />
        </div>

        {/* Printable version (hidden on screen) */}
        <div className="hidden">
          <div ref={printRef} className="bg-white text-black p-8 w-[210mm]">
            <style>{`@media print { @page { size: A4; margin: 15mm; } .no-print { display: none !important; } }`}</style>
            <div className="border-b-2 border-gray-800 pb-3 mb-4 text-center">
              <h1 className="text-xl font-bold">Balancete de Contas</h1>
              <p className="text-xs mt-1">Período: {periodoLabel}</p>
              <p className="text-xs">
                Regime: {regime === 'caixa' ? 'Caixa (Pagamento)' : 'Competência (Vencimento)'} • Status:{' '}
                {statusFilter === 'all' ? 'Todos' : statusFilter === 'paid' ? 'Pagos/Recebidos' : 'Pendentes'}
              </p>
              <p className="text-xs">Gerado em {formatDate(new Date())}</p>
            </div>

            <PrintableSection title="RECEITAS" groups={receitas.groups} total={receitas.total} headerBg="#0f766e" />
            <div className="h-4" />
            <PrintableSection title="DESPESAS" groups={despesas.groups} total={despesas.total} headerBg="#be2828" />

            <div className="mt-6 border-t-2 border-gray-800 pt-3">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 font-semibold">(+) Total de Receitas</td>
                    <td className="py-1 text-right font-mono">{formatCurrency(receitas.total)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">(−) Total de Despesas</td>
                    <td className="py-1 text-right font-mono">{formatCurrency(despesas.total)}</td>
                  </tr>
                  <tr className="border-t border-gray-800">
                    <td className="py-2 font-bold text-base">(=) Resultado Líquido</td>
                    <td className="py-2 text-right font-mono font-bold text-base">{formatCurrency(resultado)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

interface Group {
  category: string;
  label: string;
  items: Account[];
  total: number;
  count: number;
}

function SectionTable({ title, groups, total, accent }: { title: string; groups: Group[]; total: number; accent: 'success' | 'destructive' }) {
  return (
    <div className="glass-card p-6">
      <h3 className={cn('font-display font-semibold text-lg mb-4', accent === 'success' ? 'text-success' : 'text-destructive')}>
        {title}
      </h3>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Nenhum lançamento no período</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-center w-20">Qtd.</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => (
              <TableRow key={g.category}>
                <TableCell>{g.label}</TableCell>
                <TableCell className="text-center">{g.count}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(g.total)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 font-bold">
              <TableCell>TOTAL</TableCell>
              <TableCell className="text-center">{groups.reduce((s, g) => s + g.count, 0)}</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(total)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function PrintableSection({ title, groups, total, headerBg }: { title: string; groups: Group[]; total: number; headerBg: string }) {
  return (
    <div>
      <div style={{ backgroundColor: headerBg }} className="text-white font-bold px-3 py-1 text-sm">
        {title}
      </div>
      <table className="w-full text-xs border border-gray-300 border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1 text-left">Categoria</th>
            <th className="border border-gray-300 px-2 py-1 text-center w-16">Qtd.</th>
            <th className="border border-gray-300 px-2 py-1 text-right w-32">Valor (R$)</th>
          </tr>
        </thead>
        <tbody>
          {groups.length === 0 ? (
            <tr>
              <td colSpan={3} className="border border-gray-300 px-2 py-3 text-center text-gray-500">
                Nenhum lançamento
              </td>
            </tr>
          ) : (
            groups.map((g) => (
              <tr key={g.category}>
                <td className="border border-gray-300 px-2 py-1">{g.label}</td>
                <td className="border border-gray-300 px-2 py-1 text-center">{g.count}</td>
                <td className="border border-gray-300 px-2 py-1 text-right font-mono">{formatCurrency(g.total)}</td>
              </tr>
            ))
          )}
          <tr className="bg-gray-200 font-bold">
            <td className="border border-gray-300 px-2 py-1">TOTAL</td>
            <td className="border border-gray-300 px-2 py-1 text-center">{groups.reduce((s, g) => s + g.count, 0)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right font-mono">{formatCurrency(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default ReportBalancete;
