import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useFinancialStore } from '@/store/financialStore';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface CashFlowEntry {
  id: string;
  date: Date;
  description: string;
  type: 'inflow' | 'outflow';
  amount: number;
  bankAccountId?: string;
  bankAccountName?: string;
  balance: number;
}

const CashFlow = () => {
  const { accounts, bankAccounts } = useFinancialStore();
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('all');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  
  const activeBankAccounts = bankAccounts.filter(ba => ba.isActive);
  
  const cashFlowData = useMemo(() => {
    // Filtra contas pagas no período
    const paidAccounts = accounts.filter(a => {
      if (a.status !== 'paid' || !a.paidAt) return false;
      
      const paidDate = new Date(a.paidAt);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      const isInPeriod = isWithinInterval(paidDate, { start, end });
      const matchesBankAccount = selectedBankAccount === 'all' || a.bankAccountId === selectedBankAccount;
      
      return isInPeriod && matchesBankAccount;
    });
    
    // Transforma em entradas de fluxo de caixa
    const entries: CashFlowEntry[] = paidAccounts.map(a => {
      const bankAccount = bankAccounts.find(ba => ba.id === a.bankAccountId);
      return {
        id: a.id,
        date: new Date(a.paidAt!),
        description: a.description,
        type: a.type === 'receivable' ? 'inflow' : 'outflow',
        amount: a.amount,
        bankAccountId: a.bankAccountId,
        bankAccountName: bankAccount?.name,
        balance: 0, // Será calculado depois
      };
    });
    
    // Ordena por data
    entries.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Calcula saldo acumulado
    let runningBalance = selectedBankAccount === 'all'
      ? activeBankAccounts.reduce((sum, ba) => sum + ba.initialBalance, 0)
      : bankAccounts.find(ba => ba.id === selectedBankAccount)?.initialBalance || 0;
    
    // Calcula movimentações anteriores ao período para saldo inicial correto
    const previousMovements = accounts.filter(a => {
      if (a.status !== 'paid' || !a.paidAt) return false;
      const paidDate = new Date(a.paidAt);
      const start = new Date(startDate);
      const matchesBankAccount = selectedBankAccount === 'all' || a.bankAccountId === selectedBankAccount;
      return paidDate < start && matchesBankAccount;
    });
    
    previousMovements.forEach(a => {
      if (a.type === 'receivable') {
        runningBalance += a.amount;
      } else {
        runningBalance -= a.amount;
      }
    });
    
    const initialBalance = runningBalance;
    
    entries.forEach(entry => {
      if (entry.type === 'inflow') {
        runningBalance += entry.amount;
      } else {
        runningBalance -= entry.amount;
      }
      entry.balance = runningBalance;
    });
    
    return { entries, initialBalance, finalBalance: runningBalance };
  }, [accounts, bankAccounts, selectedBankAccount, startDate, endDate, activeBankAccounts]);
  
  const totalInflows = cashFlowData.entries
    .filter(e => e.type === 'inflow')
    .reduce((sum, e) => sum + e.amount, 0);
    
  const totalOutflows = cashFlowData.entries
    .filter(e => e.type === 'outflow')
    .reduce((sum, e) => sum + e.amount, 0);
  
  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Fluxo de Caixa
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe as entradas e saídas das suas contas
          </p>
        </div>
        
        {/* Filters */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Conta Bancária</Label>
              <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Contas</SelectItem>
                  {activeBankAccounts.map(ba => (
                    <SelectItem key={ba.id} value={ba.id}>{ba.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <Wallet className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Inicial</p>
              <p className={cn(
                "text-xl font-semibold",
                cashFlowData.initialBalance >= 0 ? "text-foreground" : "text-destructive"
              )}>
                {formatCurrency(cashFlowData.initialBalance)}
              </p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/20">
              <ArrowUpCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Entradas</p>
              <p className="text-xl font-semibold text-success">
                {formatCurrency(totalInflows)}
              </p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-destructive/20">
              <ArrowDownCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Saídas</p>
              <p className="text-xl font-semibold text-destructive">
                {formatCurrency(totalOutflows)}
              </p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-lg",
              cashFlowData.finalBalance >= 0 ? "bg-success/20" : "bg-destructive/20"
            )}>
              <Wallet className={cn(
                "w-5 h-5",
                cashFlowData.finalBalance >= 0 ? "text-success" : "text-destructive"
              )} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Final</p>
              <p className={cn(
                "text-xl font-semibold",
                cashFlowData.finalBalance >= 0 ? "text-success" : "text-destructive"
              )}>
                {formatCurrency(cashFlowData.finalBalance)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Table */}
        <div className="glass-card overflow-hidden">
          {cashFlowData.entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Wallet className="w-12 h-12 mb-3 opacity-50" />
              <p>Nenhuma movimentação no período</p>
              <p className="text-sm">Altere os filtros para ver outras movimentações</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Entrada</TableHead>
                  <TableHead className="text-right">Saída</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Initial Balance Row */}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={6} className="font-medium">
                    Saldo Inicial do Período
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-semibold",
                    cashFlowData.initialBalance >= 0 ? "text-foreground" : "text-destructive"
                  )}>
                    {formatCurrency(cashFlowData.initialBalance)}
                  </TableCell>
                </TableRow>
                
                {cashFlowData.entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell className="font-medium">{entry.description}</TableCell>
                    <TableCell>
                      {entry.bankAccountName || (
                        <span className="text-muted-foreground italic">Não especificada</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          entry.type === 'inflow'
                            ? 'bg-success/20 text-success border-success/30'
                            : 'bg-destructive/20 text-destructive border-destructive/30'
                        )}
                      >
                        <span className="flex items-center gap-1">
                          {entry.type === 'inflow' ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {entry.type === 'inflow' ? 'Entrada' : 'Saída'}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.type === 'inflow' && (
                        <span className="text-success font-medium">
                          {formatCurrency(entry.amount)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.type === 'outflow' && (
                        <span className="text-destructive font-medium">
                          {formatCurrency(entry.amount)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-semibold",
                      entry.balance >= 0 ? "text-foreground" : "text-destructive"
                    )}>
                      {formatCurrency(entry.balance)}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Final Balance Row */}
                <TableRow className="bg-muted/30 border-t-2">
                  <TableCell colSpan={4} className="font-semibold">
                    Saldo Final do Período
                  </TableCell>
                  <TableCell className="text-right font-semibold text-success">
                    {formatCurrency(totalInflows)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-destructive">
                    {formatCurrency(totalOutflows)}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-bold text-lg",
                    cashFlowData.finalBalance >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {formatCurrency(cashFlowData.finalBalance)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default CashFlow;
