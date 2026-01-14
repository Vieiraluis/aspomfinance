import { useFinancialStore } from '@/store/financialStore';
import { formatCurrency } from '@/lib/format';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  payable: 'hsl(0, 72%, 51%)',
  receivable: 'hsl(142, 76%, 36%)',
};

export function BalanceChart() {
  const getSummary = useFinancialStore((state) => state.getSummary);
  const summary = getSummary();
  
  const data = [
    { name: 'A Receber', value: summary.totalReceivable, color: COLORS.receivable },
    { name: 'A Pagar', value: summary.totalPayable, color: COLORS.payable },
  ];
  
  const total = summary.totalReceivable + summary.totalPayable;
  
  if (total === 0) {
    return (
      <div className="glass-card p-6 h-full">
        <h3 className="font-display font-semibold text-lg mb-4">Balanço</h3>
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <p>Nenhuma conta registrada</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="glass-card p-6 h-full">
      <h3 className="font-display font-semibold text-lg mb-4">Balanço</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
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
                <span className="text-sm text-muted-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Saldo Projetado</span>
          <span className={cn(
            'font-semibold font-display text-lg',
            summary.balance >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {summary.balance >= 0 ? '+' : ''}{formatCurrency(summary.balance)}
          </span>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
