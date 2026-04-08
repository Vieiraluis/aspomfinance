import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventTableRow, EventSeatRow, useUpdateTableStatus } from '@/hooks/useEventsData';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Lock, Unlock, ShieldCheck } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  available: 'Disponível',
  reserved: 'Reservado',
  blocked: 'Bloqueado',
};

const AREA_LABEL: Record<string, string> = {
  vip: 'VIP',
  premium: 'Premium',
  standard: 'Padrão',
  economy: 'Econômica',
};

interface Props {
  table: EventTableRow;
  seats: EventSeatRow[];
  eventId: string;
  open: boolean;
  onClose: () => void;
}

export function TableDetailModal({ table, seats, eventId, open, onClose }: Props) {
  const updateStatus = useUpdateTableStatus();
  const availableSeats = seats.filter(s => s.status === 'available').length;
  const reservedSeats = seats.filter(s => s.status === 'reserved').length;

  const handleStatusChange = async (status: string) => {
    await updateStatus.mutateAsync({ tableId: table.id, status, eventId });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-xl">Mesa {table.table_number}</span>
            <Badge variant={table.status === 'available' ? 'default' : table.status === 'reserved' ? 'destructive' : 'secondary'}>
              {STATUS_LABEL[table.status]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Área {AREA_LABEL[table.area]} • {formatCurrency(table.price)} por mesa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seats grid */}
          <div>
            <h4 className="text-sm font-medium mb-2">
              Assentos ({availableSeats} disponíveis / {seats.length} total)
            </h4>
            <div className="flex flex-wrap gap-2">
              {seats.map(seat => (
                <div
                  key={seat.id}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors',
                    seat.status === 'available' && 'bg-emerald-500/20 border-emerald-500 text-emerald-400',
                    seat.status === 'reserved' && 'bg-red-500/20 border-red-500 text-red-400',
                    seat.status === 'blocked' && 'bg-muted border-muted-foreground/30 text-muted-foreground',
                  )}
                >
                  {seat.seat_number}
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-secondary/50 rounded-lg p-3">
              <span className="text-muted-foreground">Reservados</span>
              <p className="text-lg font-bold text-red-400">{reservedSeats}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <span className="text-muted-foreground">Preço</span>
              <p className="text-lg font-bold text-primary">{formatCurrency(table.price)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {table.status !== 'available' && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleStatusChange('available')}
                disabled={updateStatus.isPending}
              >
                <Unlock className="w-4 h-4 mr-2" />
                Liberar
              </Button>
            )}
            {table.status !== 'blocked' && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => handleStatusChange('blocked')}
                disabled={updateStatus.isPending}
              >
                <Lock className="w-4 h-4 mr-2" />
                Bloquear
              </Button>
            )}
            {table.status === 'available' && (
              <Button
                className="flex-1"
                onClick={() => handleStatusChange('reserved')}
                disabled={updateStatus.isPending}
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Reservar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
