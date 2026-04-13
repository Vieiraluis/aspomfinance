import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { EventTableRow, EventSeatRow } from '@/hooks/useEventsData';
import { formatCurrency } from '@/lib/format';
import { TableDetailModal } from './TableDetailModal';

interface TableMapASPOMProps {
  tables: EventTableRow[];
  seats: EventSeatRow[];
  eventId: string;
  selectedTables: string[];
  onToggleTable: (tableId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 shadow-emerald-500/30',
  reserved: 'bg-red-500 hover:bg-red-400 border-red-400 shadow-red-500/30',
  blocked: 'bg-muted-foreground/40 border-muted-foreground/30',
};

const AREA_LABELS: Record<string, string> = {
  vip: 'VIP',
  premium: 'Premium',
  standard: 'Padrão',
  economy: 'Econômica',
};

const AREA_BADGE: Record<string, string> = {
  vip: 'text-amber-400',
  premium: 'text-purple-400',
  standard: 'text-blue-400',
  economy: 'text-muted-foreground',
};

export function TableMapASPOM({ tables, seats, eventId, selectedTables, onToggleTable }: TableMapASPOMProps) {
  const [detailTable, setDetailTable] = useState<EventTableRow | null>(null);

  const byNumber = useMemo(() => new Map(tables.map(t => [t.table_number, t])), [tables]);

  const seatsByTable = useMemo(() => {
    const map = new Map<string, EventSeatRow[]>();
    seats.forEach(s => {
      if (!map.has(s.table_id)) map.set(s.table_id, []);
      map.get(s.table_id)!.push(s);
    });
    return map;
  }, [seats]);

  // LEFT: Tables 01-40, 4 cols x 10 rows.
  // Column order: rightmost (near pista) = 01-10, leftmost = 31-40
  // Each column: top = highest number, bottom = lowest (nearest entrance/palco)
  const entranceCols = useMemo(() => [
    Array.from({ length: 10 }, (_, i) => byNumber.get(40 - i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 10 }, (_, i) => byNumber.get(30 - i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 10 }, (_, i) => byNumber.get(20 - i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 10 }, (_, i) => byNumber.get(10 - i)).filter(Boolean) as EventTableRow[],
  ], [byNumber]);

  // RIGHT: Tables 41-88, 4 cols x 12 rows (top to bottom)
  const rightCols = useMemo(() => [
    Array.from({ length: 12 }, (_, i) => byNumber.get(41 + i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 12 }, (_, i) => byNumber.get(53 + i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 12 }, (_, i) => byNumber.get(65 + i)).filter(Boolean) as EventTableRow[],
    Array.from({ length: 12 }, (_, i) => byNumber.get(77 + i)).filter(Boolean) as EventTableRow[],
  ], [byNumber]);

  // TOP CENTER: Tables 89-123 (35 tables) - 7 rows x 5 cols
  // Row closest to pista (bottom) = 89-93, top row = 119-123
  const topRows = useMemo(() => {
    const rows: EventTableRow[][] = [];
    for (let r = 6; r >= 0; r--) {
      const row: EventTableRow[] = [];
      for (let c = 0; c < 5; c++) {
        const num = 89 + r * 5 + c;
        if (num <= 123) {
          const t = byNumber.get(num);
          if (t) row.push(t);
        }
      }
      rows.push(row);
    }
    return rows;
  }, [byNumber]);

  const renderTable = (table: EventTableRow) => {
    const isSelected = selectedTables.includes(table.id);
    const tableSeats = seatsByTable.get(table.id) || [];
    const availableSeats = tableSeats.filter(s => s.status === 'available').length;

    return (
      <button
        key={table.id}
        onClick={(e) => {
          if (e.detail === 2) {
            setDetailTable(table);
          } else {
            if (table.status === 'available') {
              onToggleTable(table.id);
            } else {
              setDetailTable(table);
            }
          }
        }}
        className={cn(
          'relative w-7 h-7 rounded border-[1.5px] flex flex-col items-center justify-center font-bold transition-all duration-150 shadow-sm',
          STATUS_COLORS[table.status] || STATUS_COLORS.available,
          isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-110 z-10',
          table.status === 'blocked' && 'cursor-not-allowed opacity-60',
        )}
        title={`Mesa ${table.table_number} - ${AREA_LABELS[table.area]} - ${formatCurrency(table.price)}`}
      >
        <span className="text-[8px] font-bold leading-none text-foreground drop-shadow-sm">
          {String(table.table_number).padStart(2, '0')}
        </span>
        {table.status === 'available' && (
          <span className="text-[5px] leading-none opacity-80">{availableSeats}</span>
        )}
      </button>
    );
  };

  const renderColumn = (col: EventTableRow[]) => (
    <div className="flex flex-col gap-px">
      {col.map(renderTable)}
    </div>
  );

  return (
    <div className="space-y-1.5">
      {/* Title + Legend inline */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-bold text-primary tracking-wide">🏟️ Ginásio Principal</h2>
        <div className="flex flex-wrap gap-2 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-400" />
            <span className="text-muted-foreground">Disponível</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-red-500 border border-red-400" />
            <span className="text-muted-foreground">Reservado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-muted-foreground/40 border border-muted-foreground/30" />
            <span className="text-muted-foreground">Bloqueado</span>
          </div>
          <div className="border-l border-border pl-2 flex gap-1.5">
            {Object.entries(AREA_LABELS).map(([key, label]) => (
              <span key={key} className={cn('font-medium', AREA_BADGE[key])}>{label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Map Container - Compact */}
      <div className="relative bg-card border border-border rounded-xl p-2">
        <div className="flex flex-col gap-1">

          {/* TOP ROW: Tables 89-123 centered + Bar/WC top-right */}
          <div className="flex items-start">
            <div className="flex-1" />
            <div className="flex flex-col items-center">
              <div className="text-[8px] text-muted-foreground mb-0.5">Mesas 89-123</div>
              <div className="flex flex-col gap-px items-center">
                {topRows.map((row, i) => (
                  <div key={`tr-${i}`} className="flex gap-px">
                    {row.map(renderTable)}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 flex justify-end gap-1.5 pt-1">
              <div className="animate-pulse bg-secondary/60 rounded px-2 py-1 text-[9px] text-muted-foreground flex items-center gap-0.5 border border-border">
                🍺 <span className="font-semibold">Bar</span>
              </div>
              <div className="animate-pulse bg-secondary/60 rounded px-2 py-1 text-[9px] text-muted-foreground flex items-center gap-0.5 border border-border">
                🚹 <span className="font-semibold">WC</span>
              </div>
            </div>
          </div>

          {/* MIDDLE ROW: Left tables 01-40 | PISTA DE DANÇA (center) | Tables 41-88 (right) */}
          <div className="flex gap-1.5 items-stretch">
            {/* Tables 01-40 */}
            <div className="flex flex-col items-center shrink-0">
              <div className="text-[8px] text-muted-foreground mb-0.5">01-40</div>
              <div className="flex gap-px">
                {entranceCols.map((col, i) => (
                  <div key={`ecol-${i}`}>{renderColumn(col)}</div>
                ))}
              </div>
            </div>

            {/* PISTA DE DANÇA (center) */}
            <div className="flex-1 flex items-center justify-center min-w-[120px]">
              <div className="border-2 border-dashed border-primary/30 rounded-xl px-3 py-4 flex items-center justify-center w-full max-w-[180px] min-h-[160px] animate-[pulse_3s_ease-in-out_infinite] bg-primary/5">
                <span className="text-xs font-bold text-primary/70 tracking-widest">
                  💃 PISTA
                </span>
              </div>
            </div>

            {/* Tables 41-88 */}
            <div className="flex flex-col items-center shrink-0">
              <div className="text-[8px] text-muted-foreground mb-0.5">41-88</div>
              <div className="flex gap-px">
                {rightCols.map((col, i) => (
                  <div key={`rcol-${i}`}>{renderColumn(col)}</div>
                ))}
              </div>
            </div>
          </div>

          {/* BOTTOM ROW: Entrance + PALCO */}
          <div className="flex items-end justify-center gap-0.5">
            <div className="shrink-0">
              <div className="animate-bounce bg-secondary/80 border-[1.5px] border-primary/50 rounded-lg px-2 py-1 shadow-sm">
                <span className="text-[9px] font-bold text-primary">🚪 ENTRADA</span>
              </div>
            </div>
            <div className="shrink-0">
              <div className="bg-secondary border-[1.5px] border-primary/40 rounded-lg px-10 py-1.5 text-center shadow-sm animate-[pulse_4s_ease-in-out_infinite]">
                <span className="text-xs font-bold text-primary tracking-widest">🎵 PALCO</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Detail Modal */}
      {detailTable && (
        <TableDetailModal
          table={detailTable}
          seats={seatsByTable.get(detailTable.id) || []}
          eventId={eventId}
          open={!!detailTable}
          onClose={() => setDetailTable(null)}
        />
      )}
    </div>
  );
}