import { useState, useRef, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAccounts, useBankAccounts } from '@/hooks/useSupabaseData';
import { formatCurrency, formatDate } from '@/lib/format';
import { sumMoney, addMoney, subMoney, roundMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CalendarIcon, FileDown, Printer, Loader2, X, ChevronsUpDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Line {
  date: Date;
  description: string;
  amount: number;
  type: 'in' | 'out';
  balance: number; // running balance after applying this line
}

const ReportBalanceteMovimento = () => {
  const { data: accounts = [], isLoading: loadingAcc } = useAccounts();
  const { data: bankAccounts = [], isLoading: loadingBank } = useBankAccounts();
  const printRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(today));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(today));
  const [selectedBankIds, setSelectedBankIds] = useState<string[] | null>(null);
  const [includeNoBank, setIncludeNoBank] = useState<boolean>(true);
  const [includePreviousBalance, setIncludePreviousBalance] = useState<boolean>(true);

  const { previousBalance, receitas, despesas, totalReceitas, totalDespesas, resultado, saldoFinal } = useMemo(() => {
    const empty = {
      previousBalance: 0,
      receitas: [] as Line[],
      despesas: [] as Line[],
      totalReceitas: 0,
      totalDespesas: 0,
      resultado: 0,
      saldoFinal: 0,
    };
    if (!startDate || !endDate) return empty;

    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(23, 59, 59, 999);

    const paid = accounts.filter((a) => a.status === 'paid' && a.paidAt);

    // Filter by selected banks / no-bank
    const passesBankFilter = (bankId?: string) => {
      if (!bankId) return includeNoBank;
      if (selectedBankIds === null) return true;
      return selectedBankIds.includes(bankId);
    };
    const scoped = paid.filter((a) => passesBankFilter(a.bankAccountId));

    // Previous balance: bank initial balances (of considered banks) + signed net before start
    const banksToConsider = selectedBankIds === null
      ? bankAccounts.filter((b) => b.isActive)
      : bankAccounts.filter((b) => b.isActive && selectedBankIds.includes(b.id));
    const banksInitial = sumMoney(banksToConsider, (b) => b.initialBalance);

    const before = scoped.filter((a) => a.paidAt && isBefore(new Date(a.paidAt), start));
    const prevIn = sumMoney(before.filter((a) => a.type === 'receivable'), (a) => a.amount);
    const prevOut = sumMoney(before.filter((a) => a.type === 'payable'), (a) => a.amount);
    const previousBalance = includePreviousBalance
      ? addMoney(banksInitial, subMoney(prevIn, prevOut))
      : 0;

    const inRange = scoped.filter((a) =>
      a.paidAt && isWithinInterval(new Date(a.paidAt), { start, end })
    );

    const receitasSrc = inRange
      .filter((a) => a.type === 'receivable')
      .sort((x, y) => new Date(x.paidAt!).getTime() - new Date(y.paidAt!).getTime());
    const despesasSrc = inRange
      .filter((a) => a.type === 'payable')
      .sort((x, y) => new Date(x.paidAt!).getTime() - new Date(y.paidAt!).getTime());

    let running = previousBalance;
    const receitas: Line[] = receitasSrc.map((a) => {
      running = addMoney(running, a.amount);
      return {
        date: new Date(a.paidAt!),
        description: a.description + (a.supplierName ? ` — ${a.supplierName}` : ''),
        amount: roundMoney(a.amount),
        type: 'in',
        balance: running,
      };
    });
    const despesas: Line[] = despesasSrc.map((a) => {
      running = subMoney(running, a.amount);
      return {
        date: new Date(a.paidAt!),
        description: a.description + (a.supplierName ? ` — ${a.supplierName}` : ''),
        amount: roundMoney(a.amount),
        type: 'out',
        balance: running,
      };
    });

    const totalReceitas = sumMoney(receitas, (l) => l.amount);
    const totalDespesas = sumMoney(despesas, (l) => l.amount);
    const resultado = subMoney(totalReceitas, totalDespesas);
    const saldoFinal = addMoney(previousBalance, resultado);

    return { previousBalance, receitas, despesas, totalReceitas, totalDespesas, resultado, saldoFinal };
  }, [accounts, bankAccounts, startDate, endDate, selectedBankIds, includeNoBank, includePreviousBalance]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Balancete de Movimento',
  });

  const handleExportPdf = () => {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Balancete de Movimento', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const periodText = startDate && endDate
      ? `Período: ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`
      : 'Todos os registros';
    doc.text(periodText, pageWidth / 2, 21, { align: 'center' });
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, 26, { align: 'center' });

    let y = 34;

    // Saldo anterior banner
    doc.setFillColor(30, 41, 59);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.rect(14, y - 4, pageWidth - 28, 6, 'F');
    doc.text('SALDO ANTERIOR', 16, y);
    doc.text(formatCurrency(previousBalance), pageWidth - 16, y, { align: 'right' });
    y += 6;

    const columnStyles = {
      0: { cellWidth: 22 },
      1: { cellWidth: 95 },
      2: { cellWidth: 30, halign: 'right' as const },
      3: { cellWidth: 35, halign: 'right' as const },
    };

    const renderSection = (title: string, lines: Line[], total: number, headColor: [number, number, number]) => {
      if (y > 250) { doc.addPage(); y = 15; }
      doc.setFillColor(...headColor);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.rect(14, y - 4, pageWidth - 28, 6, 'F');
      doc.text(title, 16, y);
      doc.text(`Subtotal: ${formatCurrency(total)}`, pageWidth - 16, y, { align: 'right' });
      y += 2;

      const body = lines.map((l) => [
        format(l.date, 'dd/MM/yyyy'),
        l.description.length > 60 ? l.description.substring(0, 60) + '…' : l.description,
        (l.type === 'in' ? '+ ' : '- ') + formatCurrency(l.amount),
        formatCurrency(l.balance),
      ]);

      autoTable(doc, {
        startY: y + 2,
        head: [['Data', 'Descrição', 'Valor', 'Saldo']],
        body: body.length > 0 ? body : [['', 'Sem movimentos no período', '', '']],
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
        columnStyles,
        margin: { left: 14, right: 14 },
        theme: 'grid',
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    };

    renderSection('RECEITAS (ENTRADAS)', receitas, totalReceitas, [16, 122, 87]);
    renderSection('DESPESAS (SAÍDAS)', despesas, totalDespesas, [190, 40, 40]);

    if (y > 250) { doc.addPage(); y = 15; }
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageWidth - 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      body: [
        ['(+) Saldo Anterior', formatCurrency(previousBalance)],
        ['(+) Total de Receitas', formatCurrency(totalReceitas)],
        ['(−) Total de Despesas', formatCurrency(totalDespesas)],
        ['(=) Resultado do Período', formatCurrency(resultado)],
        ['(=) Saldo Final', formatCurrency(saldoFinal)],
      ],
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right', fontStyle: 'bold' } },
      theme: 'grid',
      margin: { left: 14, right: 14 },
    });

    doc.save('balancete-movimento.pdf');
  };

  if (loadingAcc || loadingBank) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Balancete de Movimento
            </h1>
            <p className="text-sm text-muted-foreground">
              Receitas e despesas com saldo acumulado por linha
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-[150px] justify-start', !startDate && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'dd/MM/yyyy') : 'Início'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground text-sm">até</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-[150px] justify-start', !endDate && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'dd/MM/yyyy') : 'Fim'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            {(startDate || endDate) && (
              <Button variant="ghost" size="sm" onClick={() => { setStartDate(undefined); setEndDate(undefined); }}>
                <X className="w-4 h-4" />
              </Button>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-between">
                  <span className="truncate">
                    {selectedBankIds === null
                      ? 'Todas as Contas'
                      : selectedBankIds.length === 0
                        ? 'Nenhuma conta'
                        : selectedBankIds.length === 1
                          ? bankAccounts.find((b) => b.id === selectedBankIds[0])?.name ?? '1 conta'
                          : `${selectedBankIds.length} contas selecionadas`}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="end">
                <div className="p-2 border-b border-border flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => { setSelectedBankIds(null); setIncludeNoBank(true); }}
                  >
                    Selecionar todas
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => { setSelectedBankIds([]); setIncludeNoBank(false); }}
                  >
                    Limpar
                  </Button>
                </div>
                <div className="max-h-[260px] overflow-y-auto p-1">
                  {bankAccounts.filter((b) => b.isActive).map((b) => {
                    const checked = selectedBankIds === null || selectedBankIds.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            const allIds = bankAccounts.filter((x) => x.isActive).map((x) => x.id);
                            const current = selectedBankIds === null ? allIds : selectedBankIds;
                            const next = v
                              ? Array.from(new Set([...current, b.id]))
                              : current.filter((id) => id !== b.id);
                            setSelectedBankIds(next);
                          }}
                        />
                        <span className="truncate">{b.name}</span>
                      </label>
                    );
                  })}
                  <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm border-t border-border mt-1 pt-2">
                    <Checkbox
                      checked={includeNoBank}
                      onCheckedChange={(v) => setIncludeNoBank(!!v)}
                    />
                    <span className="truncate italic text-muted-foreground">Sem conta vinculada</span>
                  </label>
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-background">
              <Switch id="prev-balance-bm" checked={includePreviousBalance} onCheckedChange={setIncludePreviousBalance} />
              <Label htmlFor="prev-balance-bm" className="text-sm cursor-pointer">Considerar saldo anterior</Label>
            </div>
            <Button variant="outline" onClick={() => handlePrint()}>
              <Printer className="w-4 h-4 mr-2" />Imprimir
            </Button>
            <Button onClick={handleExportPdf}>
              <FileDown className="w-4 h-4 mr-2" />PDF
            </Button>
          </div>
        </div>

        {/* Printable area */}
        <div ref={printRef} className="cash-statement bg-white text-black mx-auto w-full max-w-[210mm] p-6 print:p-4 shadow-sm rounded-md">
          <style>{`
            @media print {
              @page { size: A4 portrait; margin: 12mm; }
              .no-print { display: none !important; }
              .cash-statement { box-shadow: none !important; max-width: none !important; padding: 0 !important; }
            }
          `}</style>

          <div className="border-b-2 border-gray-800 pb-3 mb-4 text-center">
            <h2 className="text-xl font-bold">Balancete de Movimento</h2>
            <p className="text-xs text-gray-600 mt-1">
              {startDate && endDate
                ? `Período: ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`
                : 'Todos os registros'}
            </p>
            <p className="text-[10px] text-gray-500">Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
          </div>

          <div className="space-y-4">
            <section className="break-inside-avoid">
              <header className="flex items-center justify-between bg-slate-800 text-white px-3 py-1.5 text-xs font-semibold rounded">
                <span>SALDO ANTERIOR</span>
                <span className="font-mono">{formatCurrency(previousBalance)}</span>
              </header>
            </section>

            <SectionBlock
              title="RECEITAS (ENTRADAS)"
              lines={receitas}
              total={totalReceitas}
              headerClass="bg-emerald-700"
            />

            <SectionBlock
              title="DESPESAS (SAÍDAS)"
              lines={despesas}
              total={totalDespesas}
              headerClass="bg-red-700"
            />

            <section className="break-inside-avoid mt-4 border-t-2 border-gray-800 pt-3">
              <h3 className="text-sm font-bold mb-2">Balancete de Fechamento</h3>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="py-1">(+) Saldo Anterior</td>
                    <td className="py-1 text-right font-mono">{formatCurrency(previousBalance)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-emerald-700">(+) Total de Receitas</td>
                    <td className="py-1 text-right font-mono text-emerald-700">{formatCurrency(totalReceitas)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-red-700">(−) Total de Despesas</td>
                    <td className="py-1 text-right font-mono text-red-700">{formatCurrency(totalDespesas)}</td>
                  </tr>
                  <tr className="border-t border-gray-400">
                    <td className="py-1 font-semibold">(=) Resultado do Período</td>
                    <td className={cn('py-1 text-right font-mono font-semibold', resultado >= 0 ? 'text-emerald-700' : 'text-red-700')}>
                      {formatCurrency(resultado)}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-gray-800 bg-slate-800 text-white">
                    <td className="py-2 px-2 font-bold">(=) SALDO FINAL</td>
                    <td className="py-2 px-2 text-right font-mono font-bold">{formatCurrency(saldoFinal)}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>

          <div className="mt-6 pt-2 border-t border-gray-300 text-[10px] text-gray-500 text-center">
            Sistema de Gestão Financeira • Relatório gerado automaticamente
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

function SectionBlock({
  title,
  lines,
  total,
  headerClass,
}: {
  title: string;
  lines: Line[];
  total: number;
  headerClass: string;
}) {
  return (
    <section className="break-inside-avoid">
      <header className={cn('flex items-center justify-between text-white px-3 py-1.5 text-xs font-semibold rounded-t', headerClass)}>
        <span>{title}</span>
        <span className="font-mono">Subtotal: {formatCurrency(total)}</span>
      </header>
      <table className="w-full border border-gray-300 text-[11px]">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-2 py-1 text-left w-[90px]">Data</th>
            <th className="border border-gray-300 px-2 py-1 text-left">Descrição</th>
            <th className="border border-gray-300 px-2 py-1 text-right w-[110px]">Valor</th>
            <th className="border border-gray-300 px-2 py-1 text-right w-[120px]">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={4} className="border border-gray-300 px-2 py-2 text-center text-gray-400 italic">
                Sem movimentos no período
              </td>
            </tr>
          ) : (
            lines.map((l, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-2 py-1">{formatDate(l.date)}</td>
                <td className="border border-gray-300 px-2 py-1">{l.description}</td>
                <td className={cn(
                  'border border-gray-300 px-2 py-1 text-right font-mono',
                  l.type === 'in' ? 'text-emerald-700' : 'text-red-700'
                )}>
                  {l.type === 'in' ? '+' : '−'} {formatCurrency(l.amount)}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-right font-mono">
                  {formatCurrency(l.balance)}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold">
            <td colSpan={2} className="border border-gray-300 px-2 py-1 text-right">Subtotal</td>
            <td className="border border-gray-300 px-2 py-1 text-right font-mono" colSpan={2}>
              {formatCurrency(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}

export default ReportBalanceteMovimento;
