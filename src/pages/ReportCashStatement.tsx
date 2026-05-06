import { useState, useRef, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAccounts, useBankAccounts } from '@/hooks/useSupabaseData';
import { formatCurrency, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, FileDown, Printer, Loader2, X, ChevronsUpDown, Check } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Account, BankAccount } from '@/types/financial';

interface Transaction {
  date: Date;
  description: string;
  amount: number;
  type: 'in' | 'out';
}

interface AccountGroup {
  bankAccount: BankAccount | { id: string; name: string; initialBalance: number };
  previousBalance: number;
  transactions: Transaction[];
  entries: number;
  exits: number;
  finalBalance: number;
}

const ReportCashStatement = () => {
  const { data: accounts = [], isLoading: loadingAcc } = useAccounts();
  const { data: bankAccounts = [], isLoading: loadingBank } = useBankAccounts();
  const printRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(today));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(today));
  const [selectedBankIds, setSelectedBankIds] = useState<string[] | null>(null); // null = all
  const [includeNoBank, setIncludeNoBank] = useState<boolean>(true);

  const groups = useMemo<AccountGroup[]>(() => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(23, 59, 59, 999);

    const paid = accounts.filter((a) => a.status === 'paid' && a.paidAt);

    const banksToShow = selectedBankIds === null
      ? bankAccounts.filter(b => b.isActive)
      : bankAccounts.filter(b => b.isActive && selectedBankIds.includes(b.id));

    const result: AccountGroup[] = banksToShow.map((bank) => {
      const accountTxs = paid.filter((a) => a.bankAccountId === bank.id);

      // previous balance: initial + signed (receivable - payable) before start
      const prevSigned = accountTxs
        .filter((a) => a.paidAt && isBefore(new Date(a.paidAt), start))
        .reduce((sum, a) => sum + (a.type === 'receivable' ? a.amount : -a.amount), 0);
      const previousBalance = bank.initialBalance + prevSigned;

      const inRange = accountTxs.filter((a) =>
        a.paidAt && isWithinInterval(new Date(a.paidAt), { start, end })
      );

      const txs: Transaction[] = inRange.map((a) => ({
        date: new Date(a.paidAt!),
        description: a.description + (a.supplierName ? ` — ${a.supplierName}` : ''),
        amount: a.amount,
        type: (a.type === 'receivable' ? 'in' : 'out') as 'in' | 'out',
      })).sort((x, y) => x.date.getTime() - y.date.getTime());

      const entries = txs.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
      const exits = txs.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);

      return {
        bankAccount: bank,
        previousBalance,
        transactions: txs,
        entries,
        exits,
        finalBalance: previousBalance + entries - exits,
      };
    });

    // Also include "Sem conta vinculada" group if showing all
    if (selectedBank === 'all') {
      const noBank = paid.filter((a) => !a.bankAccountId);
      if (noBank.length > 0) {
        const prevSigned = noBank
          .filter((a) => a.paidAt && isBefore(new Date(a.paidAt), start))
          .reduce((s, a) => s + (a.type === 'receivable' ? a.amount : -a.amount), 0);
        const inRange = noBank.filter((a) =>
          a.paidAt && isWithinInterval(new Date(a.paidAt), { start, end })
        );
        const txs: Transaction[] = inRange.map((a) => ({
          date: new Date(a.paidAt!),
          description: a.description + (a.supplierName ? ` — ${a.supplierName}` : ''),
          amount: a.amount,
          type: (a.type === 'receivable' ? 'in' : 'out') as 'in' | 'out',
        })).sort((x, y) => x.date.getTime() - y.date.getTime());
        const entries = txs.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
        const exits = txs.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);
        if (txs.length > 0 || prevSigned !== 0) {
          result.push({
            bankAccount: { id: 'no-bank', name: 'Sem conta vinculada', initialBalance: 0 },
            previousBalance: prevSigned,
            transactions: txs,
            entries,
            exits,
            finalBalance: prevSigned + entries - exits,
          });
        }
      }
    }

    return result;
  }, [accounts, bankAccounts, startDate, endDate, selectedBank]);

  const totals = useMemo(() => ({
    previous: groups.reduce((s, g) => s + g.previousBalance, 0),
    entries: groups.reduce((s, g) => s + g.entries, 0),
    exits: groups.reduce((s, g) => s + g.exits, 0),
    final: groups.reduce((s, g) => s + g.finalBalance, 0),
  }), [groups]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Extrato de Entradas e Saídas',
  });

  const handleExportPdf = () => {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Extrato de Entradas e Saídas', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const periodText = startDate && endDate
      ? `Período: ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`
      : 'Todos os registros';
    doc.text(periodText, pageWidth / 2, 21, { align: 'center' });
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, 26, { align: 'center' });

    let y = 34;

    groups.forEach((g) => {
      if (y > 250) { doc.addPage(); y = 15; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setFillColor(30, 41, 59);
      doc.setTextColor(255, 255, 255);
      doc.rect(14, y - 4, pageWidth - 28, 6, 'F');
      doc.text(`${g.bankAccount.name}`, 16, y);
      doc.text(`Saldo Anterior: ${formatCurrency(g.previousBalance)}`, pageWidth - 16, y, { align: 'right' });
      y += 4;

      const body = g.transactions.map((t) => [
        format(t.date, 'dd/MM/yyyy'),
        t.description.length > 70 ? t.description.substring(0, 70) + '…' : t.description,
        (t.type === 'in' ? '+ ' : '- ') + formatCurrency(t.amount),
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Data', 'Descrição', 'Valor']],
        body: body.length > 0 ? body : [['', 'Sem movimentos no período', '']],
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 115 },
          2: { cellWidth: 42, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
        theme: 'grid',
      });

      y = (doc as any).lastAutoTable.finalY + 2;
      doc.setTextColor(33, 33, 33);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(
        `Entradas: ${formatCurrency(g.entries)}   Saídas: ${formatCurrency(g.exits)}   Saldo Final: ${formatCurrency(g.finalBalance)}`,
        pageWidth - 16, y + 4, { align: 'right' }
      );
      y += 10;
    });

    if (y > 260) { doc.addPage(); y = 15; }
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageWidth - 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAIS GERAIS', 16, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Saldo Anterior: ${formatCurrency(totals.previous)}`, 16, y);
    doc.text(`Entradas: ${formatCurrency(totals.entries)}`, 80, y);
    doc.text(`Saídas: ${formatCurrency(totals.exits)}`, 130, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`Saldo Final: ${formatCurrency(totals.final)}`, pageWidth - 16, y, { align: 'right' });

    doc.save('extrato-entradas-saidas.pdf');
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
              Extrato de Entradas e Saídas
            </h1>
            <p className="text-sm text-muted-foreground">
              Lançamentos agrupados por conta, com saldos por período
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
            <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Contas</SelectItem>
                {bankAccounts.filter(b => b.isActive).map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <h2 className="text-xl font-bold">Extrato de Entradas e Saídas</h2>
            <p className="text-xs text-gray-600 mt-1">
              {startDate && endDate
                ? `Período: ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`
                : 'Todos os registros'}
            </p>
            <p className="text-[10px] text-gray-500">Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
          </div>

          {groups.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">Nenhuma conta para exibir.</div>
          ) : (
            <div className="space-y-5">
              {groups.map((g) => (
                <section key={g.bankAccount.id} className="break-inside-avoid">
                  <header className="flex items-center justify-between bg-slate-800 text-white px-3 py-1.5 text-xs font-semibold rounded-t">
                    <span>🏦 {g.bankAccount.name}</span>
                    <span>Saldo Anterior: {formatCurrency(g.previousBalance)}</span>
                  </header>
                  <table className="w-full border border-gray-300 text-[11px]">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-2 py-1 text-left w-[90px]">Data</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Descrição</th>
                        <th className="border border-gray-300 px-2 py-1 text-right w-[110px]">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="border border-gray-300 px-2 py-2 text-center text-gray-400 italic">
                            Sem movimentos no período
                          </td>
                        </tr>
                      ) : g.transactions.map((t, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-1">{formatDate(t.date)}</td>
                          <td className="border border-gray-300 px-2 py-1">{t.description}</td>
                          <td className={cn(
                            'border border-gray-300 px-2 py-1 text-right font-mono',
                            t.type === 'in' ? 'text-emerald-700' : 'text-red-700'
                          )}>
                            {t.type === 'in' ? '+' : '−'} {formatCurrency(t.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan={2} className="border border-gray-300 px-2 py-1 text-right">
                          Entradas: <span className="text-emerald-700">{formatCurrency(g.entries)}</span>
                          {' · '}Saídas: <span className="text-red-700">{formatCurrency(g.exits)}</span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-right font-mono">
                          Saldo Final: {formatCurrency(g.finalBalance)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </section>
              ))}

              {/* Totals */}
              <section className="break-inside-avoid mt-4 border-t-2 border-gray-800 pt-3">
                <h3 className="text-sm font-bold mb-2">Totais Gerais</h3>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-gray-50 border border-gray-300 p-2 rounded">
                    <div className="text-gray-500">Saldo Anterior</div>
                    <div className="font-bold font-mono">{formatCurrency(totals.previous)}</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-2 rounded">
                    <div className="text-emerald-700">Entradas</div>
                    <div className="font-bold font-mono text-emerald-700">{formatCurrency(totals.entries)}</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 p-2 rounded">
                    <div className="text-red-700">Saídas</div>
                    <div className="font-bold font-mono text-red-700">{formatCurrency(totals.exits)}</div>
                  </div>
                  <div className="bg-slate-800 text-white p-2 rounded">
                    <div className="text-slate-200">Saldo Final</div>
                    <div className="font-bold font-mono">{formatCurrency(totals.final)}</div>
                  </div>
                </div>
              </section>
            </div>
          )}

          <div className="mt-6 pt-2 border-t border-gray-300 text-[10px] text-gray-500 text-center">
            Sistema de Gestão Financeira • Relatório gerado automaticamente
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ReportCashStatement;
