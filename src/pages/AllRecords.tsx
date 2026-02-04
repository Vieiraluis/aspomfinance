import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAccounts, useUpdateAccount } from '@/hooks/useSupabaseData';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AttachmentButtons } from '@/components/attachments/AttachmentButtons';
import { 
  Search, 
  Filter, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  FileText,
  Loader2
} from 'lucide-react';
import { 
  isBefore, 
  startOfDay, 
  isWithinInterval, 
  addDays, 
  isToday,
  differenceInDays,
} from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Account } from '@/types/financial';
import { toast } from '@/hooks/use-toast';

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Baixado',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
};

const statusStyles: Record<string, string> = {
  pending: 'bg-warning/20 text-warning border-warning/30',
  paid: 'bg-success/20 text-success border-success/30',
  overdue: 'bg-destructive/20 text-destructive border-destructive/30',
  cancelled: 'bg-muted text-muted-foreground border-muted-foreground/30',
};

const dueDateFilterOptions = [
  { value: 'all', label: 'Todas as datas' },
  { value: 'overdue', label: 'Vencidas' },
  { value: 'today', label: 'Vence hoje' },
  { value: 'next7days', label: 'Próximos 7 dias' },
  { value: 'next30days', label: 'Próximos 30 dias' },
  { value: 'custom', label: 'Período personalizado' },
];

