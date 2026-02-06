import { useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAccounts } from '@/hooks/useSupabaseData';
import { formatCurrency, formatDate } from '@/lib/format';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
  ComposedChart,
} from 'recharts';
import { startOfMonth, endOfMonth, subMonths, format, isWithinInterval, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  FileDown,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReportConsolidated = () => {
  const { data: accounts = [], isLoading } = useAccounts();
  const [period, setPeriod] = useState<string>('6');
  const printRef = useRef<HTMLDivElement>(null);

  const periodMonths = parseInt(period);

  // Calculate monthly data
  const monthlyData = Array.from({ length: periodMonths }, (_, i) => {
    const date = subMonths(new Date(), periodMonths - 1 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    // Paid receivables (entries)
    const paidReceivables = accounts.filter((a) =>
      a.type === 'receivable' &&
      a.status === 'paid' &&
      a.paidAt &&
      isWithinInterval(new Date(a.paidAt), { start: monthStart, end: monthEnd })
    );

    // Paid payables (exits)
    const paidPayables = accounts.filter((a) =>
      a.type === 'payable' &&
      a.status === 'paid' &&
      a.paidAt &&
      isWithinInterval(new Date(a.paidAt), { start: monthStart, end: monthEnd })
    );

    const entries = paidReceivables.reduce((sum, a) => sum + a.amount, 0);
    const exits = paidPayables.reduce((sum, a) => sum + a.amount, 0);
    const balance = entries - exits;

    return {
      month: format(date, 'MMM/yy', { locale: ptBR }),
      fullMonth: format(date, 'MMMM/yyyy', { locale: ptBR }),
      entries,
      exits,
      balance,
      entryCount: paidReceivables.length,
      exitCount: paidPayables.length,
    };
  });

  // Totals
  const totalEntries = monthlyData.reduce((sum, m) => sum + m.entries, 0);
  const totalExits = monthlyData.reduce((sum, m) => sum + m.exits, 0);
  const totalBalance = totalEntries - totalExits;

  // Averages
  const avgEntries = totalEntries / periodMonths;
  const avgExits = totalExits / periodMonths;
  const avgBalance = totalBalance / periodMonths;

  // Cumulative balance
  const cumulativeData = monthlyData.map((item, index) => {
    const cumulativeBalance = monthlyData
      .slice(0, index + 1)
      .reduce((sum, m) => sum + m.balance, 0);
    return { ...item, cumulativeBalance };
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Relatório Consolidado',
  });

  const handleExportPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(33, 33, 33);
    doc.text('Relatório Consolidado Mensal', pageWidth / 2, 20, { align: 'center' });
    
    // Subtitle with period
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: Últimos ${period} meses`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, pageWidth / 2, 34, { align: 'center' });
    
    // Summary section
    doc.setFontSize(12);
    doc.setTextColor(33, 33, 33);
    doc.text('Resumo do Período', 14, 48);
    
    doc.setFontSize(10);
    doc.text(`Total de Entradas: ${formatCurrency(totalEntries)}`, 14, 56);
    doc.text(`Total de Saídas: ${formatCurrency(totalExits)}`, 14, 62);
    doc.text(`Saldo do Período: ${formatCurrency(totalBalance)}`, 14, 68);
    
    doc.text(`Média Mensal de Entradas: ${formatCurrency(avgEntries)}`, 105, 56);
    doc.text(`Média Mensal de Saídas: ${formatCurrency(avgExits)}`, 105, 62);
    doc.text(`Média Mensal de Saldo: ${formatCurrency(avgBalance)}`, 105, 68);
    
    // Monthly table
    doc.setFontSize(12);
    doc.text('Detalhamento Mensal', 14, 82);
    
    autoTable(doc, {
      startY: 88,
      head: [['Mês', 'Entradas', 'Saídas', 'Saldo', 'Saldo Acumulado']],
      body: cumulativeData.map((item) => [
        item.fullMonth.charAt(0).toUpperCase() + item.fullMonth.slice(1),
        formatCurrency(item.entries),
        formatCurrency(item.exits),
        formatCurrency(item.balance),
        formatCurrency(item.cumulativeBalance),
      ]),
      foot: [['TOTAIS', formatCurrency(totalEntries), formatCurrency(totalExits), formatCurrency(totalBalance), '-']],
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      footStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249],
      },
      theme: 'grid',
    });
    
    doc.save('relatorio-consolidado.pdf');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 text-sm border border-border">
          <p className="font-medium mb-2 text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Relatório Consolidado
            </h1>
            <p className="text-muted-foreground mt-1">
              Resumo mensal de entradas e saídas
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => handlePrint()}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            
            <Button onClick={handleExportPdf}>
              <FileDown className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="stat-card col-span-1">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-5 h-5 text-success" />
                <span className="text-xs text-muted-foreground">Total Entradas</span>
              </div>
              <p className="text-xl font-display font-bold text-success">
                {formatCurrency(totalEntries)}
              </p>
            </div>
          </div>
          
          <div className="stat-card col-span-1">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="w-5 h-5 text-destructive" />
                <span className="text-xs text-muted-foreground">Total Saídas</span>
              </div>
              <p className="text-xl font-display font-bold text-destructive">
                {formatCurrency(totalExits)}
              </p>
            </div>
          </div>
          
          <div className="stat-card col-span-1">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-5 h-5 text-primary" />
                <span className="text-xs text-muted-foreground">Saldo Período</span>
              </div>
              <p className={`text-xl font-display font-bold ${totalBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(totalBalance)}
              </p>
            </div>
          </div>
          
          <div className="stat-card col-span-1">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-success/70" />
                <span className="text-xs text-muted-foreground">Média Entradas</span>
              </div>
              <p className="text-xl font-display font-bold text-foreground">
                {formatCurrency(avgEntries)}
              </p>
            </div>
          </div>
          
          <div className="stat-card col-span-1">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-destructive/70" />
                <span className="text-xs text-muted-foreground">Média Saídas</span>
              </div>
              <p className="text-xl font-display font-bold text-foreground">
                {formatCurrency(avgExits)}
              </p>
            </div>
          </div>
          
          <div className="stat-card col-span-1">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-primary/70" />
                <span className="text-xs text-muted-foreground">Média Saldo</span>
              </div>
              <p className={`text-xl font-display font-bold ${avgBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(avgBalance)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Entries vs Exits */}
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-lg mb-6">
              Comparativo Entradas x Saídas
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                  />
                  <Bar 
                    dataKey="entries" 
                    name="Entradas" 
                    fill="hsl(142, 76%, 36%)" 
                    radius={[6, 6, 0, 0]} 
                  />
                  <Bar 
                    dataKey="exits" 
                    name="Saídas" 
                    fill="hsl(0, 72%, 51%)" 
                    radius={[6, 6, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Line Chart - Balance Evolution */}
          <div className="glass-card p-6">
            <h3 className="font-display font-semibold text-lg mb-6">
              Evolução do Saldo Mensal
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeData}>
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(168, 76%, 42%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    name="Saldo Mensal" 
                    stroke="hsl(168, 76%, 42%)" 
                    fill="url(#balanceGradient)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cumulativeBalance" 
                    name="Saldo Acumulado" 
                    stroke="hsl(217, 91%, 60%)" 
                    fill="url(#cumulativeGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Combined Chart */}
        <div className="glass-card p-6">
          <h3 className="font-display font-semibold text-lg mb-6">
            Visão Geral Consolidada
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="entries" 
                  name="Entradas" 
                  fill="hsl(142, 76%, 36%)" 
                  radius={[4, 4, 0, 0]} 
                  opacity={0.8}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="exits" 
                  name="Saídas" 
                  fill="hsl(0, 72%, 51%)" 
                  radius={[4, 4, 0, 0]} 
                  opacity={0.8}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="cumulativeBalance" 
                  name="Saldo Acumulado" 
                  stroke="hsl(217, 91%, 60%)" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(217, 91%, 60%)', strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Printable Content - Hidden */}
        <div className="hidden">
          <div ref={printRef} className="p-8 bg-white text-black min-h-screen">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">Relatório Consolidado Mensal</h1>
              <p className="text-gray-600 mt-2">Período: Últimos {period} meses</p>
              <p className="text-gray-500 text-sm">
                Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>
            
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-500">Total Entradas</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totalEntries)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Total Saídas</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(totalExits)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Saldo do Período</p>
                <p className={`text-lg font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalBalance)}
                </p>
              </div>
            </div>
            
            {/* Monthly Table */}
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="border p-2 text-left">Mês</th>
                  <th className="border p-2 text-right">Entradas</th>
                  <th className="border p-2 text-right">Saídas</th>
                  <th className="border p-2 text-right">Saldo</th>
                  <th className="border p-2 text-right">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {cumulativeData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border p-2 capitalize">{item.fullMonth}</td>
                    <td className="border p-2 text-right text-green-600">{formatCurrency(item.entries)}</td>
                    <td className="border p-2 text-right text-red-600">{formatCurrency(item.exits)}</td>
                    <td className={`border p-2 text-right ${item.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.balance)}
                    </td>
                    <td className={`border p-2 text-right ${item.cumulativeBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.cumulativeBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-700 text-white font-bold">
                  <td className="border p-2">TOTAIS</td>
                  <td className="border p-2 text-right">{formatCurrency(totalEntries)}</td>
                  <td className="border p-2 text-right">{formatCurrency(totalExits)}</td>
                  <td className="border p-2 text-right">{formatCurrency(totalBalance)}</td>
                  <td className="border p-2 text-right">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ReportConsolidated;
