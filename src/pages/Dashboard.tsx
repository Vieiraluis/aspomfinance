import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { UpcomingAccounts } from '@/components/dashboard/UpcomingAccounts';
import { BalanceChart } from '@/components/dashboard/BalanceChart';
import { useFinancialStore } from '@/store/financialStore';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard = () => {
  const updateOverdueStatus = useFinancialStore((state) => state.updateOverdueStatus);
  
  useEffect(() => {
    updateOverdueStatus();
  }, [updateOverdueStatus]);
  
  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Visão geral das suas finanças
            </p>
          </div>
          <div className="flex items-center gap-2 glass-card px-4 py-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
        </div>
        
        {/* Stats */}
        <DashboardStats />
        
        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingAccounts />
          <BalanceChart />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
