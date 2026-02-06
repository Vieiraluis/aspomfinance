import { useState, useRef, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAccounts } from '@/hooks/useSupabaseData';
import { PrintableReport } from '@/components/reports/PrintableReport';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CheckCircle, Loader2 } from 'lucide-react';
import { exportToPdf } from '@/lib/exportPdf';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const ReportPayables = () => {
  const { data: accounts = [], isLoading } = useAccounts();
  const [sortBy, setSortBy] = useState<'dueDate' | 'name' | 'description' | 'amount'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState('pending');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  
  const pendingReportRef = useRef<HTMLDivElement>(null);
  const paidReportRef = useRef<HTMLDivElement>(null);

  const filterByDate = (accountList: typeof accounts) => {
    if (!startDate && !endDate) return accountList;
    
    return accountList.filter((a) => {
      const dueDate = new Date(a.dueDate);
      
      if (startDate && endDate) {
        return isWithinInterval(dueDate, { 
          start: startOfDay(startDate), 
          end: endOfDay(endDate) 
        });
      }
      
      if (startDate) {
        return dueDate >= startOfDay(startDate);
      }
      
      if (endDate) {
        return dueDate <= endOfDay(endDate);
      }
      
      return true;
    });
  };

  const pendingPayables = useMemo(() => 
    filterByDate(accounts.filter(
      (a) => a.type === 'payable' && (a.status === 'pending' || a.status === 'overdue')
    )),
    [accounts, startDate, endDate]
  );
  
  const paidPayables = useMemo(() => 
    filterByDate(accounts.filter(
      (a) => a.type === 'payable' && a.status === 'paid'
    )),
    [accounts, startDate, endDate]
  );

  const handlePrintPending = useReactToPrint({
    contentRef: pendingReportRef,
    documentTitle: 'Relatorio_Contas_A_Pagar',
  });

  const handlePrintPaid = useReactToPrint({
    contentRef: paidReportRef,
    documentTitle: 'Relatorio_Contas_Pagas',
  });

  const handleExportPendingPdf = () => {
    exportToPdf({
      title: 'Relatório de Contas a Pagar',
      accounts: pendingPayables,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      filename: 'Relatorio_Contas_A_Pagar',
    });
  };

  const handleExportPaidPdf = () => {
    exportToPdf({
      title: 'Relatório de Contas Pagas',
      accounts: paidPayables,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      filename: 'Relatorio_Contas_Pagas',
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
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Relatórios de Contas a Pagar
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize, filtre e exporte relatórios detalhados
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Contas a Pagar ({pendingPayables.length})
            </TabsTrigger>
            <TabsTrigger value="paid" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Contas Pagas ({paidPayables.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <div className="glass-card p-4">
              <ReportFilters
                sortBy={sortBy}
                sortOrder={sortOrder}
                startDate={startDate}
                endDate={endDate}
                onSortByChange={setSortBy}
                onSortOrderChange={setSortOrder}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onPrint={() => handlePrintPending()}
                onExportPdf={handleExportPendingPdf}
              />
            </div>
            
            <div className="overflow-auto border border-border rounded-lg">
              <PrintableReport
                ref={pendingReportRef}
                title="Relatório de Contas a Pagar"
                accounts={pendingPayables}
                sortBy={sortBy}
                sortOrder={sortOrder}
                startDate={startDate}
                endDate={endDate}
              />
            </div>
          </TabsContent>

          <TabsContent value="paid" className="space-y-6">
            <div className="glass-card p-4">
              <ReportFilters
                sortBy={sortBy}
                sortOrder={sortOrder}
                startDate={startDate}
                endDate={endDate}
                onSortByChange={setSortBy}
                onSortOrderChange={setSortOrder}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onPrint={() => handlePrintPaid()}
                onExportPdf={handleExportPaidPdf}
              />
            </div>
            
            <div className="overflow-auto border border-border rounded-lg">
              <PrintableReport
                ref={paidReportRef}
                title="Relatório de Contas Pagas"
                accounts={paidPayables}
                sortBy={sortBy}
                sortOrder={sortOrder}
                startDate={startDate}
                endDate={endDate}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ReportPayables;
