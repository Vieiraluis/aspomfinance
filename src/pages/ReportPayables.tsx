import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { MainLayout } from '@/components/layout/MainLayout';
import { useFinancialStore } from '@/store/financialStore';
import { PrintableReport } from '@/components/reports/PrintableReport';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CheckCircle } from 'lucide-react';

const ReportPayables = () => {
  const accounts = useFinancialStore((state) => state.accounts);
  const [sortBy, setSortBy] = useState<'dueDate' | 'name' | 'description' | 'amount'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState('pending');
  
  const pendingReportRef = useRef<HTMLDivElement>(null);
  const paidReportRef = useRef<HTMLDivElement>(null);

  const pendingPayables = accounts.filter(
    (a) => a.type === 'payable' && (a.status === 'pending' || a.status === 'overdue')
  );
  
  const paidPayables = accounts.filter(
    (a) => a.type === 'payable' && a.status === 'paid'
  );

  const handlePrintPending = useReactToPrint({
    contentRef: pendingReportRef,
    documentTitle: 'Relatorio_Contas_A_Pagar',
  });

  const handlePrintPaid = useReactToPrint({
    contentRef: paidReportRef,
    documentTitle: 'Relatorio_Contas_Pagas',
  });

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Relatórios de Contas a Pagar
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize e imprima relatórios detalhados
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
                onSortByChange={setSortBy}
                onSortOrderChange={setSortOrder}
                onPrint={() => handlePrintPending()}
              />
            </div>
            
            <div className="overflow-auto border border-border rounded-lg">
              <PrintableReport
                ref={pendingReportRef}
                title="Relatório de Contas a Pagar"
                accounts={pendingPayables}
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
            </div>
          </TabsContent>

          <TabsContent value="paid" className="space-y-6">
            <div className="glass-card p-4">
              <ReportFilters
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortByChange={setSortBy}
                onSortOrderChange={setSortOrder}
                onPrint={() => handlePrintPaid()}
              />
            </div>
            
            <div className="overflow-auto border border-border rounded-lg">
              <PrintableReport
                ref={paidReportRef}
                title="Relatório de Contas Pagas"
                accounts={paidPayables}
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ReportPayables;
