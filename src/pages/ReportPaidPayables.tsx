import { useState, useRef, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { MainLayout } from '@/components/layout/MainLayout';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { PrintableReport } from '@/components/reports/PrintableReport';
import { useFinancialStore } from '@/store/financialStore';
import { exportToPdf } from '@/lib/exportPdf';
import { format } from 'date-fns';

const ReportPaidPayables = () => {
  const { accounts } = useFinancialStore();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [sortBy, setSortBy] = useState<'dueDate' | 'name' | 'description' | 'amount'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Filter paid payables by payment date (paidAt)
  const paidPayables = useMemo(() => {
    return accounts.filter(a => {
      if (a.type !== 'payable' || a.status !== 'paid' || !a.paidAt) return false;
      
      const paidAtDate = new Date(a.paidAt);
      
      if (startDate && endDate) {
        return paidAtDate >= startDate && paidAtDate <= endDate;
      }
      if (startDate) {
        return paidAtDate >= startDate;
      }
      if (endDate) {
        return paidAtDate <= endDate;
      }
      return true;
    });
  }, [accounts, startDate, endDate]);

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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Relatório de Contas Pagas</h1>
          <p className="text-muted-foreground">
            Contas a pagar que foram baixadas, filtradas por data de baixa
          </p>
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
        />

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
      </div>
    </MainLayout>
  );
};

export default ReportPaidPayables;
