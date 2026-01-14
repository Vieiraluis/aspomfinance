import { useFinancialStore } from '@/store/financialStore';
import { format, isBefore, startOfDay, isToday, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export function UpcomingAccounts() {
  const accounts = useFinancialStore((state) => state.accounts);
  const today = startOfDay(new Date());
  const nextWeek = addDays(today, 7);
  
  const upcoming = accounts
    .filter((a) => a.status === 'pending' || a.status === 'overdue')
    .filter((a) => isBefore(new Date(a.dueDate), nextWeek))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 6);
  
  if (upcoming.length === 0) {
    return (
      <div className="glass-card p-6 h-full">
        <h3 className="font-display font-semibold text-lg mb-4">Próximos Vencimentos</h3>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mb-3 text-success/50" />
          <p>Nenhuma conta próxima do vencimento</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="glass-card p-6 h-full">
      <h3 className="font-display font-semibold text-lg mb-4">Próximos Vencimentos</h3>
      <div className="space-y-3">
        {upcoming.map((account) => {
          const dueDate = new Date(account.dueDate);
          const isOverdue = isBefore(dueDate, today) && !isToday(dueDate);
          const isDueToday = isToday(dueDate);
          
          return (
            <div
              key={account.id}
              className={cn(
                'p-4 rounded-lg border transition-all hover:scale-[1.02]',
                isOverdue 
                  ? 'bg-destructive/10 border-destructive/30' 
                  : isDueToday 
                    ? 'bg-warning/10 border-warning/30'
                    : 'bg-muted/30 border-border/50'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isOverdue ? (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    ) : isDueToday ? (
                      <Clock className="w-4 h-4 text-warning" />
                    ) : null}
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      account.type === 'payable' 
                        ? 'bg-destructive/20 text-destructive' 
                        : 'bg-success/20 text-success'
                    )}>
                      {account.type === 'payable' ? 'Pagar' : 'Receber'}
                    </span>
                  </div>
                  <p className="font-medium text-foreground line-clamp-1">
                    {account.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(dueDate, "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <p className={cn(
                  'font-semibold',
                  account.type === 'payable' ? 'text-destructive' : 'text-success'
                )}>
                  {formatCurrency(account.amount)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
