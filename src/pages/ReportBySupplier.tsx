import { useState, useRef, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAccounts, useSuppliers, useBankAccounts } from '@/hooks/useSupabaseData';
import { exportToPdf } from '@/lib/exportPdf';
import { formatCurrency, formatDate } from '@/lib/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, FileSpreadsheet, FileText, Printer, Loader2, TrendingUp, TrendingDown, BarChart3, Hash, Search, X } from 'lucide-react';
import { paymentMethodLabels } from '@/types/financial';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 20;

const ReportBySupplier = () => {
  const { data: accounts = [], isLoading: loadingAccounts } = useAccounts();
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers();
  const { data: bankAccounts = [] } = useBankAccounts();
  const printRef = useRef<HTMLDivElement>(null);

  const [searchText, setSearchText] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateField, setDateField] = useState<'dueDate' | 'paidAt'>('dueDate');
  const [currentPage, setCurrentPage] = useState(1);

  const isLoading = loadingAccounts || loadingSuppliers;

  // Match suppliers by search text (name or document/CPF/CNPJ)
  const matchedSupplierIds = useMemo(() => {
    if (!searchText.trim()) return null; // null = no text filter
    const term = searchText.toLowerCase().replace(/[.\-\/]/g, '');
    return suppliers
      .filter(s => {
        const nameMatch = s.name.toLowerCase().includes(term);
        const docNormalized = (s.document || '').replace(/[.\-\/]/g, '').toLowerCase();
        const docMatch = docNormalized.includes(term);
        return nameMatch || docMatch;
      })
      .map(s => s.id);
  }, [searchText, suppliers]);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => {
      // Text search filter (by supplier name/doc)
      if (matchedSupplierIds !== null) {
        if (!a.supplierId || !matchedSupplierIds.includes(a.supplierId)) {
          // Also check supplierName directly
          const term = searchText.toLowerCase().replace(/[.\-\/]/g, '');
          const nameMatch = a.supplierName && a.supplierName.toLowerCase().includes(term);
          if (!nameMatch) return false;
        }
      }

      // Dropdown supplier filter
      if (selectedSupplierId !== 'all' && a.supplierId !== selectedSupplierId) return false;

      // Status filter
      if (statusFilter === 'paid' && a.status !== 'paid') return false;
      if (statusFilter === 'pending' && a.status !== 'pending' && a.status !== 'overdue') return false;

      // Date filter
      const dateValue = dateField === 'paidAt' && a.paidAt ? new Date(a.paidAt) : new Date(a.dueDate);
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        if (dateValue < s) return false;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        if (dateValue > e) return false;
      }

      return true;
    });
  }, [accounts, matchedSupplierIds, searchText, selectedSupplierId, startDate, endDate, statusFilter, dateField]);

  // Sorted (newest first)
  const sortedAccounts = useMemo(() => {
    return [...filteredAccounts].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [filteredAccounts]);

  // Monthly grouping
  const monthlyGroups = useMemo(() => {
    const groups: Record<string, typeof sortedAccounts> = {};
    sortedAccounts.forEach(a => {
      const key = format(new Date(a.dueDate), 'yyyy-MM');
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [sortedAccounts]);

  // Pagination
  const totalPages = Math.ceil(sortedAccounts.length / ITEMS_PER_PAGE);
  const paginatedAccounts = sortedAccounts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Summary - now includes ALL values (paid + pending)
  const summary = useMemo(() => {
    const totalReceived = filteredAccounts.filter(a => a.type === 'receivable').reduce((s, a) => s + a.amount, 0);
    const totalReceivedPaid = filteredAccounts.filter(a => a.type === 'receivable' && a.status === 'paid').reduce((s, a) => s + a.amount, 0);
    const totalPaid = filteredAccounts.filter(a => a.type === 'payable').reduce((s, a) => s + a.amount, 0);
    const totalPaidConfirmed = filteredAccounts.filter(a => a.type === 'payable' && a.status === 'paid').reduce((s, a) => s + a.amount, 0);
    const totalPending = filteredAccounts.filter(a => a.status === 'pending' || a.status === 'overdue').reduce((s, a) => s + a.amount, 0);
    return {
      totalReceived,
      totalReceivedPaid,
      totalPaid,
      totalPaidConfirmed,
      totalPending,
      balance: totalReceivedPaid - totalPaidConfirmed,
      count: filteredAccounts.length,
    };
  }, [filteredAccounts]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'paid': return 'text-success';
      case 'pending': return 'text-warning';
      case 'overdue': return 'text-destructive';
      default: return '';
    }
  };

  const handlePrint = useReactToPrint({ contentRef: printRef });

  const handleExportPdf = () => {
    exportToPdf({
      title: selectedSupplierId !== 'all'
        ? `Relatório Financeiro - ${suppliers.find(s => s.id === selectedSupplierId)?.name || ''}`
        : searchText.trim()
          ? `Relatório Financeiro - ${searchText.trim()}`
          : 'Relatório Financeiro por Cadastro',
      accounts: sortedAccounts,
      sortBy: 'dueDate',
      sortOrder: 'desc',
      startDate,
      endDate,
      filename: `relatorio-cadastro-${format(new Date(), 'yyyy-MM-dd')}`,
      dateField: 'dueDate',
      dateColumnLabel: 'Vencimento',
    });
  };

  const handleExportExcel = () => {
    const data = sortedAccounts.map(a => ({
      'Código': a.code || '-',
      'Vencimento': formatDate(a.dueDate),
      'Descrição': a.description,
      'Cadastro': a.supplierName || '-',
      'Data Baixa': a.paidAt ? formatDate(a.paidAt) : '-',
      'Valor Recebido': a.type === 'receivable' ? a.amount : 0,
      'Valor Pago': a.type === 'payable' ? a.amount : 0,
      'Status': getStatusLabel(a.status),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `relatorio-cadastro-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  // Monthly summary component (reused in screen and print)
  const MonthlySummarySection = ({ forPrint = false }: { forPrint?: boolean }) => {
    if (monthlyGroups.length === 0) return null;
    return (
      <div className={forPrint ? 'mb-4' : 'glass-card p-6'}>
        <h3 className={forPrint ? 'font-bold text-sm mb-2' : 'font-display font-semibold text-lg mb-4'}>Resumo Mensal</h3>
        <div className={forPrint ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'}>
          {monthlyGroups.map(([key, items]) => {
            const received = items.filter(a => a.type === 'receivable').reduce((s, a) => s + a.amount, 0);
            const paid = items.filter(a => a.type === 'payable').reduce((s, a) => s + a.amount, 0);
            const pending = items.filter(a => a.status === 'pending' || a.status === 'overdue').reduce((s, a) => s + a.amount, 0);
            const [y, m] = key.split('-');
            const monthLabel = format(new Date(Number(y), Number(m) - 1, 1), 'MMMM yyyy', { locale: ptBR });
            return (
              <div key={key} className={forPrint ? 'border border-gray-300 rounded p-2 text-xs' : 'border border-border rounded-lg p-3'}>
                <p className={cn('font-medium capitalize mb-2', forPrint ? 'text-xs' : 'text-sm')}>{monthLabel}</p>
                <div className={cn('flex justify-between', forPrint ? 'text-xs' : 'text-xs')}>
                  <span className={forPrint ? 'text-green-700' : 'text-success'}>Recebido: {formatCurrency(received)}</span>
                  <span className={forPrint ? 'text-red-700' : 'text-destructive'}>Pago: {formatCurrency(paid)}</span>
                </div>
                {pending > 0 && (
                  <div className={cn('mt-1', forPrint ? 'text-xs text-yellow-700' : 'text-xs text-warning')}>
                    Pendente: {formatCurrency(pending)}
                  </div>
                )}
                <div className={cn('mt-1', forPrint ? 'text-xs text-gray-500' : 'text-xs text-muted-foreground')}>{items.length} registro(s)</div>
              </div>
            );
          })}
        </div>
      </div>
    );
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

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Relatório Financeiro por Cadastro</h1>
            <p className="text-muted-foreground mt-1">Análise financeira detalhada por registro</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
              <Printer className="w-4 h-4" /> Imprimir
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPdf} className="gap-1">
              <FileText className="w-4 h-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -mx-4 md:-mx-8 px-4 md:px-8 border-b border-border/40">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search by name or CPF/CNPJ */}
            <div className="relative w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por Nome ou CPF/CNPJ..."
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-8"
              />
              {searchText && (
                <button
                  onClick={() => { setSearchText(''); setCurrentPage(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Supplier dropdown */}
            <Select value={selectedSupplierId} onValueChange={(v) => { setSelectedSupplierId(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecionar Cadastro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Cadastros</SelectItem>
                {suppliers.sort((a, b) => a.name.localeCompare(b.name)).map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date field selector */}
            <Select value={dateField} onValueChange={(v: 'dueDate' | 'paidAt') => { setDateField(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Por Vencimento</SelectItem>
                <SelectItem value="paidAt">Por Data Baixa</SelectItem>
              </SelectContent>
            </Select>

            {/* Start date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-[130px] justify-start text-left font-normal', !startDate && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'dd/MM/yyyy') : 'Data início'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={(d) => { setStartDate(d); setCurrentPage(1); }} locale={ptBR} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>

            {/* End date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-[130px] justify-start text-left font-normal', !endDate && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'dd/MM/yyyy') : 'Data fim'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={(d) => { setEndDate(d); setCurrentPage(1); }} locale={ptBR} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>

            {/* Status */}
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-sm text-muted-foreground">Total a Receber</span>
              </div>
              <p className="text-xl font-bold text-success">{formatCurrency(summary.totalReceived)}</p>
              <p className="text-xs text-muted-foreground mt-1">Confirmado: {formatCurrency(summary.totalReceivedPaid)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Total a Pagar</span>
              </div>
              <p className="text-xl font-bold text-destructive">{formatCurrency(summary.totalPaid)}</p>
              <p className="text-xs text-muted-foreground mt-1">Confirmado: {formatCurrency(summary.totalPaidConfirmed)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Saldo Confirmado</span>
              </div>
              <p className={cn('text-xl font-bold', summary.balance >= 0 ? 'text-success' : 'text-destructive')}>
                {summary.balance >= 0 ? '+' : ''}{formatCurrency(summary.balance)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <CalendarIcon className="w-4 h-4 text-warning" />
                <span className="text-sm text-muted-foreground">Pendente</span>
              </div>
              <p className="text-xl font-bold text-warning">{formatCurrency(summary.totalPending)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Registros</span>
              </div>
              <p className="text-xl font-bold text-foreground">{summary.count}</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Summary - BEFORE the table */}
        <MonthlySummarySection />

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {sortedAccounts.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Nenhum registro encontrado com os filtros selecionados.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data Baixa</TableHead>
                    <TableHead className="text-right">Recebido</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAccounts.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.code || '-'}</TableCell>
                      <TableCell>{formatDate(a.dueDate)}</TableCell>
                      <TableCell>{a.supplierName || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{a.description}</TableCell>
                      <TableCell>{a.paidAt ? formatDate(a.paidAt) : '-'}</TableCell>
                      <TableCell className="text-right text-success font-medium">
                        {a.type === 'receivable' ? formatCurrency(a.amount) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-destructive font-medium">
                        {a.type === 'payable' ? formatCurrency(a.amount) : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-sm font-medium', getStatusClass(a.status))}>
                          {getStatusLabel(a.status)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages} ({sortedAccounts.length} registros)
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Printable area (hidden) */}
        <div className="hidden">
          <div ref={printRef} className="p-8 bg-white text-black">
            <h1 className="text-xl font-bold mb-2 text-center">Relatório Financeiro por Cadastro</h1>
            {selectedSupplierId !== 'all' && (
              <p className="text-center text-sm mb-1">{suppliers.find(s => s.id === selectedSupplierId)?.name}</p>
            )}
            {searchText.trim() && (
              <p className="text-center text-sm mb-1">Pesquisa: {searchText.trim()}</p>
            )}
            <p className="text-center text-xs mb-4 text-gray-500">
              {startDate && endDate ? `Período: ${format(startDate, 'dd/MM/yyyy')} até ${format(endDate, 'dd/MM/yyyy')}` : 'Todos os registros'}
              {' • '}Gerado em: {formatDate(new Date())}
            </p>

            <div className="flex gap-8 mb-4 text-sm">
              <span>Total Recebido: <strong className="text-green-700">{formatCurrency(summary.totalReceived)}</strong></span>
              <span>Total Pago: <strong className="text-red-700">{formatCurrency(summary.totalPaid)}</strong></span>
              <span>Saldo: <strong>{formatCurrency(summary.balance)}</strong></span>
              <span>Pendente: <strong className="text-yellow-700">{formatCurrency(summary.totalPending)}</strong></span>
              <span>Registros: <strong>{summary.count}</strong></span>
            </div>

            {/* Monthly summary at top of print */}
            <MonthlySummarySection forPrint />

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-400">
                  <th className="py-1 text-left">Código</th>
                  <th className="py-1 text-left">Vencimento</th>
                  <th className="py-1 text-left">Cadastro</th>
                  <th className="py-1 text-left">Descrição</th>
                  <th className="py-1 text-left">Data Baixa</th>
                  <th className="py-1 text-right">Recebido</th>
                  <th className="py-1 text-right">Pago</th>
                  <th className="py-1 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedAccounts.map((a, i) => (
                  <tr key={a.id} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-1">{a.code || '-'}</td>
                    <td className="py-1">{formatDate(a.dueDate)}</td>
                    <td className="py-1">{a.supplierName || '-'}</td>
                    <td className="py-1">{a.description}</td>
                    <td className="py-1">{a.paidAt ? formatDate(a.paidAt) : '-'}</td>
                    <td className="py-1 text-right">{a.type === 'receivable' ? formatCurrency(a.amount) : '-'}</td>
                    <td className="py-1 text-right">{a.type === 'payable' ? formatCurrency(a.amount) : '-'}</td>
                    <td className="py-1">{getStatusLabel(a.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ReportBySupplier;