const AllRecords = () => {
  const { data: accounts = [], isLoading } = useAccounts();
  const updateAccountMutation = useUpdateAccount();
  
  // Filters state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'payable' | 'receivable'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [dueDateFilter, setDueDateFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const pendingPayable = accounts.filter(a => a.type === 'payable' && (a.status === 'pending' || a.status === 'overdue'));
    const pendingReceivable = accounts.filter(a => a.type === 'receivable' && (a.status === 'pending' || a.status === 'overdue'));
    const overduePayable = pendingPayable.filter(a => isBefore(new Date(a.dueDate), today));
    const overdueReceivable = pendingReceivable.filter(a => isBefore(new Date(a.dueDate), today));
    const paidToday = accounts.filter(a => a.status === 'paid' && a.paidAt && isToday(new Date(a.paidAt)));
    
    return {
      totalPending: pendingPayable.length + pendingReceivable.length,
      totalOverdue: overduePayable.length + overdueReceivable.length,
      totalPaid: accounts.filter(a => a.status === 'paid').length,
      paidToday: paidToday.length,
      overduePayableAmount: overduePayable.reduce((sum, a) => sum + a.amount, 0),
      overdueReceivableAmount: overdueReceivable.reduce((sum, a) => sum + a.amount, 0),
    };
  }, [accounts]);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    const today = startOfDay(new Date());
    
    return accounts
      .filter((account) => {
        // Text search
        if (search && !account.description.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        
        // Type filter
        if (typeFilter !== 'all' && account.type !== typeFilter) {
          return false;
        }
        
        // Status filter
        if (statusFilter !== 'all') {
          const dueDate = startOfDay(new Date(account.dueDate));
          const isOverdue = account.status === 'pending' && isBefore(dueDate, today);
          
          if (statusFilter === 'overdue' && !isOverdue && account.status !== 'overdue') {
            return false;
          }
          if (statusFilter === 'pending' && (isOverdue || account.status !== 'pending')) {
            return false;
          }
          if (statusFilter === 'paid' && account.status !== 'paid') {
            return false;
          }
        }
        
        // Due date filter
        if (dueDateFilter !== 'all' && account.status !== 'paid' && account.status !== 'cancelled') {
          const dueDate = startOfDay(new Date(account.dueDate));
          
          switch (dueDateFilter) {
            case 'overdue':
              if (!isBefore(dueDate, today)) return false;
              break;
            case 'today':
              if (!isToday(dueDate)) return false;
              break;
            case 'next7days':
              if (!isWithinInterval(dueDate, { start: today, end: addDays(today, 7) })) return false;
              break;
            case 'next30days':
              if (!isWithinInterval(dueDate, { start: today, end: addDays(today, 30) })) return false;
              break;
            case 'custom':
              if (dateRange.from && dateRange.to) {
                if (!isWithinInterval(dueDate, { start: dateRange.from, end: dateRange.to })) return false;
              }
              break;
          }
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort by status priority (overdue first, then pending, then paid)
        const statusPriority = { overdue: 0, pending: 1, paid: 2, cancelled: 3 };
        const aStatus = a.status === 'pending' && isBefore(new Date(a.dueDate), today) ? 'overdue' : a.status;
        const bStatus = b.status === 'pending' && isBefore(new Date(b.dueDate), today) ? 'overdue' : b.status;
        
        if (statusPriority[aStatus] !== statusPriority[bStatus]) {
          return statusPriority[aStatus] - statusPriority[bStatus];
        }
        
        // Then by due date
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [accounts, search, typeFilter, statusFilter, dueDateFilter, dateRange]);

  const getDueDateBadge = (account: Account) => {
    if (account.status === 'paid' || account.status === 'cancelled') return null;
    
    const today = startOfDay(new Date());
    const dueDate = startOfDay(new Date(account.dueDate));
    const daysUntilDue = differenceInDays(dueDate, today);
    
    if (isBefore(dueDate, today)) {
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1">
          <AlertTriangle className="h-3 w-3" />
          {Math.abs(daysUntilDue)}d atrás
        </Badge>
      );
    }
    
    if (isToday(dueDate)) {
      return (
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 gap-1 animate-pulse">
          <Clock className="h-3 w-3" />
          Hoje
        </Badge>
      );
    }
    
    if (daysUntilDue <= 7) {
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1">
          <Clock className="h-3 w-3" />
          {daysUntilDue}d
        </Badge>
      );
    }
    
    return null;
  };

  const getEffectiveStatus = (account: Account) => {
    if (account.status === 'pending') {
      const today = startOfDay(new Date());
      const dueDate = startOfDay(new Date(account.dueDate));
      if (isBefore(dueDate, today)) {
        return 'overdue';
      }
    }
    return account.status;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Todos os Registros
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize e gerencie todas as contas em um só lugar
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPending}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalOverdue}</p>
                <p className="text-xs text-muted-foreground">Vencidas</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPaid}</p>
                <p className="text-xs text-muted-foreground">Baixados</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.paidToday}</p>
                <p className="text-xs text-muted-foreground">Baixados hoje</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overdue Alerts */}
        {stats.totalOverdue > 0 && (
          <div className="glass-card p-4 border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Atenção: {stats.totalOverdue} conta(s) vencida(s)</p>
                <p className="text-sm text-muted-foreground">
                  A pagar: {formatCurrency(stats.overduePayableAmount)} | 
                  A receber: {formatCurrency(stats.overdueReceivableAmount)}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setStatusFilter('overdue')}
              >
                Ver vencidas
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Type filter */}
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="payable">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    A Pagar
                  </div>
                </SelectItem>
                <SelectItem value="receivable">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    A Receber
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Status filter */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="overdue">Vencidas</SelectItem>
                <SelectItem value="paid">Baixados</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Due date filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start gap-2">
                  <Calendar className="h-4 w-4" />
                  {dueDateFilterOptions.find(o => o.value === dueDateFilter)?.label || 'Vencimento'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-2 space-y-1">
                  {dueDateFilterOptions.filter(o => o.value !== 'custom').map((option) => (
                    <Button
                      key={option.value}
                      variant={dueDateFilter === option.value ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setDueDateFilter(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <div className="border-t p-2">
                  <p className="text-xs text-muted-foreground mb-2 px-2">Período personalizado</p>
                  <CalendarComponent
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      setDateRange({ from: range?.from, to: range?.to });
                      if (range?.from && range?.to) {
                        setDueDateFilter('custom');
                      }
                    }}
                    className="pointer-events-auto"
                    numberOfMonths={1}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px]">Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Anexos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">Nenhum registro encontrado</p>
                      <p className="text-sm text-muted-foreground">Tente ajustar os filtros</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => {
                  const effectiveStatus = getEffectiveStatus(account);
                  const dueBadge = getDueDateBadge(account);
                  
                  return (
                    <TableRow 
                      key={account.id}
                      className={cn(
                        "transition-colors",
                        effectiveStatus === 'overdue' && "bg-destructive/5"
                      )}
                    >
                      <TableCell>
                        {account.type === 'payable' ? (
                          <div className="flex items-center gap-1">
                            <TrendingDown className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-muted-foreground">Pagar</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-success" />
                            <span className="text-xs text-muted-foreground">Receber</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{account.description}</p>
                          {account.supplierName && (
                            <p className="text-xs text-muted-foreground">{account.supplierName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {account.category}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{formatDate(account.dueDate)}</span>
                          {dueBadge}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(account.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn("border", statusStyles[effectiveStatus])}
                        >
                          {statusLabels[effectiveStatus]}
                        </Badge>
                        {account.paidAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Baixa: {formatDate(account.paidAt)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <AttachmentButtons
                          billingSlipUrl={account.billingSlipUrl}
                          paymentReceiptUrl={account.paymentReceiptUrl}
                          onBillingSlipChange={(url) => updateAccountMutation.mutate({ id: account.id, billingSlipUrl: url })}
                          onPaymentReceiptChange={(url) => updateAccountMutation.mutate({ id: account.id, paymentReceiptUrl: url })}
                          compact
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground text-center">
          Exibindo {filteredAccounts.length} de {accounts.length} registros
        </div>
      </div>
    </MainLayout>
  );
};

export default AllRecords;
