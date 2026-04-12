import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  EventTableRow,
  EventReservationRow,
  ReservationItemRow,
  useCheckinReservation,
} from '@/hooks/useEventsData';
import { formatCurrency } from '@/lib/format';
import { CheckCircle, Ticket, User, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  reservations: EventReservationRow[];
  reservationItems: ReservationItemRow[];
  tables: EventTableRow[];
  eventId: string;
}

export function ReservationsList({ reservations, reservationItems, tables, eventId }: Props) {
  const [search, setSearch] = useState('');
  const checkin = useCheckinReservation();

  const tableMap = useMemo(() => new Map(tables.map(t => [t.id, t])), [tables]);

  const grouped = useMemo(() => {
    return reservations
      .filter(r => !search || r.client_name.toLowerCase().includes(search.toLowerCase()))
      .map(res => {
        const items = reservationItems.filter(i => i.reservation_id === res.id);
        const tableNumbers = items
          .map(i => tableMap.get(i.table_id)?.table_number)
          .filter(Boolean)
          .sort((a, b) => a! - b!) as number[];
        return { ...res, tableNumbers };
      });
  }, [reservations, reservationItems, tableMap, search]);

  const handleCheckin = (reservationId: string) => {
    checkin.mutate({ reservationId, eventId });
  };

  if (reservations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Ticket className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Nenhuma reserva realizada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Reservas ({reservations.length})</span>
        </CardTitle>
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mt-2"
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {grouped.map(res => (
          <div key={res.id} className="bg-secondary/50 rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-bold">{res.client_name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {res.client_document || 'Sem documento'} • {res.client_phone || 'Sem telefone'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(res.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary text-lg">{formatCurrency(res.total_amount)}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant={res.status === 'confirmed' ? 'default' : 'secondary'}>
                    {res.status === 'confirmed' ? 'Confirmada' : res.status}
                  </Badge>
                  {res.checked_in && (
                    <Badge variant="outline" className="text-emerald-400 border-emerald-400">
                      Check-in ✓
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Table numbers grouped */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Mesas:</span>
              {res.tableNumbers.map(num => (
                <Badge key={num} variant="outline" className="text-xs">
                  {String(num).padStart(2, '0')}
                </Badge>
              ))}
            </div>

            {/* Payment method */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CreditCard className="w-3 h-3" />
              {res.payment_method === 'pix' ? 'PIX' : res.payment_method === 'card' ? 'Cartão' : res.payment_method === 'cash' ? 'Dinheiro' : res.payment_method}
            </div>

            {/* QR Code & Checkin */}
            <div className="flex items-center gap-2 pt-1">
              {res.qr_code && (
                <span className="text-[10px] font-mono text-muted-foreground bg-background rounded px-2 py-0.5">
                  {res.qr_code}
                </span>
              )}
              {!res.checked_in && res.status === 'confirmed' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto text-xs h-7"
                  onClick={() => handleCheckin(res.id)}
                  disabled={checkin.isPending}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Check-in
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
