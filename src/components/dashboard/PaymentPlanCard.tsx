import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAccounts } from '@/hooks/useSupabaseData';
import { formatCurrency } from '@/lib/format';
import { sumMoney } from '@/lib/money';
import { priorityConfig, priorityOrder, getPriority, daysOverdue } from '@/lib/paymentPriority';
import { Button } from '@/components/ui/button';
import { ListChecks, ArrowRight } from 'lucide-react';

const waveText: Record<string, string> = {
  critical: '1ª onda (imediata): salários, encargos e tributos.',
  high: '2ª onda (até 7 dias): concessionárias, aluguel e bancos.',
  medium: '3ª onda (até 15 dias): fornecedores e serviços.',
  low: '4ª onda (conforme caixa): despesas adiáveis.',
};

export function PaymentPlanCard() {
  const { data: accounts = [] } = useAccounts();

  const groups = useMemo(() => {
    const open = accounts.filter(
      (a) => a.type === 'payable' && (a.status === 'pending' || a.status === 'overdue')
    );
    return priorityOrder.map((level) => {
      const items = open.filter((a) => getPriority(a) === level);
      return {
        level,
        config: priorityConfig[level],
        count: items.length,
        total: sumMoney(items, (a) => a.amount),
        overdueCount: items.filter((a) => daysOverdue(a) > 0).length,
      };
    });
  }, [accounts]);

  const total = sumMoney(groups, (g) => g.total);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary" />
          <h2 className="font-display font-semibold text-foreground">
            Plano de Organização dos Pagamentos
          </h2>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/reports/payables">
            Ver relatório <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {groups.map((g) => (
          <div
            key={g.level}
            className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
          >
            <span
              className="mt-1 h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: g.config.hex }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{g.config.label}</span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {formatCurrency(g.total)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{waveText[g.level]}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {g.count} título(s) · {g.overdueCount} vencido(s)
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <span className="text-sm text-muted-foreground">Total em aberto</span>
        <span className="font-mono font-bold text-foreground">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
