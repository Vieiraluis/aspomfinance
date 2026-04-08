import { Card, CardContent } from '@/components/ui/card';
import { EventTableRow, EventReservationRow } from '@/hooks/useEventsData';
import { formatCurrency } from '@/lib/format';
import { BarChart3, Users, DollarSign, Percent } from 'lucide-react';

interface Props {
  tables: EventTableRow[];
  reservations: EventReservationRow[];
}

export function EventDashboard({ tables, reservations }: Props) {
  const totalTables = tables.length;
  const reservedTables = tables.filter(t => t.status === 'reserved').length;
  const availableTables = tables.filter(t => t.status === 'available').length;
  const blockedTables = tables.filter(t => t.status === 'blocked').length;
  const occupancyRate = totalTables > 0 ? ((reservedTables / totalTables) * 100).toFixed(1) : '0';
  const totalRevenue = reservations
    .filter(r => r.status === 'confirmed')
    .reduce((sum, r) => sum + r.total_amount, 0);

  const stats = [
    {
      label: 'Faturamento',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Mesas Vendidas',
      value: reservedTables.toString(),
      subtitle: `de ${totalTables}`,
      icon: BarChart3,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    {
      label: 'Disponíveis',
      value: availableTables.toString(),
      subtitle: blockedTables > 0 ? `${blockedTables} bloqueadas` : undefined,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Ocupação',
      value: `${occupancyRate}%`,
      icon: Percent,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(stat => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
