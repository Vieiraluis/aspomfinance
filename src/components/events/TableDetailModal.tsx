import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EventTableRow, EventSeatRow, useUpdateTableStatus, useReleaseTable, useUpdateTablePrice, useUpdateTableSeatsCount } from '@/hooks/useEventsData';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Lock, Unlock, ShieldCheck, Pencil, Save, Users } from 'lucide-react';

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
  const releaseTable = useReleaseTable();
  const updatePrice = useUpdateTablePrice();
  const updateSeats = useUpdateTableSeatsCount();
  const [editingPrice, setEditingPrice] = useState(false);
  const [editingSeats, setEditingSeats] = useState(false);
  const [newPrice, setNewPrice] = useState(String(table.price));
  const [newSeatsCount, setNewSeatsCount] = useState(String(table.seats_count));

  const availableSeats = seats.filter(s => s.status === 'available').length;
  const reservedSeats = seats.filter(s => s.status === 'reserved').length;

  const handleBlock = async () => {
    await updateStatus.mutateAsync({ tableId: table.id, status: 'blocked', eventId });
    onClose();
  };

  const handleRelease = async () => {
    if (table.status === 'reserved') {
      await releaseTable.mutateAsync({ tableId: table.id, eventId });
    } else {
      await updateStatus.mutateAsync({ tableId: table.id, status: 'available', eventId });
    }
    onClose();
  };

  const handleReserve = async () => {
    await updateStatus.mutateAsync({ tableId: table.id, status: 'reserved', eventId });
    onClose();
  };

  const handleSavePrice = async () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) return;
    await updatePrice.mutateAsync({ tableId: table.id, price, eventId });
    setEditingPrice(false);
  };

  const handleSaveSeats = async () => {
    const count = parseInt(newSeatsCount);
    if (isNaN(count) || count < 1) return;
    await updateSeats.mutateAsync({ tableId: table.id, seatsCount: count, eventId });
    setEditingSeats(false);
  };

  const isPending = updateStatus.isPending || releaseTable.isPending || updatePrice.isPending || updateSeats.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-xl">Mesa {String(table.table_number).padStart(2, '0')}</span>
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

          {/* Price editing */}
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-sm text-muted-foreground">Preço da Mesa</Label>
              {!editingPrice && (
                <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => { setNewPrice(String(table.price)); setEditingPrice(true); }}>
                  <Pencil className="w-3 h-3 mr-1" /> Editar
                </Button>
              )}
            </div>
            {editingPrice ? (
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  className="h-8"
                  min={0}
                  step={10}
                />
                <Button size="sm" className="h-8" onClick={handleSavePrice} disabled={isPending}>
                  <Save className="w-3 h-3 mr-1" /> Salvar
                </Button>
              </div>
            ) : (
              <p className="text-lg font-bold text-primary">{formatCurrency(table.price)}</p>
            )}
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-secondary/50 rounded-lg p-3">
              <span className="text-muted-foreground">Reservados</span>
              <p className="text-lg font-bold text-red-400">{reservedSeats}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <span className="text-muted-foreground">Área</span>
              <p className="text-lg font-bold">{AREA_LABEL[table.area]}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {table.status !== 'available' && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRelease}
                disabled={isPending}
              >
                <Unlock className="w-4 h-4 mr-2" />
                Liberar
              </Button>
            )}
            {table.status !== 'blocked' && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleBlock}
                disabled={isPending}
              >
                <Lock className="w-4 h-4 mr-2" />
                Bloquear
              </Button>
            )}
            {table.status === 'available' && (
              <Button
                className="flex-1"
                onClick={handleReserve}
                disabled={isPending}
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Reservar
              </Button>
            )}
          </div>

          {table.status === 'reserved' && (
            <p className="text-xs text-muted-foreground text-center">
              ⚠️ Ao liberar uma mesa reservada, os dados da reserva serão excluídos.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
