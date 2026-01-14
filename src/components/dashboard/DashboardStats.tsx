import { useFinancialStore } from '@/store/financialStore';
import { StatCard } from './StatCard';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight 
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export function DashboardStats() {
  const getSummary = useFinancialStore((state) => state.getSummary);
  const summary = getSummary();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="A Receber"
        value={formatCurrency(summary.totalReceivable)}
        subtitle={`${formatCurrency(summary.overdueReceivable)} em atraso`}
        icon={TrendingUp}
        variant="income"
      />
      <StatCard
        title="A Pagar"
        value={formatCurrency(summary.totalPayable)}
        subtitle={`${formatCurrency(summary.overduePayable)} em atraso`}
        icon={TrendingDown}
        variant="expense"
      />
      <StatCard
        title="Recebido no Mês"
        value={formatCurrency(summary.receivedThisMonth)}
        icon={ArrowUpRight}
        variant="income"
      />
      <StatCard
        title="Pago no Mês"
        value={formatCurrency(summary.paidThisMonth)}
        icon={ArrowDownRight}
        variant="expense"
      />
    </div>
  );
}
