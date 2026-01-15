import { useState, useRef, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { MainLayout } from '@/components/layout/MainLayout';
import { useFinancialStore } from '@/store/financialStore';
import { PrintableReport } from '@/components/reports/PrintableReport';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CheckCircle } from 'lucide-react';
import { exportToPdf } from '@/lib/exportPdf';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const ReportReceivables = () => {
  const accounts = useFinancialStore((state) => state.accounts);
  const [sortBy, setSortBy] = useState<'dueDate' | 'name' | 'description' | 'amount'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState('pending');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  
  const pendingReportRef = useRef<HTMLDivElement>(null);
  const receivedReportRef = useRef<HTMLDivElement>(null);

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

  const pendingReceivables = useMemo(() => 
    filterByDate(accounts.filter(
      (a) => a.type === 'receivable' && (a.status === 'pending' || a.status === 'overdue')
    )),
    [accounts, startDate, endDate]
  );
  
  const receivedReceivables = useMemo(() => 
    filterByDate(accounts.filter(
      (a) => a.type === 'receivable' && a.status === 'paid'
    )),
    [accounts, startDate, endDate]
  );

  const handlePrintPending = useReactToPrint({
    contentRef: pendingReportRef,
    documentTitle: 'Relatorio_Contas_A_Receber',
  });

  const handlePrintReceived = useReactToPrint({
    contentRef: receivedReportRef,
    documentTitle: 'Relatorio_Contas_Recebidas',
  });

  const handleExportPendingPdf = () => {
    exportToPdf({
      title: 'Relatório de Contas a Receber',
      accounts: pendingReceivables,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      filename: 'Relatorio_Contas_A_Receber',
    });
  };

  const handleExportReceivedPdf = () => {
    exportToPdf({
      title: 'Relatório de Contas Recebidas',
      accounts: receivedReceivables,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      filename: 'Relatorio_Contas_Recebidas',
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Relatórios de Contas a Receber
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize, filtre e exporte relatórios detalhados
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Contas a Receber ({pendingReceivables.length})
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Contas Recebidas ({receivedReceivables.length})
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
                title="Relatório de Contas a Receber"
                accounts={pendingReceivables}
                sortBy={sortBy}
                sortOrder={sortOrder}
                startDate={startDate}
                endDate={endDate}
              />
            </div>
          </TabsContent>

          <TabsContent value="received" className="space-y-6">
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
                onPrint={() => handlePrintReceived()}
                onExportPdf={handleExportReceivedPdf}
              />
            </div>
            
            <div className="overflow-auto border border-border rounded-lg">
              <PrintableReport
                ref={receivedReportRef}
                title="Relatório de Contas Recebidas"
                accounts={receivedReceivables}
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

export default ReportReceivables;
