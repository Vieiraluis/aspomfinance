import { MainLayout } from '@/components/layout/MainLayout';
import { useFinancialStore } from '@/store/financialStore';
import { categoryLabels, AccountCategory } from '@/types/financial';
import { formatCurrency } from '@/lib/format';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { startOfMonth, endOfMonth, subMonths, format, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

const COLORS = [
  'hsl(168, 76%, 42%)',
  'hsl(0, 72%, 51%)',
  'hsl(38, 92%, 50%)',
  'hsl(217, 91%, 60%)',
  'hsl(142, 76%, 36%)',
  'hsl(280, 65%, 60%)',
  'hsl(200, 80%, 50%)',
  'hsl(340, 82%, 52%)',
];

const Reports = () => {
  const accounts = useFinancialStore((state) => state.accounts);
  const getSummary = useFinancialStore((state) => state.getSummary);
  const summary = getSummary();
  
  // Monthly data for last 6 months
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const monthAccounts = accounts.filter((a) =>
      a.status === 'paid' &&
      a.paidAt &&
      isWithinInterval(new Date(a.paidAt), { start: monthStart, end: monthEnd })
    );
    
    const received = monthAccounts
      .filter((a) => a.type === 'receivable')
      .reduce((sum, a) => sum + a.amount, 0);
      
    const paid = monthAccounts
      .filter((a) => a.type === 'payable')
      .reduce((sum, a) => sum + a.amount, 0);
    
    return {
      month: format(date, 'MMM', { locale: ptBR }),
      received,
      paid,
    };
  });
  
  // Category breakdown for payables
  const categoryData = Object.keys(categoryLabels).map((key) => {
    const total = accounts
      .filter((a) => a.type === 'payable' && a.category === key)
      .reduce((sum, a) => sum + a.amount, 0);
    
    return {
      name: categoryLabels[key as AccountCategory],
      value: total,
    };
  }).filter((item) => item.value > 0);
  
  // Status breakdown
  const statusData = [
    {
      name: 'Pendente',
      payable: accounts.filter((a) => a.type === 'payable' && a.status === 'pending').length,
      receivable: accounts.filter((a) => a.type === 'receivable' && a.status === 'pending').length,
    },
    {
      name: 'Pago/Recebido',
      payable: accounts.filter((a) => a.type === 'payable' && a.status === 'paid').length,
      receivable: accounts.filter((a) => a.type === 'receivable' && a.status === 'paid').length,
    },
    {
      name: 'Vencido',
      payable: accounts.filter((a) => a.type === 'payable' && a.status === 'overdue').length,
      receivable: accounts.filter((a) => a.type === 'receivable' && a.status === 'overdue').length,
    },
  ];
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 text-sm">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Relatórios
            </h1>
            <p className="text-muted-foreground mt-1">
              Análise financeira detalhada
            </p>
          </div>
          <div className="flex items-center gap-2 glass-card px-4 py-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Últimos 6 meses
            </span>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <span className="text-sm text-muted-foreground">Total a Receber</span>
              </div>
              <p className="text-2xl font-display font-bold text-success">
                {formatCurrency(summary.totalReceivable)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(summary.overdueReceivable)} em atraso
              </p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-destructive" />
                <span className="text-sm text-muted-foreground">Total a Pagar</span>
              </div>
              <p className="text-2xl font-display font-bold text-destructive">
                {formatCurrency(summary.totalPayable)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(summary.overduePayable)} em atraso
              </p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Saldo Projetado</span>
              </div>
              <p className={`text-2xl font-display font-bold ${summary.balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                {summary.balance >= 0 ? '+' : ''}{formatCurrency(summary.balance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Receitas - Despesas
              </p>
            </div>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Bar Chart */}
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-lg mb-6">Fluxo Mensal</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(215, 20%, 55%)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(215, 20%, 55%)"
                    fontSize={12}
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="received" name="Recebido" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paid" name="Pago" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Category Pie Chart */}
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-lg mb-6">Despesas por Categoria</h3>
            <div className="h-64">
              {categoryData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhuma despesa registrada
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="glass-card p-2 text-sm">
                              <p className="font-medium">{payload[0].name}</p>
                              <p className="text-muted-foreground">
                                {formatCurrency(payload[0].value as number)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span className="text-xs text-muted-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
        
        {/* Status Overview */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-lg mb-6">Visão por Status</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                <XAxis type="number" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="hsl(215, 20%, 55%)" 
                  fontSize={12}
                  width={100}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-card p-3 text-sm">
                          <p className="font-medium mb-2">{label}</p>
                          {payload.map((entry: any, index: number) => (
                            <p key={index} style={{ color: entry.color }}>
                              {entry.name}: {entry.value} contas
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="receivable" name="A Receber" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="payable" name="A Pagar" fill="hsl(0, 72%, 51%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;
