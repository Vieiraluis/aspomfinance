import { useState, useRef, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { MainLayout } from '@/components/layout/MainLayout';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { PrintableReport } from '@/components/reports/PrintableReport';
import { useAccounts, useBankAccounts } from '@/hooks/useSupabaseData';
import { exportToPdf } from '@/lib/exportPdf';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Receipt, Loader2 } from 'lucide-react';
import { ReceiptDialog } from '@/components/receipts/ReceiptDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/format';

const ReportPaidPayables = () => {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: bankAccounts = [] } = useBankAccounts();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [sortBy, setSortBy] = useState<'dueDate' | 'name' | 'description' | 'amount'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('all');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);

  const getBankAccountName = (bankAccountId?: string) => {
    if (!bankAccountId) return '-';
    return bankAccounts.find(ba => ba.id === bankAccountId)?.name || '-';
  };

  // Filter paid payables by payment date (paidAt) and bank account
  const paidPayables = useMemo(() => {
    return accounts.filter(a => {
      if (a.type !== 'payable' || a.status !== 'paid' || !a.paidAt) return false;
      
      const paidAtDate = new Date(a.paidAt);
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (paidAtDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (paidAtDate > end) return false;
      }
      
      if (selectedBankAccountId !== 'all' && a.bankAccountId !== selectedBankAccountId) return false;
      
      return true;
    });
  }, [accounts, startDate, endDate, selectedBankAccountId]);

  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAccounts.length === paidPayables.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(paidPayables.map(a => a.id));
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Contas Pagas - ${format(new Date(), 'dd-MM-yyyy')}`,
  });

  const handleExportPdf = () => {
    exportToPdf({
      title: 'Relatório de Contas Pagas',
      accounts: paidPayables,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      filename: `contas-pagas-${format(new Date(), 'dd-MM-yyyy')}`,
      dateField: 'paidAt',
    });
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Relatório de Contas Pagas</h1>
            <p className="text-muted-foreground">
              Contas a pagar que foram baixadas, filtradas por data de baixa
            </p>
          </div>
          
          {paidPayables.length > 0 && (
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setIsReceiptDialogOpen(true)}
              disabled={selectedAccounts.length === 0}
            >
              <Receipt className="w-4 h-4" />
              Gerar Recibos ({selectedAccounts.length})
            </Button>
          )}
        </div>

        <ReportFilters
          sortBy={sortBy}
          sortOrder={sortOrder}
          startDate={startDate}
          endDate={endDate}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onPrint={handlePrint}
          onExportPdf={handleExportPdf}
          dateLabel="Data de Baixa:"
          bankAccounts={bankAccounts}
          selectedBankAccountId={selectedBankAccountId}
          onBankAccountChange={setSelectedBankAccountId}
        />

        {/* Selection Table */}
        {paidPayables.length > 0 && (
          <div className="glass-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={selectedAccounts.length === paidPayables.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Data Baixa</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Conta Bancária</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidPayables.map(account => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedAccounts.includes(account.id)}
                        onCheckedChange={() => toggleAccountSelection(account.id)}
                      />
                    </TableCell>
                    <TableCell>{account.paidAt ? formatDate(account.paidAt) : '-'}</TableCell>
                    <TableCell>{account.supplierName || '-'}</TableCell>
                    <TableCell>{account.description}</TableCell>
                    <TableCell>{getBankAccountName(account.bankAccountId)}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      {formatCurrency(account.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <PrintableReport
          ref={printRef}
          title="Relatório de Contas Pagas"
          accounts={paidPayables}
          sortBy={sortBy}
          sortOrder={sortOrder}
          startDate={startDate}
          endDate={endDate}
          dateField="paidAt"
          dateColumnLabel="Data Baixa"
        />
        
        <ReceiptDialog
          open={isReceiptDialogOpen}
          onOpenChange={(open) => {
            setIsReceiptDialogOpen(open);
            if (!open) setSelectedAccounts([]);
          }}
          accounts={accounts.filter(a => selectedAccounts.includes(a.id))}
          mode="batch"
        />
      </div>
    </MainLayout>
  );
};

export default ReportPaidPayables;
